import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const payload = await verifyJWT(token);
    return {
      user: {
        email: payload.email,
        name: payload.name,
        role: payload.role
      }
    };
  } catch (err) {
    console.error("Session verification failed:", err);
    return null;
  }
}
