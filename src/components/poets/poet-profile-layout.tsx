"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, Share2, Crown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { IPoet } from "@/types/userTypes"

interface PoetProfileLayoutProps {
  poet: IPoet
  currentTab: string
  children: React.ReactNode
}

const tabs = [
  { key: "profile", label: "Profile", href: "" },
  { key: "all-works", label: "All Works", href: "/all-works" },
  { key: "ghazal", label: "Ghazals", href: "/ghazal" },
  { key: "sher", label: "Shers", href: "/sher" },
  { key: "nazm", label: "Nazms", href: "/nazm" },
  { key: "top-20", label: "Top 20", href: "/top-20" },
  { key: "top-20-ghazal", label: "Top Ghazals", href: "/top-20-ghazal" },
  { key: "top-20-sher", label: "Top Shers", href: "/top-20-sher" },
]

export default function PoetProfileLayout({ poet, currentTab, children }: PoetProfileLayoutProps) {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  const handleTabChange = (value: string) => {
    const tab = tabs.find((t) => t.key === value)
    if (tab) {
      router.push(`/poet/${poet.slug}${tab.href}`)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${poet.name} - Poet Profile`,
        text: `Check out ${poet.name}'s poetry collection`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Sticky Header */}
      <div
        className={`fixed top-0 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl bg-background/80 backdrop-blur-md border-b border-border/50 transition-all duration-300 ${scrolled ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src={poet.profilePicture?.url || "/placeholder.svg"} alt={poet.name} />
              <AvatarFallback>
                {poet.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium truncate">{poet.name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <Card className="border-border/50 bg-card overflow-hidden">
        {/* Cover Image */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 relative" />

        <CardContent className="p-4 sm:p-6 relative">
          <div className="flex items-start gap-4 -mt-16 sm:-mt-20">
            {/* Profile Picture */}
            <div className="relative">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-background shadow-lg flex-shrink-0">
                <AvatarImage
                  src={poet.profilePicture?.url || "/placeholder.svg"}
                  alt={poet.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-lg sm:text-2xl font-bold text-white">
                  {poet.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
             
                <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="h-4 w-4 text-white" />
                </div>
              
            </div>

            {/* Profile Info */}
            <div className="flex-1 pt-12 sm:pt-16 space-y-3">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{poet.name}</h1>
                <p className="text-sm sm:text-base text-muted-foreground">@{poet.slug}</p>
              </div>

              {/* Header Actions */}
              <div className="flex justify-between items-center">
                <div className="flex gap-6 sm:gap-8">
                  <div className="text-center">
                    <div className="font-bold text-lg sm:text-xl text-foreground">{poet.poemCount || 0}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Poems</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg sm:text-xl text-red-500">{poet.bookmarks?.length || 0}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Bookmarks</div>
                  </div>
                </div>

                <Button variant="ghost" size="icon" onClick={handleShare} className="h-10 w-10">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs - Multi-line */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <div className="p-4 border border-border/50 rounded-lg bg-card">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto gap-2 w-full">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="text-xs sm:text-sm px-2 py-2 h-auto" asChild>
                <Link href={`/poet/${poet.slug}${tab.href}`}>{tab.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {/* Content */}
      <div className="min-h-[200px] pt-4">{children}</div>
    </div>
  )
}
