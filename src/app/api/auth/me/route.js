import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/getSessionUser";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    const response = NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );

    response.cookies.set({
      name: "sajawat_session",
      value: "",
      path: "/",
      maxAge: 0,
    });

    return response;
  }

  return NextResponse.json({
    authenticated: true,
    user,
  });
}