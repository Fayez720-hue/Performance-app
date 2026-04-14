import { NextAuthOptions } from "next-auth"
import type { UserRole } from "@/types/user"

export const authOptions: NextAuthOptions = {
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    {
      id: "google",
      name: "Google",
      type: "oauth",
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: {
          scope: "openid email profile",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      token: "https://oauth2.googleapis.com/token",
      userinfo: "https://www.googleapis.com/oauth2/v3/userinfo",
      // Match the variable names exactly as they appear in your Cloudflare Dashboard
      clientId: (process.env.GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "").trim(),
      clientSecret: (process.env.GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "").trim(),
      checks: ["state"], // Simplified checks for better compatibility with Edge cookies
      profile(profile) {
        return {
          id: profile.sub || profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    },
  ],
  // Use standard cookie names to avoid __Host- restriction issues on Cloudflare preview URLs
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
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
  }
}
