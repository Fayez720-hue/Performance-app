import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { UserRole } from "@/types/user"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: "423199982215-9f8naaojguulkgha5nmlpumpb00d6j3j.apps.googleusercontent.com",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "Qbl6TL22aEKcQpjdfWuhy4BvZ6fHBv3dwHY92V60hGo=",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      try {
        const { createUser } = await import("./google-sheets");
        const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
        const managerEmails = process.env.MANAGER_EMAILS?.split(",") || [];
        let role: UserRole = "Team Member";
        if (adminEmails.includes(user.email)) role = "Admin";
        else if (managerEmails.includes(user.email)) role = "Manager";

        await createUser({
          email: user.email,
          name: user.name || user.email.split("@")[0],
          role: role
        });
      } catch (e) {
        console.error("Sign-in error:", e);
      }
      return true
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
      if (session.user) {
        session.user.role = token.role as any;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
}
