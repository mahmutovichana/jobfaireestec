import fs from "node:fs";
import { Router } from "express";
import { scope, validateWrite, publicColumns } from "./policy.mjs";
import { transaction, problem } from "./db.mjs";
import { onRecordWritten } from "./notifications.mjs";
const schema = JSON.parse(
  fs.readFileSync(new URL("./schema.json", import.meta.url), "utf8"),
);
for (const [name, columns] of Object.entries(publicColumns)) {
  if (!schema[name]) schema[name] = columns;
}
const jsonFields = new Set([
  "data",
  "metadata",
  "gallery_urls",
  "social_links",
  "photo_crop",
  "avatar_crop",
]);
const conflicts = {
  profiles: ["id"],
  package_types: ["key"],
  package_prices: ["year", "package"],
  partner_participations: ["partner_id", "year"],
};
export const quote = (s) => {
  if (typeof s !== "string" || !/^\w+$/.test(s))
    throw problem(400, "Invalid identifier");
  return '"' + s + '"';
};
function context(table, user) {
  if (!Object.hasOwn(schema, table)) throw problem(404, "Unknown resource");
  const values = [];
  return {
    values,
    bind(v) {
      values.push(v);
      return "$" + values.length;
    },
    column(k) {
      if (!schema[table].includes(k)) throw problem(400, "Invalid column");
      if (
        !user?.board &&
        publicColumns[table] &&
        !publicColumns[table].includes(k)
      )
        throw problem(403, "Restricted field");
      return quote(k);
    },
  };
}
function filterSql(ctx, filters = []) {
  if (!Array.isArray(filters) || filters.length > 30)
    throw problem(400, "Invalid filters");
  const operators = {
    eq: "=",
    neq: "<>",
    gte: ">=",
    lte: "<=",
    gt: ">",
    lt: "<",
    ilike: "ILIKE",
  };
  return filters
    .map((f) => {
      const col = "t." + ctx.column(f.column);
      if (f.op === "is" || f.value === null) {
        if (f.value !== null && typeof f.value !== "boolean")
          throw problem(400, "Invalid null filter");
        return `${col} IS ${f.value === null ? "NULL" : f.value ? "TRUE" : "FALSE"}`;
      }
      if (f.op === "in") {
        if (!Array.isArray(f.value) || f.value.length > 500)
          throw problem(400, "Invalid list");
        return `${col} = ANY(${ctx.bind(f.value)})`;
      }
      if (!Object.hasOwn(operators, f.op))
        throw problem(400, "Invalid operator");
      return `${col} ${operators[f.op]} ${ctx.bind(f.value)}`;
    })
    .join(" AND ");
}
function split(s) {
  let depth = 0,
    start = 0,
    out = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") depth++;
    if (s[i] === ")") depth--;
    if (depth < 0) throw problem(400, "Invalid projection");
    if (s[i] === "," && depth === 0) {
      out.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (depth) throw problem(400, "Invalid projection");
  out.push(s.slice(start).trim());
  return out;
}
function projection(table, columns, user, ctx, alias = "t") {
  if (typeof columns !== "string" || columns.length > 2000)
    throw problem(400, "Invalid projection");
  return split(columns)
    .flatMap((part) => {
      if (part === "*")
        return (
          publicColumns[table] && !user?.board
            ? publicColumns[table]
            : schema[table]
        ).map((k) => alias + "." + ctx.column(k));
      const m = /^(?:(\w+):)?(\w+)\(([^()]*)\)$/.exec(part);
      if (!m) return [alias + "." + ctx.column(part)];
      const name = m[1] ?? m[2],
        related = m[2];
      if (
        !(table === "partners" && related === "partner_participations") &&
        !(table === "registrations" && related === "events")
      )
        throw problem(400, "Invalid relation");
      const sub = context(related, user);
      sub.bind = ctx.bind;
      const selected = projection(related, m[3], user, sub, "r");
      const access = scope(related, "select", user, ctx.bind).replace(
        /\bpartner_id\b/g,
        "r.partner_id",
      );
      const condition =
        related === "events" ? "r.id=t.event_id" : "r.partner_id=t.id";
      const query = `SELECT ${selected} FROM public.${quote(related)} r WHERE ${condition} AND (${access})`;
      return [
        related === "events"
          ? `(SELECT row_to_json(nested) FROM (${query}) nested) AS ${quote(name)}`
          : `(SELECT coalesce(jsonb_agg(row_to_json(nested)),'[]') FROM (${query}) nested) AS ${quote(name)}`,
      ];
    })
    .join(",");
}
export async function resourceQuery(table, q, user) {
  const operation = q.operation ?? "select";
  if (!["select", "insert", "update", "delete", "upsert"].includes(operation))
    throw problem(400, "Invalid operation");
  return transaction(user, async (db) => {
    if (operation === "select") {
      const ctx = context(table, user);
      const fields = q.head
        ? "count(*)::int AS __count"
        : projection(table, q.columns ?? "*", user, ctx);
      const where = [
        scope(table, "select", user, ctx.bind),
        filterSql(ctx, q.filters),
      ]
        .filter(Boolean)
        .join(" AND ");
      const orders = q.order ?? [];
      if (!Array.isArray(orders) || orders.length > 5)
        throw problem(400, "Invalid ordering");
      const order = orders
        .map(
          (o) =>
            "t." +
            ctx.column(o.column) +
            (o.ascending === false ? " DESC" : " ASC"),
        )
        .join(",");
      const cap = user?.board ? 10000 : 1000;
      const limit = Math.min(cap, q.limit ?? 1000),
        offset = q.offset ?? 0;
      if (
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        !Number.isSafeInteger(offset) ||
        offset < 0
      )
        throw problem(400, "Invalid page");
      const rows = (
        await db.query(
          `SELECT ${fields}${!q.head && q.count ? ",count(*) OVER()::int AS __count" : ""} FROM public.${quote(table)} t WHERE ${where}${!q.head ? (order ? " ORDER BY " + order : "") + ` LIMIT ${limit} OFFSET ${offset}` : ""}`,
          ctx.values,
        )
      ).rows;
      const count = q.count ? (rows[0]?.__count ?? 0) : undefined;
      for (const row of rows) delete row.__count;
      return { data: q.head ? null : rows, error: null, count };
    }
    if (["update", "delete"].includes(operation) && !q.filters?.length)
      throw problem(400, "Mutation needs a filter");
    const records =
      operation === "delete"
        ? [{}]
        : Array.isArray(q.values)
          ? q.values
          : [q.values];
    if (
      !records.length ||
      records.length > 200 ||
      records.some((r) => !r || typeof r !== "object" || Array.isArray(r))
    )
      throw problem(400, "Invalid records");
    const result = [];
    for (const record of records) {
      if (
        table === "partners" &&
        !user?.board &&
        ["insert", "upsert"].includes(operation)
      )
        record.visible = false;
      if (table === "access_requests" && operation === "update")
        record.reviewed_by = user?.id;
      const ctx = context(table, user);
      const op = operation === "upsert" ? "insert" : operation;
      const access = scope(table, op, user, ctx.bind);
      if (operation !== "delete") validateWrite(table, record, op, user);
      const keys = Object.keys(record);
      if (operation !== "delete" && !keys.length)
        throw problem(400, "Empty record");
      keys.forEach(ctx.column);
      let rows;
      if (operation === "insert" || operation === "upsert") {
        // Discard the predicate parameters here; INSERT ownership is verified inside this same transaction below.
        const write = context(table, user);
        let sql = `INSERT INTO public.${quote(table)} AS t (${keys.map(write.column).join(",")}) VALUES (${keys.map((k) => write.bind(jsonFields.has(k) && record[k] !== null ? JSON.stringify(record[k]) : record[k])).join(",")})`;
        if (operation === "upsert") {
          const allowed = conflicts[table];
          if (
            !allowed ||
            (q.onConflict ?? allowed.join(",")) !== allowed.join(",")
          )
            throw problem(400, "Unsupported conflict target");
          const mutable = keys.filter(
            (k) =>
              !allowed.includes(k) &&
              !["id", "user_id", "created_at"].includes(k),
          );
          const guarded = scope(table, "update", user, write.bind);
          sql += ` ON CONFLICT (${allowed.map(write.column).join(",")}) ${mutable.length ? "DO UPDATE SET " + mutable.map((k) => `${write.column(k)}=EXCLUDED.${write.column(k)}`).join(",") + " WHERE " + guarded : "DO NOTHING"}`;
        }
        rows = (await db.query(sql + " RETURNING *", write.values)).rows;
        if (access !== "true")
          for (const row of rows) {
            const id = table === "package_types" ? "key" : "id";
            const check = await db.query(
              `SELECT (${access}) allowed FROM public.${quote(table)} t WHERE ${quote(id)}=${ctx.bind(row[id])}`,
              ctx.values,
            );
            if (!check.rows[0]?.allowed)
              throw problem(403, "Ownership check failed");
          }
      } else {
        const where = [access, filterSql(ctx, q.filters)]
          .filter(Boolean)
          .join(" AND ");
        const sql =
          operation === "delete"
            ? `DELETE FROM public.${quote(table)} t WHERE ${where} RETURNING *`
            : `UPDATE public.${quote(table)} t SET ${keys.map((k) => ctx.column(k) + "=" + ctx.bind(jsonFields.has(k) && record[k] !== null ? JSON.stringify(record[k]) : record[k])).join(",")} WHERE ${where} RETURNING *`;
        rows = (await db.query(sql, ctx.values)).rows;
      }
      for (const row of rows) {
        await onRecordWritten(db, table, operation, row, user);
        result.push(row);
      }
    }
    return { data: result, error: null };
  });
}
const router = Router();
router.get("/:resource", async (req, res) => {
  const q = JSON.parse(String(req.query.query ?? "{}"));
  if (q.operation && q.operation !== "select")
    throw problem(405, "GET is read only");
  res.set("Cache-Control", "no-store");
  res.json(await resourceQuery(req.params.resource, q, req.user));
});
router.post("/:resource", async (req, res) =>
  res.json(await resourceQuery(req.params.resource, req.body, req.user)),
);
export default router;
