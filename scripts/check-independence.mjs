import fs from "node:fs/promises";
import path from "node:path";
const forbidden = [
  /lovable\.(app|dev|ai)/i,
  /@lovable\//i,
  /lovable-tagger/i,
  /@lovable\.dev/i,
  /supabase\.co/i,
  /@supabase\//i,
  /gpt-engineer-file-uploads/i,
  /__l5e\//i,
];
let bad = [];
async function scan(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (["node_modules", "test", ".git"].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await scan(file);
    else if (/\.(tsx?|m?js|json|html|css|xml|txt)$/.test(file)) {
      const content = await fs.readFile(file, "utf8");
      if (forbidden.some((re) => re.test(content))) bad.push(file);
    }
  }
}
for (const dir of ["src", "public", "server/src", "dist"])
  await scan(dir).catch((e) => {
    if (e.code !== "ENOENT") throw e;
  });
for (const name of [
  "package.json",
  "server/package.json",
  "index.html",
  "vite.config.ts",
]) {
  const text = await fs.readFile(name, "utf8");
  if (forbidden.some((re) => re.test(text))) bad.push(name);
}
if (bad.length) {
  console.error("Hosted dependency found:", bad);
  process.exitCode = 1;
} else
  console.log(
    "No hosted Lovable/Supabase dependency in runtime source or build.",
  );
