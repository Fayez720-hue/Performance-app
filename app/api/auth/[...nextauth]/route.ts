import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

// Dynamically set based on the build type
export const dynamic = process.env.STATIC_BUILD === 'true' ? "force-static" : "force-dynamic"

// Required for catch-all routes in static export mode
export function generateStaticParams() {
  return [{ nextauth: ["signin"] }, { nextauth: ["callback"] }, { nextauth: ["session"] }, { nextauth: ["csrf"] }, { nextauth: ["providers"] }]
}

const handler = (req: any, res: any) => {
  if (process.env.STATIC_BUILD === 'true') {
    return NextResponse.json({ static: true })
  }
  return NextAuth(authOptions)(req, res)
}

export { handler as GET, handler as POST }
