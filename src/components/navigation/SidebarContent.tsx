"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Sun, Moon, LogOut, User, Crown, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { IUser } from "@/types/userTypes"
import { navItems } from "./navItems"

interface SidebarContentProps {
  userData: IUser | null
  status: "authenticated" | "unauthenticated" | "loading"
  onSignIn: () => void
  onClose: () => void
}

export default function SidebarContent({ userData, status, onSignIn, onClose }: SidebarContentProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header Section */}
      <div className="p-6 border-b border-border/40 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm">
        {status === "authenticated" && userData ? (
          <div className="space-y-4">
            <div
              className="group flex items-center gap-4 p-3 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              onClick={() => {
                onClose()
                router.push("/profile")
              }}
            >
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 shadow-lg">
                  <Image
                    src={userData.profilePicture?.url || "/placeholder.svg"}
                    alt={userData.name || "User"}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=64&width=64"
                    }}
                  />
                </div>
                {userData.role === "admin" && (
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                    <Crown className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors duration-300">
                  {userData.name}
                </h3>
                <p className="text-sm text-muted-foreground/80 truncate font-medium">@{userData.slug}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-semibold capitalize",
                      userData.role === "admin"
                        ? "bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 text-yellow-700 dark:text-yellow-300"
                        : "bg-gradient-to-r from-primary/20 to-accent/20 text-primary",
                    )}
                  >
                    {userData.role}
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2 bg-gradient-to-r from-destructive/10 to-destructive/5 hover:from-destructive/20 hover:to-destructive/10 border-destructive/30 text-destructive hover:text-destructive-foreground hover:bg-destructive transition-all duration-300 shadow-sm hover:shadow-md"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {status === "loading" ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="relative">
                  <div className="h-12 w-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-primary border-muted" />
                  </div>
                  <div className="absolute inset-0 h-12 w-12 animate-ping opacity-20">
                    <div className="h-full w-full bg-primary rounded-full" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">Loading your profile...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center space-y-2">
                  <div className="h-16 w-16 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center shadow-lg">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Welcome!</h3>
                    <p className="text-sm text-muted-foreground">Sign in to explore poetry</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border-primary/30 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md"
                  onClick={onSignIn}
                >
                  <User className="h-4 w-4" />
                  Sign In with Google
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item, index) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                  "hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:shadow-md hover:scale-[1.02]",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50",
                )}
                onClick={onClose}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300 shadow-sm">
                  <item.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span className="group-hover:text-primary transition-colors duration-300">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-border/40 bg-gradient-to-br from-card/40 to-card/20 backdrop-blur-sm">
        <Button
          variant="outline"
          className="w-full gap-3 bg-gradient-to-r from-muted/50 to-muted/30 hover:from-primary/10 hover:to-accent/10 border-border/50 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            {theme === "dark" ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4 text-primary" />}
          </div>
          <span className="font-medium">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </Button>
      </div>
    </div>
  )
}
