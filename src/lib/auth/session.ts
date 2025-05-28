// src/lib/auth/session.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    return session?.user as { id: string; email: string; name: string; slug: string; role: string; profilePicture?: { url?: string; publicId?: string | null } } | null;
  } catch {
    return null;
  }
}