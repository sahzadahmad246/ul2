"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Compass, User, BookOpen, Feather, BookText, Settings, Moon, Sun, Search } from "lucide-react"
import { useTheme } from "next-themes"
import { useSession, signIn, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useMobile } from "@/hooks/use-mobile"
import { useUserStore } from "@/store/user-store"

interface NavigationProps {
  children: React.ReactNode
}

export default function Navigation({ children }: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showSidebar, setShowSidebar] = useState(false)
  const { theme, setTheme } = useTheme()
  const isMobile = useMobile()
  const [lastScrollY, setLastScrollY] = useState(0)
  const [hideBottomNav, setHideBottomNav] = useState(false)
  const { data: session, status } = useSession()
  const { userData, fetchUserData } = useUserStore()

  // Navigation items
  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Explore", href: "/explore", icon: Compass },
    { name: "Poet", href: "/Poet", icon: User },
    { name: "Sher", href: "/sher", icon: BookOpen },
    { name: "Ghazal", href: "/ghazal", icon: Feather },
    { name: "Nazm", href: "/nazm", icon: BookText },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  const bottomNavItems = navItems.slice(0, 4)

  // Fetch user data when signed in
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchUserData()
    }
  }, [status, session, fetchUserData])

  // Handle scroll for mobile bottom nav
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHideBottomNav(true)
      } else {
        setHideBottomNav(false)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Handle profile navigation with sidebar closing
  const handleProfileClick = () => {
    setShowSidebar(false)
    router.push("/profile")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Top Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/80 backdrop-blur-md z-50 md:hidden">
          <div className="flex items-center justify-between h-full px-4">
            {/* Left: Profile Icon or Sign In */}
            <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Avatar className="h-8 w-8">
                    {status === "authenticated" && userData?.profilePicture?.url ? (
                      <AvatarImage
                        src={userData.profilePicture.url || "/placeholder.svg"}
                        alt={userData.name || "User"}
                      />
                    ) : (
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="flex flex-col h-full bg-background">
                  {/* User Profile Info in Sidebar */}
                  <div className="p-4 border-b border-border">
                    {status === "authenticated" && userData ? (
                      <>
                        <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={handleProfileClick}>
                          <Avatar className="h-16 w-16">
                            <AvatarImage
                              src={userData.profilePicture?.url || "/placeholder.svg?height=64&width=64"}
                              alt={userData.name || "User"}
                            />
                            <AvatarFallback>{userData.name?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="overflow-hidden">
                            <h3 className="font-medium truncate">{userData.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{userData.email}</p>
                          </div>
                        </div>
                        <div className="flex justify-between mt-2">
                          <div className="text-center">
                            <p className="font-medium">{userData.followingCount ?? 0}</p>
                            <p className="text-xs text-muted-foreground">Following</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{userData.followerCount ?? 0}</p>
                            <p className="text-xs text-muted-foreground">Followers</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{userData.poemCount ?? 0}</p>
                            <p className="text-xs text-muted-foreground">Poems</p>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full mt-4" onClick={() => signOut({ callbackUrl: "/" })}>
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground">Please sign in to view your profile.</p>
                        <Button
                          variant="outline"
                          className="w-full mt-4"
                          onClick={() => signIn("google", { callbackUrl: "/profile" })}
                        >
                          Sign In with Google
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Navigation Items in Sidebar */}
                  <nav className="flex-1 p-4">
                    <ul className="space-y-2">
                      {navItems.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                              pathname === item.href
                                ? theme === "dark"
                                  ? "bg-white/10 text-white"
                                  : "bg-[#0a1929]/10 text-[#0a1929]"
                                : "hover:bg-accent",
                            )}
                            onClick={() => setShowSidebar(false)}
                          >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  <div className="p-4 border-t border-border">
                    <Button variant="outline" className="w-full" onClick={toggleTheme}>
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
              </SheetContent>
            </Sheet>

            {/* Middle: Logo */}
            <Link href="/" className="flex items-center justify-center">
              <Feather className={cn("h-6 w-6", theme === "dark" ? "text-white" : "text-[#0a1929]")} />
            </Link>

            {/* Right: Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>
      )}

      {/* Desktop Layout */}
      {!isMobile ? (
        <div className="max-w-7xl mx-auto flex min-h-screen">
          {/* Left Sidebar */}
          <aside className="fixed top-0 bottom-0 w-[240px] left-[calc(50%-640px)] border-r border-border bg-background flex flex-col py-4 z-10">
            <Link href="/" className="flex items-center gap-3 px-6 mb-8">
              <Feather className={cn("h-5 w-5", theme === "dark" ? "text-white" : "text-[#0a1929]")} />
              <span className="text-sm font-semibold">Unmatched Lines</span>
            </Link>

            {/* Profile Section */}
            <div className="px-7 mb-4">
              {status === "authenticated" && userData ? (
                <Link href="/profile" className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={userData.profilePicture?.url || "/placeholder.svg?height=32&width=32"}
                      alt={userData.name || "User"}
                    />
                    <AvatarFallback>{userData.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <h4 className="font-medium text-sm truncate">{userData.name}</h4>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => signIn("google", { callbackUrl: "/profile" })}
                >
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
                        "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                        pathname === item.href
                          ? theme === "dark"
                            ? "bg-white/10 text-white"
                            : "bg-[#0a1929]/10 text-[#0a1929]"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground",
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
              <Button variant="outline" className="w-full justify-start gap-3" onClick={toggleTheme}>
                {theme === "dark" ? (
                  <>
                    <Sun className="h-5 w-5" /> Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5" /> Dark Mode
                  </>
                )}
              </Button>
            </div>
          </aside>

          {/* Main Content - Expanded to fill the space */}
          <main className="flex-1 min-h-screen ml-[240px] mr-[360px]">
            <div className="max-w-full mx-auto py-6 px-8">{children}</div>
          </main>

          {/* Right Sidebar */}
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

              <div className="mt-6">
                <h3 className="font-semibold mb-3">Trending Poets</h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`/placeholder.svg?height=40&width=40&text=P${i}`} alt={`Poet ${i}`} />
                        <AvatarFallback>P{i}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-sm">Famous Poet {i}</h4>
                        <p className="text-xs text-muted-foreground">1.2K followers</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-3">Popular Ghazals</h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-3 rounded-md bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <h4 className="font-medium text-sm">Beautiful Ghazal Title {i}</h4>
                      <p className="text-xs text-muted-foreground mt-1">by Poet Name</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {["Love", "Nature", "Life", "Philosophy", "Spirituality", "Sadness"].map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "px-3 py-1 text-xs rounded-full transition-colors cursor-pointer",
                        theme === "dark"
                          ? "bg-white/10 text-white hover:bg-white/20"
                          : "bg-[#0a1929]/10 text-[#0a1929] hover:bg-[#0a1929]/20",
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <main className="min-h-screen pt-20 pb-20">
          <div className="max-w-xl mx-auto px-4 py-6">{children}</div>
        </main>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav
          className={cn(
            "fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background/80 backdrop-blur-md z-50 md:hidden transition-transform duration-300",
            hideBottomNav ? "translate-y-full" : "translate-y-0",
          )}
        >
          <div className="grid grid-cols-4 h-full">
            {bottomNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1",
                  pathname === item.href
                    ? theme === "dark"
                      ? "text-white"
                      : "text-[#0a1929]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
