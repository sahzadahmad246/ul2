"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import Image from "next/image"; // Import Next.js Image component
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IUser } from "@/types/userTypes";
import { navItems } from "./navItems";

interface SidebarContentProps {
  userData: IUser | null;
  status: "authenticated" | "unauthenticated" | "loading";
  onSignIn: () => void;
  onClose: () => void;
}

export default function SidebarContent({ userData, status, onSignIn, onClose }: SidebarContentProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border">
        {status === "authenticated" && userData ? (
          <>
            <div
              className="flex items-center gap-3 mb-4 cursor-pointer"
              onClick={() => {
                onClose();
                router.push("/profile");
              }}
            >
              <Image
                src={userData.profilePicture?.url || "/placeholder.svg"}
                alt={userData.name || "User"}
                width={64}
                height={64}
                className="rounded-full"
              />
              <div>
                <h3 className="font-medium truncate">{userData.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{userData.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{userData.role}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign Out
            </Button>
          </>
        ) : (
          <div>
            {status === "loading" ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin h-5 w-5 border-2 border-t-transparent border-foreground rounded-full" />
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={onSignIn}>
                Sign In with Google
              </Button>
            )}
          </div>
        )}
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
                  "hover:bg-accent"
                )}
                onClick={onClose}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-4 w-4 mr-2" /> Light Mode
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 mr-2" /> Dark Mode
            </>
          )}
        </Button>
      </div>
    </div>
  );
}