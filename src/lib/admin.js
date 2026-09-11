import { getSessionUser } from "@/lib/getSessionUser";
import { HttpError } from "@/lib/http";
import { getAdminSession } from "@/lib/adminSession";
export function isAdmin(user) {
  if (!user) return false;
  const uids = (process.env.ADMIN_UIDS || "").split(",").map(value => value.trim()).filter(Boolean);
  const emails = (process.env.ADMIN_EMAILS || "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  return uids.includes(user.firebaseUid) || (user.emailVerified === true && emails.includes(user.email?.toLowerCase()));
}
export async function requireAdmin() {
  const session = await getAdminSession();
  if (session) return session;
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Please sign in to continue.");
  if (!isAdmin(user)) throw new HttpError(403, "This account does not have administrator access.");
  return user;
}
