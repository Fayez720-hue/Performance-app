import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

// Next.js requires this to be a literal string, not a conditional.
// We'll use the default behavior and let Next.js determine if it's dynamic.
export const dynamic = "force-dynamic"

// Required for catch-all routes in static export mode
export function generateStaticParams() {
  return [{ nextauth: ["signin"] }, { nextauth: ["callback"] }, { nextauth: ["session"] }, { nextauth: ["csrf"] }, { nextauth: ["providers"] }]
}

const handler = (req: any, res: any) => {
  // If we are in the static build phase for APK, we just return a stub.
  if (process.env.STATIC_BUILD === 'true') {
    return NextResponse.json({ static: true })
  }
  return NextAuth(authOptions)(req, res)
}

export { handler as GET, handler as POST }
