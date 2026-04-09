import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { User, UserRole } from "@/types/user"

// Prefer a real environment secret. Only use the fallback in local development.
const SECRET: string | undefined = process.env.NEXTAUTH_SECRET ?? (process.env.NODE_ENV === "development" ? "local-dev-secret-32-bytes-minimum!!!" : undefined)

if (!SECRET) {
  // Runtime warning to help catch missing secret in non-dev environments
  console.warn("NEXTAUTH_SECRET is not set. Set a strong secret in your environment (NEXTAUTH_SECRET).")
}

declare module "next-auth" {
  interface Session {
    user: User & {
      image?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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

      const { getUserByEmail, createUser } = await import("./google-sheets");

      try {
        const existingUser = await getUserByEmail(user.email);

        if (!existingUser) {
          // Determine initial role
          const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
          const managerEmails = process.env.MANAGER_EMAILS?.split(",") || [];

          let role: UserRole = "Team Member"; // Default to Team Member for new signups
          if (adminEmails.includes(user.email)) role = "Admin";
          else if (managerEmails.includes(user.email)) role = "Manager";

          await createUser({
            email: user.email,
            name: user.name || user.email.split("@")[0],
            role: role
          });
          console.log(`🆕 Created new user and sheet for: ${user.email} with role ${role}`);
        }
      } catch (error) {
        console.error("Error during user onboarding:", error);
      }

      console.log(`✅ User signed in successfully: ${user.email}`);
      return true
    },
    async redirect({ url, baseUrl }) {
      console.log(`Redirecting to: ${baseUrl}/dashboard`)
      return baseUrl + "/dashboard"
    },
    async jwt({ token, user }) {
      if (user) {
        let role: UserRole = "Viewer"
        const adminEmails = process.env.ADMIN_EMAILS?.split(",") || []
        const managerEmails = process.env.MANAGER_EMAILS?.split(",") || []

        if (adminEmails.includes(user.email!)) {
          role = "Admin"
        } else if (managerEmails.includes(user.email!)) {
          role = "Manager"
        }

        token.role = role
        token.email = user.email
        token.name = user.name
      }
      return token
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