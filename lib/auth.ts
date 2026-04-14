import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  debug: true,
  secret: process.env.NEXTAUTH_SECRET || "Qbl6TL22aEKcQpjdfWuhy4BvZ6fHBv3dwHY92V60hGo=",
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: "423199982215-9f8naaojguulkgha5nmlpumpb00d6j3j.apps.googleusercontent.com",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "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",
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
      if (!user?.email) return false;
      try {
        const { createUser } = await import("./google-sheets");
        await createUser({
          email: user.email.toLowerCase(),
          name: user.name || user.email.split("@")[0],
          role: "Team Member"
        });
      } catch (e) {
        console.error("signIn sync error:", e);
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
}
