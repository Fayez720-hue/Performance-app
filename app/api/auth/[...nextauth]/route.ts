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

export async function GET(request: NextRequest, context: any) {
  if (process.env.STATIC_BUILD === 'true') {
    return NextResponse.json({ static: true })
  }
  // Next.js 15 requires awaiting params if accessed,
  // but NextAuth v4 handler expects the context object directly.
  return await handler(request, context)
}

export async function POST(request: NextRequest, context: any) {
  if (process.env.STATIC_BUILD === 'true') {
    return NextResponse.json({ static: true })
  }
  return await handler(request, context)
}
