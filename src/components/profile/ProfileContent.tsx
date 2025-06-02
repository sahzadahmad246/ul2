"use client"

import { Button } from "@/components/ui/button"
import { Bookmark, Trash2, Sparkles, Heart, Eye } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils/date"
import Link from "next/link"
import { usePoemStore } from "@/store/poem-store"
import { useUserStore } from "@/store/user-store"
import { useState } from "react"
import { toast } from "sonner"
import type { IUser } from "@/types/userTypes"

interface ProfileContentProps {
  userData: IUser
}

export default function ProfileContent({ userData }: ProfileContentProps) {
  const { bookmarkPoem } = usePoemStore()
  const { fetchUserData } = useUserStore()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [optimisticBookmarks, setOptimisticBookmarks] = useState(userData.bookmarks || [])

  const handleRemoveBookmark = async (poemId: string) => {
    if (!userData._id) {
      toast.error("Please log in to remove bookmarks")
      return
    }

    setActionLoading(poemId)
    const previousBookmarks = optimisticBookmarks
    setOptimisticBookmarks(previousBookmarks.filter((b) => b.poemId !== poemId))

    try {
      const result = await bookmarkPoem(poemId, userData._id, "remove")
      if (result.success) {
        await fetchUserData()
        toast.success("Poem removed from bookmarks")
      } else {
        throw new Error(result.message || "Failed to remove bookmark")
      }
    } catch (error) {
      console.error("Failed to remove bookmark:", error)
      toast.error("Failed to remove bookmark")
      setOptimisticBookmarks(previousBookmarks)
    } finally {
      setActionLoading(null)
    }
  }

  const formatCouplet = (couplet: string) => {
    return couplet.split("\n").map((line, index) => (
      <div key={index} className="leading-relaxed">
        {line}
      </div>
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 py-4">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Bookmark className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Bookmarked Poems</h2>
          <p className="text-sm text-muted-foreground">Your saved poetry collection</p>
        </div>
      </div>

      {optimisticBookmarks.length ? (
        <div className="grid gap-4">
          {optimisticBookmarks.map((bookmark, index) => {
            const bookmarkedAt = bookmark.bookmarkedAt ? new Date(bookmark.bookmarkedAt) : null
            const isValidDate = bookmarkedAt && !isNaN(bookmarkedAt.getTime())

            return (
              <article
                key={bookmark.poemId}
                className="group relative rounded-xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />

                <div className="relative">
                  {bookmark.poem ? (
                    <>
                      {/* Couplet with vertical line like poem card */}
                      <Link href={`/poems/en/${bookmark.poem.slug}`} className="block group/link mb-4">
                        <div className="relative pl-6">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/80 to-primary/40 rounded-full" />
                          <div className="text-lg leading-loose text-foreground/90 group-hover/link:text-primary/90 transition-colors duration-300 space-y-1">
                            {formatCouplet(bookmark.poem.firstCouplet || `Poem ${index + 1}`)}
                          </div>
                        </div>
                      </Link>

                      {/* Poem Info */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            By {bookmark.poem.poetName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {bookmark.poem.viewsCount} views
                          </span>
                        </div>
                        {isValidDate && (
                          <span className="text-xs text-muted-foreground">
                            Bookmarked {formatRelativeTime(bookmarkedAt)}
                          </span>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/30">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Bookmark className="h-4 w-4 text-primary fill-current" />
                          <span>Bookmarked</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                          onClick={() => handleRemoveBookmark(bookmark.poemId)}
                          disabled={actionLoading === bookmark.poemId}
                        >
                          {actionLoading === bookmark.poemId ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-destructive border-muted" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Poem data not available</p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gradient-to-br from-card/50 to-card/30 rounded-xl backdrop-blur-sm">
          <div className="relative mb-6">
            <div className="h-20 w-20 mx-auto bg-gradient-to-br from-muted/50 to-muted/30 rounded-full flex items-center justify-center">
              <Bookmark className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <Sparkles className="absolute top-2 right-1/3 h-5 w-5 text-primary/40 animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold mb-3">No bookmarked poems yet</h3>
          <p className="text-muted-foreground leading-relaxed mb-6 max-w-md mx-auto">
            Start exploring and bookmark your favorite poems to see them here. Build your personal poetry collection!
          </p>
          <Button asChild className="gap-2">
            <Link href="/poems">
              <Heart className="h-4 w-4" />
              Explore Poems
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
