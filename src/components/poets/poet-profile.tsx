"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText, MapPin, Calendar, Mail, Bookmark, Share2, MoreHorizontal, Heart, MessageCircle } from "lucide-react"
import { usePoetStore } from "@/store/poet-store"
import PoetProfileSkeleton from "./poet-profile-skeleton"
import { formatRelativeTime } from "@/lib/utils/date"

interface PoetProfileProps {
  slug: string
}

export default function PoetProfile({ slug }: PoetProfileProps) {
  const { poet, loading, error, fetchPoetByIdentifier } = usePoetStore()

  useEffect(() => {
    if (slug) {
      fetchPoetByIdentifier(slug)
    }
  }, [slug, fetchPoetByIdentifier])

  if (loading) {
    return <PoetProfileSkeleton />
  }

  if (error || !poet) {
    return (
      <Card className="border-destructive/50 bg-destructive/5 max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="text-destructive mb-2">{error || "Poet not found"}</div>
          <Button onClick={() => fetchPoetByIdentifier(slug)} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const joinDate = new Date(poet.createdAt)
  const isValidJoinDate = !isNaN(joinDate.getTime())

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="border-border/50 bg-card overflow-hidden">
        {/* Cover Image Placeholder */}
        <div className="h-32 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20" />

        <CardContent className="p-8 -mt-16 relative">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Picture */}
            <Avatar className="h-32 w-32 ring-4 ring-background mx-auto md:mx-0 relative z-10">
              <AvatarImage
                src={poet.profilePicture?.url || "/placeholder.svg"}
                alt={poet.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-2xl font-bold text-white">
                {poet.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Profile Info */}
            <div className="flex-1 space-y-4 pt-16 md:pt-0">
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-foreground">{poet.name}</h1>
                <p className="text-muted-foreground">@{poet.slug}</p>
              </div>

              {poet.bio && <p className="text-foreground leading-relaxed">{poet.bio}</p>}

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground justify-center md:justify-start">
                {poet.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{poet.location}</span>
                  </div>
                )}

                {isValidJoinDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {formatRelativeTime(joinDate)}</span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{poet.email}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 justify-center md:justify-start">
                <div className="text-center">
                  <div className="font-bold text-lg text-foreground">{poet.poemCount}</div>
                  <div className="text-sm text-muted-foreground">Poems</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-foreground">{poet.bookmarks.length}</div>
                  <div className="text-sm text-muted-foreground">Bookmarks</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center md:justify-start">
                <Button className="flex-1 md:flex-none">
                  <Heart className="h-4 w-4 mr-2" />
                  Follow
                </Button>
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-6">
          <div className="flex gap-6 border-b border-border">
            <Button variant="ghost" className="border-b-2 border-primary rounded-none">
              <FileText className="h-4 w-4 mr-2" />
              Poems ({poet.poemCount})
            </Button>
            <Button variant="ghost" className="rounded-none">
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmarks ({poet.bookmarks.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Poems */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Recent Poems
        </h2>

        {poet.poems.length > 0 ? (
          <div className="grid gap-4">
            {poet.poems.slice(0, 5).map((poem, index) => (
              <Card key={poem.poemId || index} className="hover:shadow-md transition-shadow border-border/50 bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">Poem {index + 1}</h3>
                      <p className="text-sm text-muted-foreground">Published recently</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border/50 bg-card">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium mb-2">No poems yet</h3>
              <p className="text-sm text-muted-foreground">This poet has not published any poems yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
