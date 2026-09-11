import { NextResponse } from "next/server";
import { assertSameOrigin, apiError } from "@/lib/http";

export async function POST(request) {
  try { assertSameOrigin(request); } catch (error) { return apiError(error); }
  const response = NextResponse.json({
    message: "Logged out successfully.",
  });

  response.cookies.set({
    name: "sajawat_session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
