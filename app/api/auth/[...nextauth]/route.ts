import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// During APK build, this block will be uncommented by the package.json script
/* APK_BUILD_ONLY
export function generateStaticParams() {
  return [{ nextauth: ["signin"] }, { nextauth: ["callback"] }, { nextauth: ["session"] }, { nextauth: ["csrf"] }, { nextauth: ["providers"] }]
}
APK_BUILD_ONLY */

const handler = NextAuth(authOptions)

export async function GET(request: NextRequest, { params }: { params: Promise<{ nextauth: string[] }> }) {
  // Diagnostic mode to check environment variables on Cloudflare
  if (request.nextUrl.searchParams.get("check") === "1") {
    return NextResponse.json({
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "MISSING",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "PRESENT" : "MISSING",
      GOOGLE_ID: process.env.GOOGLE_CLIENT_ID ? "PRESENT" : "MISSING",
      GOOGLE_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "PRESENT" : "MISSING",
      SHEETS_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? "PRESENT" : "MISSING",
    });
  }

  if (process.env.STATIC_BUILD === 'true') {
    return NextResponse.json({ static: true })
  }

  const resolvedParams = await params
  return await handler(request, { params: resolvedParams })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ nextauth: string[] }> }) {
  if (process.env.STATIC_BUILD === 'true') {
    return NextResponse.json({ static: true })
  }
  const resolvedParams = await params
  return await handler(request, { params: resolvedParams })
}
