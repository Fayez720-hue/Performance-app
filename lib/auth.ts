import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { UserRole } from "@/types/user"

export const authOptions: NextAuthOptions = {
  debug: true,
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: "423199982215-9f8naaojguulkgha5nmlpumpb00d6j3j.apps.googleusercontent.com",
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim().replace(/^["']|["']$/g, ""),
      checks: ['state'],
    }),
  ],
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: false,
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
      }
    }
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return true;
      try {
        const { createUser } = await import("./google-sheets");
        const email = user.email.toLowerCase();
        const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",");
        const managerEmails = (process.env.MANAGER_EMAILS || "").toLowerCase().split(",");
        let role: UserRole = "Team Member";
        if (adminEmails.includes(email)) role = "Admin";
        else if (managerEmails.includes(email)) role = "Manager";
        await createUser({
          email: email,
          name: user.name || email.split("@")[0],
          role: role
        });
      } catch (e) {
        console.error("Auth: signIn callback error (non-fatal):", e);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        try {
           const { getUserByEmail } = await import("./google-sheets");
           const dbUser = await getUserByEmail(user.email);
           token.role = dbUser?.role || "Team Member";
        } catch {
           token.role = "Team Member";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role || "Team Member";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
}
