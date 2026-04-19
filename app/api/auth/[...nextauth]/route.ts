import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getUserByEmail } from "@/lib/google-sheets";

const handler = NextAuth({
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
      if (session.user && token.email) {
        (session.user as any).id = token.sub;

        try {
          const dbUser = await getUserByEmail(token.email);
          if (dbUser) {
            (session.user as any).role = dbUser.role;
            (session.user as any).name = dbUser.name;
          } else {
            const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim());
            if (adminEmails.includes(token.email.toLowerCase())) {
              (session.user as any).role = "Admin";
            } else {
              (session.user as any).role = "Team Member";
            }
          }
        } catch (error) {
          console.error("Error fetching user role from Sheets:", error);
          (session.user as any).role = "Team Member";
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
