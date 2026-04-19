import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/employees/:path*",
    "/settings/:path*",
    "/reports/:path*",
    "/admin/:path*",
  ],
};
