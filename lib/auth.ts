import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getUserByEmail } from "@/lib/google-sheets";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SECRET || "",
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role || "Team Member";
        (session.user as any).name = token.name || session.user.name;
        (session.user as any).email = token.email || session.user.email;
      }
      return session;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;

        // Fetch user data from DB ONLY ONCE during sign-in
        try {
          if (user.email) {
            const dbUser = await getUserByEmail(user.email);
            if (dbUser) {
              token.role = dbUser.role;
              token.name = dbUser.name;
            } else {
              const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim());
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
  secret: process.env.NEXTAUTH_SECRET,
};
