import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 0,
      path: "/",
    };

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_session", "", cookieOptions);

    try {
      const cookieStore = await cookies();
      cookieStore.set("admin_session", "", cookieOptions);
    } catch {
      // Handled by response cookies
    }

    return response;
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { error: "An error occurred during logout." },
      { status: 500 }
    );
  }
}

