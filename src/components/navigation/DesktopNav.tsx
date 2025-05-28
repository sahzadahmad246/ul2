"use client";

import { useEffect } from "react";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image"; // Import Next.js Image component
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Feather, Moon, Sun, Search } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/store/user-store";
import { navItems } from "./navItems";

interface DesktopNavProps {
  children: ReactNode;
}

export default function DesktopNav({ children }: DesktopNavProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const { userData, fetchUserData } = useUserStore();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchUserData();
    }
  }, [status, session, fetchUserData]);

  const handleSignIn = async () => {
    await signIn("google", { callbackUrl: pathname || "/profile" });
  };

  return (
    <div className="max-w-7xl mx-auto flex min-h-screen">
      <aside className="fixed top-0 bottom-0 w-[240px] left-[calc(50%-640px)] border-r border-border bg-background flex flex-col py-4 z-10">
        <Link href="/" className="flex items-center gap-3 px-6 mb-8">
          <Feather className="h-5 w-5 text-foreground" />
          <span className="text-sm font-semibold">Unmatched Lines</span>
        </Link>
        <div className="px-7 mb-4">
          {status === "authenticated" && userData ? (
            <Link href="/profile" className="flex items-center gap-3">
              <Image
                src={userData.profilePicture?.url || "/placeholder.svg"}
                alt={userData.name || "User"}
                width={32} // Specify width for Image component
                height={32} // Specify height for Image component
                className="rounded-full"
              />
              <div>
                <h4 className="font-medium text-sm truncate">{userData.name}</h4>
                <p className="text-xs text-muted-foreground capitalize">{userData.role}</p>
              </div>
            </Link>
          ) : (
            <Button variant="outline" className="w-full" onClick={handleSignIn}>
              Sign In with Google
            </Button>
          )}
        </div>
        <nav className="flex-1 w-full px-4">
          <ul className="flex flex-col gap-2">
            {navItems.map((item) => (
              <li key={item.name} className="w-full">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="px-4 mt-auto">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-h-screen ml-[240px] mr-[360px]">
        <div className="max-w-full mx-auto py-6 px-8">{children}</div>
      </main>
      <aside className="fixed top-0 bottom-0 w-[360px] right-[calc(50%-640px)] border-l border-border bg-background overflow-y-auto py-4 z-10">
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search poetry..."
              className="w-full rounded-full bg-accent/50 px-4 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-border"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </aside>
    </div>
  );
}