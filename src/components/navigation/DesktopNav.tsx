"use client"

import { useEffect } from "react"
import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Feather, Moon, Sun, Sparkles, Crown, User } from "lucide-react"
import Link from "next/link"
import { useUserStore } from "@/store/user-store"
import { navItems } from "./navItems"
// Wrap the Explore component in a client-side only wrapper to prevent hydration issues:

// Add this import at the top
import dynamic from "next/dynamic"

// Add this before the DesktopNav component definition
const ExploreClientOnly = dynamic(
  () => import("@/components/Explore/Explore").then((mod) => ({ default: mod.Explore })),
  { ssr: false },
)

interface DesktopNavProps {
  children: ReactNode
}

export default function DesktopNav({ children }: DesktopNavProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { data: session, status } = useSession()
  const { userData, fetchUserData } = useUserStore()

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchUserData()
    }
  }, [status, session, fetchUserData])

  const handleSignIn = async () => {
    await signIn("google", { callbackUrl: pathname || "/profile" })
  }

  // Filter navItems to show Dashboard only for admin users
  const filteredNavItems = navItems.filter((item) => item.name !== "Dashboard" || userData?.role === "admin")

  return (
    <div className="max-w-7xl mx-auto flex min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Enhanced Left Sidebar */}
      <aside className="fixed top-0 bottom-0 w-[280px] left-[calc(50%-640px)] border-r border-border/40 bg-gradient-to-b from-background/95 to-muted/20 backdrop-blur-xl flex flex-col py-6 z-10 shadow-lg">
        {/* Logo Section */}
        <Link
          href="/"
          className="group flex items-center gap-3 px-6 mb-8 hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 rounded-xl mx-4 p-3 transition-all duration-300"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
            <Feather className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Unmatched Lines
            </span>
            <p className="text-xs text-muted-foreground">Poetry Platform</p>
          </div>
        </Link>

        {/* User Profile Section */}
        <div className="px-6 mb-6">
          {status === "authenticated" && userData ? (
            <Link
              href="/profile"
              className="group flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 hover:from-primary/10 hover:to-accent/10 transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-[1.02]"
            >
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 shadow-lg">
                  <Image
                    src={userData.profilePicture?.url || "/placeholder.svg"}
                    alt={userData.name || "User"}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=48&width=48"
                    }}
                  />
                </div>
                {userData.role === "admin" && (
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                    <Crown className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors duration-300">
                  {userData.name}
                </h4>
                <p className="text-xs text-muted-foreground/80 truncate">@{userData.slug}</p>
                <div
                  className={cn(
                    "inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize mt-1",
                    userData.role === "admin"
                      ? "bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 text-yellow-700 dark:text-yellow-300"
                      : "bg-gradient-to-r from-primary/20 to-accent/20 text-primary",
                  )}
                >
                  {userData.role}
                </div>
              </div>
            </Link>
          ) : status === "loading" ? (
            <div className="flex items-center justify-center p-6">
              <div className="relative">
                <div className="h-8 w-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-primary border-muted" />
                </div>
                <div className="absolute inset-0 h-8 w-8 animate-ping opacity-20">
                  <div className="h-full w-full bg-primary rounded-full" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-center space-y-2 p-4">
                <div className="h-12 w-12 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Welcome!</h4>
                  <p className="text-xs text-muted-foreground">Join our poetry community</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border-primary/30 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md"
                onClick={handleSignIn}
              >
                <User className="h-4 w-4" />
                Sign In with Google
              </Button>
            </div>
          )}
        </div>

        {/* Enhanced Navigation */}
        <nav className="flex-1 w-full px-4 overflow-y-auto">
          <ul className="flex flex-col gap-2">
            {filteredNavItems.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name} className="w-full">
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative",
                      "hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:shadow-md hover:scale-[1.02]",
                      "focus:outline-none focus:ring-2 focus:ring-primary/50",
                      isActive
                        ? "bg-gradient-to-r from-primary/15 to-accent/15 text-primary shadow-md scale-[1.02]"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full" />
                    )}
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm",
                        isActive
                          ? "bg-gradient-to-br from-primary/30 to-accent/30 shadow-md"
                          : "bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 transition-all duration-300",
                          isActive ? "text-primary scale-110" : "text-primary group-hover:scale-110",
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "transition-all duration-300",
                        isActive ? "font-semibold" : "group-hover:font-semibold",
                      )}
                    >
                      {item.name}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Enhanced Theme Toggle */}
        <div className="px-4 mt-auto">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 bg-gradient-to-r from-muted/50 to-muted/30 hover:from-primary/10 hover:to-accent/10 border-border/50 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              {theme === "dark" ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4 text-primary" />}
            </div>
            <span className="font-medium">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </Button>
        </div>
      </aside>

      {/* Enhanced Main Content */}
      <main className="flex-1 min-h-screen ml-[280px] mr-[380px]">
        <div className="max-w-full mx-auto py-6 px-6">{children}</div>
      </main>

      {/* Enhanced Right Sidebar */}
      <aside className="fixed top-0 bottom-0 w-[380px] right-[calc(50%-640px)] border-l border-border/40 bg-gradient-to-b from-background/95 to-muted/20 backdrop-blur-xl overflow-y-auto py-6 z-10 shadow-lg">
        <div className="h-full">
          <ExploreClientOnly />
        </div>
      </aside>
    </div>
  )
}
