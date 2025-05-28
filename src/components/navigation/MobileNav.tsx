"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image"; // Import Next.js Image component
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Feather, Moon, Sun } from "lucide-react";
import Link from "next/link";
import SidebarContent from "./SidebarContent";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { useUserStore } from "@/store/user-store";
import { navItems } from "./navItems";

interface MobileNavProps {
  children: React.ReactNode;
}

export default function MobileNav({ children }: MobileNavProps) {
  const pathname = usePathname();
  const [showSidebar, setShowSidebar] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const { userData, fetchUserData } = useUserStore();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchUserData();
    }
  }, [status, session, fetchUserData]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setHideBottomNav(currentScrollY > lastScrollY && currentScrollY > 100);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleSignIn = async () => {
    await signIn("google", { callbackUrl: pathname || "/profile" });
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center justify-between h-full px-4">
          <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Image
                  src={userData?.profilePicture?.url || "/placeholder.svg"}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SidebarContent
                userData={userData}
                status={status}
                onSignIn={handleSignIn}
                onClose={() => setShowSidebar(false)}
              />
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center justify-center">
            <Feather className="h-6 w-6 text-foreground" />
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>
      <main className="min-h-screen pt-20 pb-20">
        <div className="max-w-xl mx-auto px-4 py-6">{children}</div>
      </main>
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background/80 backdrop-blur-md z-50 transition-transform duration-300",
          hideBottomNav ? "translate-y-full" : "translate-y-0"
        )}
      >
        <div className="grid grid-cols-4 h-full">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1",
                pathname === item.href ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}