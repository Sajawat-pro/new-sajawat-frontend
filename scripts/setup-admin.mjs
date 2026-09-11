import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
const path = new URL("../.env", import.meta.url);
let contents = readFileSync(path, "utf8");
const additions = {
  ADMIN_EMAILS: "support.sajawatstore@gmail.com",
  ADMIN_LOGIN_ID: "support.sajawatstore@gmail.com",
  ADMIN_PASSWORD: randomBytes(24).toString("base64url"),
  ADMIN_SESSION_SECRET: randomBytes(48).toString("base64url"),
};
for (const [key, value] of Object.entries(additions)) {
  const pattern = new RegExp("^" + key + "=(.*)$", "m");
  const existing = contents.match(pattern);
  if (!existing?.[1].trim()) contents = existing ? contents.replace(pattern, key + "=" + value) : contents + "\n" + key + "=" + value;
}
writeFileSync(path, contents.trimEnd() + "\n");
console.log("Admin configuration saved in .env. Existing credentials were preserved; secrets are not printed.");
