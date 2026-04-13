import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { User, UserRole } from "@/types/user"

// Prefer a real environment secret. Provide a dummy one during build to prevent initialization errors.
const SECRET = process.env.NEXTAUTH_SECRET || "temporary-build-secret-must-be-replaced-in-production"

if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === "production") {
  console.warn("NEXTAUTH_SECRET is not set in production. Using temporary fallback.")
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-secret",
      wellKnown: "https://accounts.google.com/.well-known/openid-configuration",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  secret: SECRET,
  session: {
    strategy: "jwt",
  },
  debug: true,
  logger: {
    error(code, metadata) {
      console.error(`[NextAuth Error] ${code}:`, metadata)
    },
    warn(code) {
      console.warn(`[NextAuth Warning] ${code}`)
    },
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const { createUser } = await import("./google-sheets");

      try {
        // Determine initial role from env vars if they are being created or updated
        const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
        const managerEmails = process.env.MANAGER_EMAILS?.split(",") || [];

        let role: UserRole = "Team Member";
        if (adminEmails.includes(user.email)) role = "Admin";
        else if (managerEmails.includes(user.email)) role = "Manager";

        // createUser now handles both creation and updating existing entries by name/email
        await createUser({
          email: user.email,
          name: user.name || user.email.split("@")[0],
          role: role
        });

        console.log(`✅ User sign-in processed for: ${user.email}`);
      } catch (error) {
        console.error("Error during user onboarding:", error);
      }

      return true
    },
    async redirect({ url, baseUrl }) {
      console.log(`Redirecting to: ${baseUrl}/dashboard`)
      return baseUrl + "/dashboard"
    },
    async jwt({ token, user: nextAuthUser }) {
      if (nextAuthUser?.email) {
        // Always check env vars first for role assignment
        const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
        const managerEmails = process.env.MANAGER_EMAILS?.split(",") || [];

        let role: UserRole = "Team Member";
        if (adminEmails.includes(nextAuthUser.email)) role = "Admin";
        else if (managerEmails.includes(nextAuthUser.email)) role = "Manager";

        const { getUserByEmail } = await import("./google-sheets");
        const dbUser = await getUserByEmail(nextAuthUser.email);

        if (dbUser) {
          token.role = dbUser.role;
        } else {
          token.role = role;
        }

        token.email = nextAuthUser.email;
        token.name = nextAuthUser.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole
        session.user.name = (token.name as string) || session.user.email
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}

console.log("GOOGLE_SHEETS_CLIENT_EMAIL present:", Boolean(process.env.GOOGLE_SHEETS_CLIENT_EMAIL))
console.log("GOOGLE_SHEETS_PRIVATE_KEY present:", Boolean(process.env.GOOGLE_SHEETS_PRIVATE_KEY))