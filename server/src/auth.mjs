import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { randomBytes, createHash } from "node:crypto";
import { pool, transaction, problem } from "./db.mjs";
import { config } from "./config.mjs";
const cookie = "jobfair_session",
  hash = (s) => createHash("sha256").update(s).digest("hex");
const options = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};
export async function loadUser(req, _res, next) {
  try {
    const token = req.cookies?.[cookie];
    if (typeof token !== "string" || !/^[A-Za-z0-9_-]{32,128}$/.test(token))
      return next();
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.avatar_url,
              ARRAY(SELECT role::text FROM public.user_roles WHERE user_id=u.id) AS roles,
              COALESCE((SELECT value ? split_part(u.email, '@', 2)
                        FROM identity.settings WHERE key='board_domains'), false) AS board_domain,
              public.is_email_approved(u.email) AS approved,
              public.can_view_cv_database(u.id) AS cv
       FROM identity.sessions s JOIN identity.users u ON u.id=s.user_id
       WHERE s.token_hash=$1 AND s.expires_at>now()`,
      [hash(token)],
    );
    const [user] = rows;
    if (user) {
      const admin = user.roles.includes("admin");
      req.user = {
        id: user.id,
        email: user.email,
        user_metadata: { full_name: user.full_name, avatar_url: user.avatar_url },
        roles: user.roles,
        admin,
        board: admin || user.board_domain,
        approved: admin || user.approved,
        canCv: user.cv,
      };
    }
    next();
  } catch (e) {
    next(e);
  }
}
export function csrf(req, _res, next) {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    (req.get("origin") !== new URL(config.APP_ORIGIN).origin ||
      req.get("x-jobfair-request") !== "1")
  )
    return next(problem(403, "Invalid request origin"));
  next();
}
const router = Router();
router.get("/config", (_req, res) =>
  res.json({
    data: {
      google: !!(
        config.GOOGLE_CLIENT_ID &&
        config.GOOGLE_CLIENT_SECRET &&
        config.GOOGLE_CALLBACK_URL
      ),
    },
    error: null,
  }),
);
router.get("/session", (req, res) =>
  res.set("Cache-Control", "no-store").json({
    data: { session: req.user ? { user: req.user } : null },
    error: null,
  }),
);
router.post("/logout", async (req, res) => {
  if (req.cookies[cookie])
    await pool.query("DELETE FROM identity.sessions WHERE token_hash=$1", [
      hash(req.cookies[cookie]),
    ]);
  res.clearCookie(cookie, options);
  res.json({ data: null, error: null });
});
function google() {
  if (
    !config.GOOGLE_CLIENT_ID ||
    !config.GOOGLE_CLIENT_SECRET ||
    !config.GOOGLE_CALLBACK_URL
  )
    throw problem(503, "Google prijava još nije konfigurirana");
  return new OAuth2Client(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_CALLBACK_URL,
  );
}
router.get("/google/start", async (req, res) => {
  const client = google();
  const redirect = String(req.query.returnTo ?? "/auth");
  if (!/^\/(?!\/)/.test(redirect) || redirect.includes("\\"))
    throw problem(400, "Invalid return path");
  const state = randomBytes(32).toString("hex");
  const { codeVerifier, codeChallenge } =
    await client.generateCodeVerifierAsync();
  res.cookie(
    "jobfair_oauth",
    JSON.stringify({ state, codeVerifier, redirect }),
    { ...options, signed: true, maxAge: 600000, path: "/api/v1/auth/google" },
  );
  res.redirect(
    client.generateAuthUrl({
      scope: ["openid", "email", "profile"],
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "select_account",
    }),
  );
});
router.get("/google/callback", async (req, res) => {
  const client = google();
  const raw = req.signedCookies?.jobfair_oauth;
  if (!raw) throw problem(400, "Prijava je istekla");
  const state = JSON.parse(raw);
  res.clearCookie("jobfair_oauth", { ...options, path: "/api/v1/auth/google" });
  if (
    typeof req.query.state !== "string" ||
    req.query.state !== state.state ||
    typeof req.query.code !== "string"
  )
    throw problem(400, "Invalid OAuth response");
  const { tokens } = await client.getToken({
    code: req.query.code,
    codeVerifier: state.codeVerifier,
  });
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: config.GOOGLE_CLIENT_ID,
  });
  const p = ticket.getPayload();
  if (!p?.email_verified || !p.email || !p.sub)
    throw problem(401, "Email nije potvrđen");
  const email = p.email.toLowerCase();
  const u = await transaction(null, async (db) => {
    const current = (
      await db.query(
        "SELECT * FROM identity.users WHERE lower(email)=$1 FOR UPDATE",
        [email],
      )
    ).rows[0];
    if (current?.google_sub && current.google_sub !== p.sub)
      throw problem(401, "Identitet naloga se ne podudara");
    const row = current
      ? (
          await db.query(
            "UPDATE identity.users SET google_sub=$2,full_name=$3,avatar_url=$4 WHERE id=$1 RETURNING *",
            [current.id, p.sub, p.name ?? null, p.picture ?? null],
          )
        ).rows[0]
      : (
          await db.query(
            "INSERT INTO identity.users(email,google_sub,full_name,avatar_url) VALUES($1,$2,$3,$4) RETURNING *",
            [email, p.sub, p.name ?? null, p.picture ?? null],
          )
        ).rows[0];
    await db.query(
      "INSERT INTO profiles(id,full_name,avatar_url) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING",
      [row.id, row.full_name, row.avatar_url],
    );
    const admins =
      (
        await db.query(
          "SELECT value FROM identity.settings WHERE key='admin_emails'",
        )
      ).rows[0]?.value ?? [];
    if (admins.includes(email))
      await db.query(
        "INSERT INTO user_roles(user_id,role) VALUES($1,'admin') ON CONFLICT DO NOTHING",
        [row.id],
      );
    return row;
  });
  const token = randomBytes(32).toString("base64url"),
    maxAge = config.SESSION_DAYS * 86400000;
  await pool.query(
    "INSERT INTO identity.sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)",
    [hash(token), u.id, new Date(Date.now() + maxAge)],
  );
  res.cookie(cookie, token, { ...options, maxAge });
  res.redirect(new URL(state.redirect, config.APP_ORIGIN).toString());
});
export default router;
