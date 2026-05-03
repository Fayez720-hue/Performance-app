import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getUserByEmail } from "@/lib/google-sheets";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
    }),
  ],
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role || "Team Member";
        (session.user as any).name = token.name || session.user.name;
        (session.user as any).email = token.email || session.user.email;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;

        try {
          if (user.email) {
            const dbUser = await getUserByEmail(user.email);
            if (dbUser) {
              token.role = dbUser.role;
              token.name = dbUser.name;
            } else {
              const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean);
              if (adminEmails.includes(user.email.toLowerCase())) {
                token.role = "Admin";
              } else {
                token.role = "Team Member";
              }
            }
          }
        } catch (error) {
          console.error("JWT Callback error:", error);
          token.role = "Team Member";
        }
      }
      return token;
    },
  },
};
