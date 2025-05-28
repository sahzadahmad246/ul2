// src/app/auth/error/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Unknown error";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="p-8 bg-card rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Authentication Error</h1>
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
          {error === "OAuthCallback"
            ? "Authentication failed. Please try again."
            : error}
        </div>
        <Button asChild className="w-full">
          <Link href="/auth/signin">Try Again</Link>
        </Button>
      </div>
    </div>
  );
}