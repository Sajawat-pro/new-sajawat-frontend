import { createHmac, createHash, timingSafeEqual, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
export const ADMIN_COOKIE = "sajawat_admin";
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;
function key() {
  if (!process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32 || !process.env.ADMIN_PASSWORD) return null;
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET).update(process.env.ADMIN_PASSWORD).digest();
}
export function credentialsMatch(id, password) {
  if (!process.env.ADMIN_LOGIN_ID || !process.env.ADMIN_PASSWORD || !key()) return false;
  const hash = value => createHash("sha256").update(value).digest();
  const validId = timingSafeEqual(hash(String(id).trim().toLowerCase()), hash(process.env.ADMIN_LOGIN_ID.trim().toLowerCase()));
  const validPassword = timingSafeEqual(hash(String(password)), hash(process.env.ADMIN_PASSWORD));
  return validId && validPassword;
}
export function createAdminSession() {
  const payload = Buffer.from(JSON.stringify({ id: process.env.ADMIN_LOGIN_ID, exp: Date.now() + ADMIN_SESSION_SECONDS * 1000, nonce: randomUUID() })).toString("base64url");
  return payload + "." + createHmac("sha256", key()).update(payload).digest("base64url");
}
export async function getAdminSession() {
  const secret = key();
  if (!secret) return null;
  const cookie = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const [payload, signature, extra] = cookie.split(".");
    if (extra || !payload || !signature) return null;
    const expected = createHmac("sha256", secret).update(payload).digest();
    const received = Buffer.from(signature, "base64url");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!Number.isFinite(data.exp) || data.exp < Date.now() || data.id !== process.env.ADMIN_LOGIN_ID) return null;
    return { id: "admin", name: "Sajawat Admin", email: data.id, firebaseUid: "admin-env" };
  } catch { return null; }
}
