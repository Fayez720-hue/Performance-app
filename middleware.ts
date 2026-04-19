import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/jwt";

const SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-change-me-32chars!!";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  
  // Public paths that don't require authentication
  const publicPaths = ["/login", "/api/auth"];
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));
  
  // Check if the path is a static asset
  const isStaticAsset = request.nextUrl.pathname.match(/(_next\/static|_next\/image|favicon\.ico)/);
  
  if (isPublicPath || isStaticAsset) {
    return NextResponse.next();
  }
  
  // For all other paths, check authentication
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  try {
    // Verify the JWT token using Web Crypto
    await verifyJWT(token);
    return NextResponse.next();
  } catch (err) {
    console.error("Middleware: Invalid token", err);
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
