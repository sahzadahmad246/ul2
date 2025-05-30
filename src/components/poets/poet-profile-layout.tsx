"use client";

import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Share2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/date";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IPoet } from "@/types/userTypes"; // Import IPoet type

interface PoetProfileLayoutProps {
  poet: IPoet; // Replace any with IPoet
  currentTab: string;
   children: React.ReactNode;
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
];

export default function PoetProfileLayout({
  poet,
  currentTab,
  children,
}: PoetProfileLayoutProps) {
  const router = useRouter();
  const joinDate = new Date(poet.createdAt);
  const isValidJoinDate = !isNaN(joinDate.getTime());

  const handleTabChange = (value: string) => {
    const tab = tabs.find((t) => t.key === value);
    if (tab) {
      router.push(`/poet/${poet.slug}${tab.href}`);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${poet.name} - Poet Profile`,
        text: `Check out ${poet.name}'s poetry collection`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Profile Header - Correct Social Media Style */}
      <Card className="border-border/50 bg-card overflow-hidden">
        {/* Cover Image */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 relative" />

        <CardContent className="p-4 sm:p-6 relative">
          <div className="flex items-start gap-4 -mt-16 sm:-mt-20">
            {/* Profile Picture - Left side, bottom of cover */}
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

            {/* Profile Info - Next to pic, below cover line */}
            <div className="flex-1 pt-12 sm:pt-16 space-y-3">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  {poet.name}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  @{poet.slug}
                </p>
              </div>

              {/* Share Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share Profile
              </Button>
            </div>
          </div>

          {/* Bio */}
          {poet.bio && (
            <div className="mt-4">
              <p className="text-sm sm:text-base text-foreground leading-relaxed">
                {poet.bio}
              </p>
            </div>
          )}

          {/* Location and Join Date */}
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-4">
            {poet.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{poet.location}</span>
              </div>
            )}

            {isValidJoinDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Joined {formatRelativeTime(joinDate)}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 sm:gap-8 mt-4">
            <div className="text-center">
              <div className="font-bold text-lg sm:text-xl text-foreground">
                {poet.poemCount || 0}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Poems
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg sm:text-xl text-foreground">
                {poet.bookmarks?.length || 0}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Bookmarks
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <div className="flex flex-col gap-2">
              {/* First Row */}
              <TabsList className="grid w-full grid-cols-4 h-auto gap-1">
                {tabs.slice(0, 4).map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="text-xs px-2 py-2 h-auto min-h-[40px]"
                    asChild
                  >
                    <Link href={`/poet/${poet.slug}${tab.href}`} className="whitespace-normal">
                      {tab.label}
                    </Link>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Second Row */}
              {tabs.length > 4 && (
                <TabsList className="grid w-full grid-cols-4 h-auto gap-1">
                  {tabs.slice(4).map((tab) => (
                    <TabsTrigger
                      key={tab.key}
                      value={tab.key}
                      className="text-xs px-2 py-2 h-auto min-h-[40px]"
                      asChild
                    >
                      <Link href={`/poet/${poet.slug}${tab.href}`} className="whitespace-normal">
                        {tab.label}
                      </Link>
                    </TabsTrigger>
                  ))}
                </TabsList>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Content */}
      <div className="min-h-[200px]">{children}</div>
    </div>
  );
}