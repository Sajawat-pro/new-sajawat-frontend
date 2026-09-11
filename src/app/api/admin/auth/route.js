import { assertSameOrigin, readJson, apiError, HttpError, json } from "@/lib/http";
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, credentialsMatch, createAdminSession } from "@/lib/adminSession";
import { rateLimit } from "@/lib/rateLimit";
export const runtime = "nodejs";
export async function POST(request) {
  try {
    assertSameOrigin(request);
    const body = await readJson(request);
    await rateLimit("admin-login", 15, 900);
    if (!credentialsMatch(body.id, body.password)) throw new HttpError(401, "The admin ID or password is incorrect.");
    const response = json({ message: "Welcome back." });
    response.cookies.set(ADMIN_COOKIE, createAdminSession(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: ADMIN_SESSION_SECONDS });
    return response;
  } catch (error) { return apiError(error, "Unable to sign in. Please try again."); }
}
export async function DELETE(request) {
  try {
    assertSameOrigin(request);
    const response = json({ message: "Signed out." });
    response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
    return response;
  } catch (error) { return apiError(error); }
}
