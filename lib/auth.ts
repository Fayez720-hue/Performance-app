import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { UserRole } from "@/types/user"

export const authOptions: NextAuthOptions = {
  debug: true,
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: true, // Force secure cookies for Cloudflare
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    csrfToken: {
      name: `__Secure-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    }
  },
  providers: [
    GoogleProvider({
      clientId: (process.env.GOOGLE_CLIENT_ID || "").trim().replace(/^["']|["']$/g, ""),
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim().replace(/^["']|["']$/g, ""),
      checks: ['pkce', 'state'],
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return true;
      try {
        if (process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
          const { createUser } = await import("./google-sheets");
          const email = user.email.toLowerCase();
          const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim());
          const managerEmails = (process.env.MANAGER_EMAILS || "").toLowerCase().split(",").map(e => e.trim());
          let role: UserRole = "Team Member";
          if (adminEmails.includes(email)) role = "Admin";
          else if (managerEmails.includes(email)) role = "Manager";
          await createUser({ email, name: user.name || email.split("@")[0], role });
        }
      } catch (e) {
        console.error("Auth Callback Error:", e);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        try {
           if (process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
             const { getUserByEmail } = await import("./google-sheets");
             const dbUser = await getUserByEmail(user.email);
             token.role = dbUser?.role || "Team Member";
           }
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
}
