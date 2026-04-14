import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const envVars = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? `SET (Length: ${process.env.NEXTAUTH_SECRET.length})` : "NOT SET",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `SET (Start: ${process.env.GOOGLE_CLIENT_ID.substring(0, 5)}...)` : "NOT SET",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? `SET (Length: ${process.env.GOOGLE_CLIENT_SECRET.length})` : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
    STATIC_BUILD: process.env.STATIC_BUILD,
  };

  return NextResponse.json(envVars);
}
