import { NextResponse } from "next/server";

// Simple admin authentication - in production, use proper authentication
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // Check against environment variables
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return NextResponse.json({ 
        success: true, 
        message: "Admin authenticated successfully" 
      });
    } else {
      return NextResponse.json(
        { error: "Invalid credentials" }, 
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" }, 
      { status: 500 }
    );
  }
}
