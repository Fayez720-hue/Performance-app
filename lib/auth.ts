import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { OAuth2Client } from "google-auth-library";
import { getUserByEmail, addUser } from "@/lib/google-sheets";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          redirect_uri: "https://performance-app-ivory.vercel.app/api/auth/callback/google",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: { id_token: { type: "text" } },
      async authorize(credentials) {
        if (!credentials?.id_token) return null;
        try {
          const ticket = await googleClient.verifyIdToken({
            idToken: credentials.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();
          if (!payload) return null;
          let user = await getUserByEmail(payload.email!);
          if (!user) {
            await addUser({
              email: payload.email!,
              name: payload.name || payload.email!.split("@")[0],
              role: "Team Member",
            });
            user = await getUserByEmail(payload.email!);
          }
          return {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            role: user?.role || "Team Member",
          };
        } catch (err) {
          console.error("Token verification error:", err);
          return null;
        }
      },
    }),
  ],
  
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
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
        token.name = user.name;

        try {
          if (user.email) {
            const dbUser = await getUserByEmail(user.email);
            if (dbUser) {
              token.role = dbUser.role;
              token.name = dbUser.name;
            } else {
              // Optional: Add to DB if not found or handle guest logic
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
          token.role = (user as any).role || "Team Member";
        }
      }
      return token;
    },
  },
};