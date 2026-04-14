import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// During APK build, this block will be uncommented by the package.json script
/* APK_BUILD_ONLY
export function generateStaticParams() {
  return [{ nextauth: ["signin"] }, { nextauth: ["callback"] }, { nextauth: ["session"] }, { nextauth: ["csrf"] }, { nextauth: ["providers"] }]
}
APK_BUILD_ONLY */

const authHandler = NextAuth(authOptions)

export async function GET(req: any, res: any) {
  if (process.env.STATIC_BUILD === 'true') {
    return NextResponse.json({ static: true })
  }
  return await authHandler(req, res)
}

export async function POST(req: any, res: any) {
  if (process.env.STATIC_BUILD === 'true') {
    return NextResponse.json({ static: true })
  }
  return await authHandler(req, res)
}
