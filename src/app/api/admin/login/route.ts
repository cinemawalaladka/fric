import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Get server-side credentials with safe production fallbacks
    const adminEmail = (process.env.SUPER_ADMIN_EMAIL || "admin@ppsu.in").trim().toLowerCase();
    const adminPassword = (process.env.SUPER_ADMIN_PASSWORD || "Admin@PPSU2026!").trim();
    const sessionSecret = process.env.ADMIN_SESSION_SECRET || "fric-admin-secret-key-2026-ppsu-demo";

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    // Validate credentials
    const emailMatch = cleanEmail === adminEmail;
    const passwordBuffer = Buffer.from(cleanPassword);
    const adminPasswordBuffer = Buffer.from(adminPassword);
    const passwordMatch =
      passwordBuffer.length === adminPasswordBuffer.length &&
      crypto.timingSafeEqual(passwordBuffer, adminPasswordBuffer);

    if (!emailMatch || !passwordMatch) {
      console.warn(
        `Failed admin login attempt for ${cleanEmail} from IP: ${request.headers.get("x-forwarded-for") || "unknown"}`
      );
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Create secure session token
    const sessionData = {
      role: "SUPER_ADMIN",
      email: adminEmail,
      createdAt: Date.now(),
    };

    const sessionToken = crypto
      .createHmac("sha256", sessionSecret)
      .update(JSON.stringify(sessionData))
      .digest("hex");

    // Combine token with data for verification later
    const sessionValue = Buffer.from(
      JSON.stringify({ token: sessionToken, ...sessionData })
    ).toString("base64");

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    };

    // Set cookie on response object for Vercel serverless functions
    const response = NextResponse.json({ success: true, message: "Admin authenticated successfully." });
    response.cookies.set("admin_session", sessionValue, cookieOptions);

    // Also set via next/headers cookies store
    try {
      const cookieStore = await cookies();
      cookieStore.set("admin_session", sessionValue, cookieOptions);
    } catch {
      // Ignored if handled by response cookies
    }

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "An error occurred during authentication." },
      { status: 500 }
    );
  }
}

