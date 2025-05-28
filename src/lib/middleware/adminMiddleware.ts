// src/lib/middleware/adminMiddleware.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function adminMiddleware() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser?.id || sessionUser.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}