"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bookmark, FileText, MoreHorizontal, Trash2 } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils/date"
import type { IUser } from "@/types/userTypes"

interface ProfileContentProps {
  userData: IUser
}

export default function ProfileContent({ userData }: ProfileContentProps) {
  const handleRemoveBookmark = (bookmarkId: string) => {
    // TODO: Add remove bookmark logic
    console.log("Remove bookmark:", bookmarkId)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bookmark className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Bookmarked Poems</h2>
      </div>

      {userData.bookmarks?.length ? (
        <div className="grid gap-3">
          {userData.bookmarks.map((bookmark, index) => {
            const bookmarkedAt = bookmark.bookmarkedAt ? new Date(bookmark.bookmarkedAt) : null
            const isValidDate = bookmarkedAt && !isNaN(bookmarkedAt.getTime())

            return (
              <Card key={bookmark.poemId || index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Poem {index + 1}</h3>
                      {isValidDate && (
                        <p className="text-sm text-muted-foreground">Bookmarked {formatRelativeTime(bookmarkedAt)}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveBookmark(bookmark.poemId || `${index}`)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-2">No bookmarked poems yet</h3>
            <p className="text-sm text-muted-foreground">
              Start exploring and bookmark your favorite poems to see them here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
