import { NextResponse } from "next/server";
import { assertSameOrigin, readJson, apiError, HttpError } from "@/lib/http";

export const runtime = "nodejs";

const SESSION_DURATION = 60 * 60 * 24 * 5 * 1000;

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const { adminAuth } = await import("@/lib/firebaseAdmin");
    const { default: connectMongoDB } = await import("@/lib/mongodb");
    const { default: User } = await import("@/models/User");

    const { idToken } = await readJson(request);

    if (typeof idToken !== "string" || idToken.length > 10000) {
      return NextResponse.json(
        { message: "Firebase ID token is required." },
        { status: 400 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken, true);
    if (!decodedToken.email) throw new HttpError(400, "This account needs an email address.");

    const currentTime = Math.floor(Date.now() / 1000);

    if (
      !decodedToken.auth_time ||
      currentTime - decodedToken.auth_time > 5 * 60
    ) {
      return NextResponse.json(
        { message: "Recent authentication is required." },
        { status: 401 }
      );
    }

    await connectMongoDB();

    const user = await User.findOneAndUpdate(
      {
        firebaseUid: decodedToken.uid,
      },
      {
        $set: {
          name: decodedToken.name || "",
          email: decodedToken.email,
          image: decodedToken.picture || "",
          provider:
            decodedToken.firebase?.sign_in_provider || "google.com",
          lastLoginAt: new Date(),
        },
        $setOnInsert: {
          firebaseUid: decodedToken.uid,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION,
    });

    const response = NextResponse.json({
      message: "Login successful.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });

    response.cookies.set({
      name: "sajawat_session",
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION / 1000,
    });

    return response;
  } catch (error) {
    if (error instanceof HttpError) return apiError(error);
    console.error("Session creation error:", { code: error.code });

    return NextResponse.json(
      { message: "Unable to complete login." },
      { status: 401 }
    );
  }
}
