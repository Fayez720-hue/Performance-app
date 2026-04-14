import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Standard NextAuth handler for App Router
const handler = NextAuth(authOptions)

export async function GET(request: NextRequest, { params }: { params: Promise<{ nextauth: string[] }> }) {
  // 1. Diagnostic mode
  if (request.nextUrl.searchParams.get("check") === "1") {
    return NextResponse.json({
      status: "Ready",
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "MISSING",
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "PRESENT" : "MISSING",
        GOOGLE_ID: (process.env.GOOGLE_CLIENT_ID || "").substring(0, 10) + "...",
      },
      url: request.url,
      host: request.headers.get("host"),
      cookies: request.cookies.getAll().map(c => c.name),
    });
  }

  // 2. Await params for Next.js 15
  const resolvedParams = await params

  // 3. Handle the request
  return await handler(request, { params: resolvedParams })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ nextauth: string[] }> }) {
  const resolvedParams = await params
  return await handler(request, { params: resolvedParams })
}
