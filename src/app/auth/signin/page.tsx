// src/app/auth/signin/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/profile";

  useEffect(() => {
    if (error) {
      console.error(`Sign-in error: ${error}`);
    }
  }, [error]);

  const handleSignIn = async () => {
    try {
      await signIn("google", { callbackUrl });
    } catch (err) {
      console.error(`Sign-in failed: ${err}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="p-8 bg-card rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
            {error === "OAuthCallback"
              ? "Authentication failed. Please try again."
              : error}
          </div>
        )}
        <Button
          onClick={handleSignIn}
          className="w-full"
          variant="outline"
        >
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}