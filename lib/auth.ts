import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { OAuth2Client } from "google-auth-library";
import { getUserByEmail, addUser } from "@/lib/google-sheets";

// Initialize Google client for ID token verification
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const authOptions: NextAuthOptions = {
  providers: [
    // Web fallback provider (optional, but keep for web)
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
    // Native OAuth provider (for Capacitor)
    CredentialsProvider({
      name: "credentials",
      credentials: { id_token: { type: "text" } },
      async authorize(credentials) {
        if (!credentials?.id_token) return null;
        try {
          // Verify the Google ID token
          const ticket = await googleClient.verifyIdToken({
            idToken: credentials.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();
          if (!payload) return null;

          // Get or create user in Google Sheets
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
        } catch (error) {
          console.error("ID token verification failed:", error);
          return null;
        }
      },
    }),
  ],
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },
  },
};