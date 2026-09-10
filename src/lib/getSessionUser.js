import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebaseAdmin";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sajawat_session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );

    await connectMongoDB();

    const user = await User.findOne({
      firebaseUid: decodedToken.uid,
    }).lean();

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      firebaseUid: user.firebaseUid,
      name: user.name,
      email: user.email,
      image: user.image || "",
    };
  } catch {
    return null;
  }
}