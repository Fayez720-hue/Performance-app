import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { OAuth2Client } from "google-auth-library";
import { getUserByEmail, addUser, getUserByEmailAndPassword } from "@/lib/db-queries";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    // Native app Google Sign-In (uses id_token from Capacitor plugin)
    CredentialsProvider({
      id: "google-credentials",
      name: "Google Credentials",
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
    // Email/Password Login
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("EMAIL LOGIN ATTEMPT:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email or password");
          return null;
        }
        
        const user = await getUserByEmailAndPassword(credentials.email, credentials.password);
        console.log("USER FOUND:", user);
        
        if (!user) return null;
        
        return {
          id: user.email,
          email: user.email,
          name: user.name,
          role: user.role || "Team Member",
        };
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

        const email = user.email?.toLowerCase() || "";
        const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean);
        const managerEmails = (process.env.MANAGER_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean);

        if (adminEmails.includes(email)) {
          token.role = "Admin";
        } else if (managerEmails.includes(email)) {
          token.role = "Manager";
        } else {
          try {
            const dbUser = await getUserByEmail(email);
            if (dbUser) {
              token.role = dbUser.role || "Team Member";
              token.name = dbUser.name;
            } else {
              token.role = "Team Member";
            }
          } catch (error) {
            token.role = "Team Member";
          }
        }
      }
      return token;
    },
  },
};