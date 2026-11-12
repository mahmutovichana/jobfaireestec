import { problem } from "./db.mjs";
export const publicColumns = {
  public_team_members: [
    "id",
    "name",
    "role",
    "committee",
    "photo_url",
    "photo_crop",
    "linkedin_url",
    "display_order",
    "visible",
    "year",
    "created_at",
    "updated_at",
    "gender",
    "position_key",
  ],
  public_company_profiles: [
    "id",
    "company",
    "company_description",
    "website",
    "avatar_url",
    "social_links",
    "company_slug",
  ],
  partner_participations: ["id", "partner_id", "year", "package", "created_at"],
};
const publicReads = {
  events: "status='live'",
  news_posts: "published=true",
  job_ads: "published=true",
  partners: "visible=true",
  gallery_images: "visible=true",
  package_types: "true",
  public_team_members: "true",
  public_company_profiles: "true",
  partner_participations:
    "EXISTS (SELECT 1 FROM partners p WHERE p.id=partner_id AND p.visible=true)",
  form_fields:
    "EXISTS (SELECT 1 FROM events e WHERE e.id=event_id AND e.status='live')",
};
export const publicInsertFields = {
  access_requests: [
    "email",
    "full_name",
    "company_name",
    "company_domain",
    "message",
  ],
  company_inquiries: [
    "company_name",
    "contact_person",
    "email",
    "phone",
    "message",
    "interest_type",
  ],
  cv_submissions: [
    "full_name",
    "email",
    "phone",
    "faculty",
    "year_of_study",
    "cv_url",
  ],
  page_views: ["path", "referrer", "referrer_domain", "user_agent"],
  performance_metrics: [
    "path",
    "metric_name",
    "metric_value",
    "rating",
    "session_id",
    "user_agent",
  ],
};
export function scope(table, operation, user, bind) {
  const board = user?.board === true;
  if (
    operation !== "select" &&
    (table === "user_roles" ||
      (table === "access_requests" && operation !== "insert")) &&
    !user?.admin
  )
    throw problem(403, "Samo administrator može mijenjati pristup");
  if (operation === "select") {
    if (board && !table.startsWith("email_") && table !== "suppressed_emails")
      return "true";
    if (table === "user_roles" || table === "profiles")
      return user
        ? `user_id_placeholder`.replace(
            "user_id_placeholder",
            `${table === "profiles" ? "id" : "user_id"}=${bind(user.id)}`,
          )
        : "false";
    if (table === "cv_submissions") return user?.canCv ? "true" : "false";
    if (table === "events" && user?.approved)
      return `(status='live' OR user_id=${bind(user.id)})`;
    if (table === "registrations" && user?.approved)
      return `EXISTS (SELECT 1 FROM events e WHERE e.id=event_id AND e.user_id=${bind(user.id)})`;
    return publicReads[table] ?? "false";
  }
  if (operation === "insert" && publicInsertFields[table]) return "true";
  if (!user) throw problem(401, "Prijava je obavezna");
  if (
    [
      "email_send_log",
      "email_send_state",
      "email_templates",
      "email_unsubscribe_tokens",
      "suppressed_emails",
    ].includes(table)
  )
    throw problem(403, "Service-only table");
  if (board) return "true";
  if (table === "profiles") return `id=${bind(user.id)}`;
  if (
    user.approved &&
    ["events", "news_posts", "job_ads", "partners"].includes(table)
  )
    return `user_id=${bind(user.id)}`;
  if (user.approved && table === "form_fields")
    return `EXISTS (SELECT 1 FROM events e WHERE e.id=event_id AND e.user_id=${bind(user.id)})`;
  if (user.approved && table === "registrations" && operation === "update")
    return `EXISTS (SELECT 1 FROM events e WHERE e.id=event_id AND e.user_id=${bind(user.id)})`;
  if (table === "audit_logs" && operation === "insert")
    return `actor_id=${bind(user.id)}`;
  throw problem(403, "Nemate ovlasti za ovu radnju");
}
export function validateWrite(table, row, op, user) {
  if (op === "insert" && publicInsertFields[table]) {
    if (Object.keys(row).some((k) => !publicInsertFields[table].includes(k)))
      throw problem(400, "Nedozvoljeno polje");
  }
  if (!user?.board) {
    if ("user_id" in row && row.user_id !== user?.id)
      throw problem(403, "Neispravan vlasnik");
    if (table === "profiles" && row.id !== undefined && row.id !== user?.id)
      throw problem(403, "Neispravan profil");
    if (table === "partners" && op === "insert" && row.visible === true)
      throw problem(403, "Partner zahtijeva odobrenje");
    if (
      table === "audit_logs" &&
      (row.actor_id !== user?.id || row.actor_email !== user?.email)
    )
      throw problem(403, "Neispravan autor");
  }
  if (
    op === "update" &&
    ["id", "user_id", "actor_id", "created_at"].some((k) => k in row)
  )
    throw problem(400, "Identitet zapisa se ne može mijenjati");
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === "string" && v.length > 100000)
      throw problem(400, "Preduga vrijednost");
    if (
      k !== "cv_url" &&
      /url$|website|external_link/.test(k) &&
      typeof v === "string" &&
      v &&
      !v.startsWith("/") &&
      !/^https?:\/\//i.test(v)
    )
      throw problem(400, "Neispravan URL");
  }
  if ("email" in row && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email ?? ""))
    throw problem(400, "Neispravan email");
  if (op === "insert") {
    const length = (field, min, max) => {
      if (
        typeof row[field] !== "string" ||
        row[field].trim().length < min ||
        row[field].length > max
      )
        throw problem(400, "Neispravno polje: " + field);
    };
    if (["access_requests", "cv_submissions"].includes(table))
      length("full_name", 2, 200);
    if (table === "company_inquiries") {
      length("company_name", 1, 200);
      length("contact_person", 2, 200);
      length("message", 1, 4000);
    }
    if (
      table === "cv_submissions" &&
      (typeof row.cv_url !== "string" ||
        !/^submissions\/[\w-]{16,}\/[\w.-]+$/.test(row.cv_url))
    )
      throw problem(400, "Neispravna putanja CV-a");
    if (table === "page_views") length("path", 1, 1024);
  }
}
