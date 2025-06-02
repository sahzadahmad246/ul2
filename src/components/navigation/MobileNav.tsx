"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Feather, Moon, Sun, Menu } from "lucide-react"
import Link from "next/link"
import SidebarContent from "./SidebarContent"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import { useUserStore } from "@/store/user-store"
import { navItems } from "./navItems"

interface MobileNavProps {
  children: React.ReactNode
}

export default function MobileNav({ children }: MobileNavProps) {
  const pathname = usePathname()
  const [showSidebar, setShowSidebar] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [hideBottomNav, setHideBottomNav] = useState(false)
  const { theme, setTheme } = useTheme()
  const { data: session, status } = useSession()
  const { userData, fetchUserData } = useUserStore()

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchUserData()
    }
  }, [status, session, fetchUserData])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setHideBottomNav(currentScrollY > lastScrollY && currentScrollY > 100)
      setLastScrollY(currentScrollY)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  const handleSignIn = async () => {
    await signIn("google", { callbackUrl: pathname || "/profile" })
  }

  // Filter navItems to show Dashboard only for admin users
  const filteredNavItems = navItems.filter((item) => item.name !== "Dashboard" || userData?.role === "admin")

  return (
    <>
      {/* Enhanced Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-border/40 bg-gradient-to-r from-background/95 via-background/90 to-background/95 backdrop-blur-xl z-50 shadow-sm">
        <div className="flex items-center justify-between h-full px-4 max-w-full">
          <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative group hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 transition-all duration-300 rounded-xl"
              >
                {userData?.profilePicture?.url ? (
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                      <Image
                        src={userData.profilePicture.url || "/placeholder.svg"}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=32&width=32"
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-gradient-to-br from-primary to-primary/80 rounded-full border border-background" />
                  </div>
                ) : (
                  <Menu className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 bg-gradient-to-b from-background to-muted/20">
              <SidebarContent
                userData={userData}
                status={status}
                onSignIn={handleSignIn}
                onClose={() => setShowSidebar(false)}
              />
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="group flex items-center justify-center p-2 rounded-xl hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 transition-all duration-300"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300 shadow-sm">
              <Feather className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="group hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 transition-all duration-300 rounded-xl"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300 shadow-sm">
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-300" />
              ) : (
                <Moon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-300" />
              )}
            </div>
          </Button>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <main className="min-h-screen pt-20 pb-20 bg-gradient-to-br from-background via-background to-muted/10">
        <div className="max-w-xl mx-auto py-6 px-4">{children}</div>
      </main>

      {/* Enhanced Bottom Navigation */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 h-16 border-t border-border/40 bg-gradient-to-r from-background/95 via-background/90 to-background/95 backdrop-blur-xl z-50 transition-all duration-300 shadow-lg",
          hideBottomNav ? "translate-y-full opacity-0" : "translate-y-0 opacity-100",
        )}
      >
        <div className="grid grid-cols-4 h-full max-w-full">
          {filteredNavItems.slice(0, 4).map((item, index) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex flex-col items-center justify-center gap-1 p-2 transition-all duration-300 relative",
                  "hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-primary to-accent rounded-full" />
                )}
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm",
                    isActive
                      ? "bg-gradient-to-br from-primary/30 to-accent/30"
                      : "bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 transition-all duration-300",
                      isActive ? "scale-110" : "group-hover:scale-110",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-all duration-300",
                    isActive ? "font-semibold" : "group-hover:font-semibold",
                  )}
                >
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
