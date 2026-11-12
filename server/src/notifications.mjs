export async function enqueue(db, { key, recipient, template, payload }) {
  if (!recipient || !String(recipient).includes("@")) return;
  if (
    (
      await db.query(
        "SELECT 1 FROM suppressed_emails WHERE lower(email)=lower($1)",
        [recipient],
      )
    ).rowCount
  )
    return;
  await db.query(
    "INSERT INTO identity.mail_jobs(dedup_key,recipient,template,payload) VALUES($1,$2,$3,$4) ON CONFLICT(dedup_key) DO NOTHING",
    [key, recipient, template, JSON.stringify(payload)],
  );
}
export async function onRecordWritten(db, table, operation, row) {
  if (operation === "insert" && table === "company_inquiries")
    await enqueue(db, {
      key: `inquiry-${row.id}`,
      recipient: row.email,
      template: "contact-inquiry-confirmation",
      payload: row,
    });
  if (operation === "insert" && table === "registrations") {
    const ev = (
      await db.query("SELECT name,event_date FROM events WHERE id=$1", [
        row.event_id,
      ])
    ).rows[0];
    const d = row.data ?? {};
    await enqueue(db, {
      key: `registration-${row.id}`,
      recipient:
        d["Email Address"] ||
        d.email ||
        d.Email ||
        d["Email adresa"] ||
        d["E-mail"],
      template: "event-registration-confirmation",
      payload: { ...d, event_name: ev?.name, event_date: ev?.event_date },
    });
  }
  if (
    table === "access_requests" &&
    operation === "update" &&
    row.status === "approved"
  )
    await enqueue(db, {
      key: `access-approved-${row.id}-${row.approved_at}`,
      recipient: row.email,
      template: "access-approved",
      payload: { full_name: row.full_name },
    });
}
export function renderMail(job, origin) {
  const escape = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const p = job.payload ?? {};
  const subject =
    job.template === "event-registration-confirmation"
      ? "Potvrda prijave na aktivnost"
      : job.template === "access-approved"
        ? "Vaš pristup je odobren"
        : "Hvala na interesovanju za JobFAIR";
  const text =
    job.template === "event-registration-confirmation"
      ? `Vaša prijava na ${p.event_name ?? "JobFAIR aktivnost"} je zaprimljena. ${p.event_date ?? ""}`
      : job.template === "access-approved"
        ? `Vaš pristup je odobren. Prijava: ${origin}/auth`
        : `Poštovani ${p.contact_person ?? ""}, zaprimili smo upit kompanije ${p.company_name ?? ""}. JobFAIR tim će vas kontaktirati.`;
  return {
    subject,
    text: text + (p.unsubscribe_url ? "\nOdjava: " + p.unsubscribe_url : ""),
    html: `<html lang="bs"><body><h1>${escape(subject)}</h1><p>${escape(text)}</p><p>JobFAIR · EESTEC LC Sarajevo</p>${p.unsubscribe_url ? '<p><a href="' + escape(p.unsubscribe_url) + '">Odjava sa email liste</a></p>' : ""}</body></html>`,
  };
}
