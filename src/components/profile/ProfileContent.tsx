// src/app/components/ProfileContent.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bookmark, FileText, MoreHorizontal, Trash2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/date";
import Link from "next/link";
import { usePoemStore } from "@/store/poem-store";
import { useUserStore } from "@/store/user-store";
import { useState } from "react";
import { toast } from "sonner";
import type { IUser } from "@/types/userTypes";

interface ProfileContentProps {
  userData: IUser;
}

export default function ProfileContent({ userData }: ProfileContentProps) {
  const { bookmarkPoem } = usePoemStore();
  const { fetchUserData } = useUserStore();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [optimisticBookmarks, setOptimisticBookmarks] = useState(userData.bookmarks || []);

  const handleRemoveBookmark = async (poemId: string) => {
    if (!userData._id) {
      toast.error("Please log in to remove bookmarks");
      return;
    }

    setActionLoading(poemId);

    // Optimistically update bookmarks
    const previousBookmarks = optimisticBookmarks;
    setOptimisticBookmarks(previousBookmarks.filter((b) => b.poemId !== poemId));

    try {
      const result = await bookmarkPoem(poemId, userData._id, "remove");
      if (result.success) {
        await fetchUserData(); // Refetch latest user data
        toast.success("Poem removed from bookmarks");
      } else {
        throw new Error(result.message || "Failed to remove bookmark");
      }
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
      toast.error("Failed to remove bookmark");
      setOptimisticBookmarks(previousBookmarks); // Revert on failure
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bookmark className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Bookmarked Poems</h2>
      </div>

      {optimisticBookmarks.length ? (
        <div className="grid gap-3">
          {optimisticBookmarks.map((bookmark, index) => {
            const bookmarkedAt = bookmark.bookmarkedAt ? new Date(bookmark.bookmarkedAt) : null;
            const isValidDate = bookmarkedAt && !isNaN(bookmarkedAt.getTime());

            return (
              <Card key={bookmark.poemId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      {bookmark.poem ? (
                        <>
                          <Link href={`/poems/en/${bookmark.poem.slug}`} className="font-medium hover:underline">
                            {bookmark.poem.firstCouplet || `Poem ${index + 1}`}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            By {bookmark.poem.poetName} • {bookmark.poem.viewsCount} views
                          </p>
                          {isValidDate && (
                            <p className="text-sm text-muted-foreground">
                              Bookmarked {formatRelativeTime(bookmarkedAt)}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Poem data not available</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveBookmark(bookmark.poemId)}
                        disabled={actionLoading === bookmark.poemId || !userData._id}
                      >
                        {actionLoading === bookmark.poemId ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-destructive border-muted" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
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
  );
}