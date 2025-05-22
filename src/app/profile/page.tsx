// src/app/profile/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Profile from "@/components/user/Profile";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/api/auth/signin"); // Redirect to sign-in if not authenticated
  }

  return <Profile />;
}