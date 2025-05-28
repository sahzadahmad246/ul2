// src/types/authTypes.ts
import { JWT } from "next-auth/jwt";

export interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: "user" | "poet" | "admin";
  profilePicture?: { url?: string; publicId?: string | null } | null;
  slug?: string;
}

export interface ExtendedJWT extends JWT {
  id?: string;
  role?: "user" | "poet" | "admin";
  profilePicture?: { url?: string; publicId?: string | null } | null;
  slug?: string;
}