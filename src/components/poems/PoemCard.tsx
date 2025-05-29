// src/components/poems/PoemCard.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { SerializedPoem } from "@/types/poemTypes";
import { Bookmark, Eye, Share2, Clock, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUserStore } from "@/store/user-store";
import { usePoemStore } from "@/store/poem-store";
import { toast } from "sonner";

interface PoemCardProps {
  poem: SerializedPoem;
}

function isPoetObject(
  poet: {
    _id: string;
    name: string;
    role?: string;
    profilePicture?: { publicId?: string; url: string };
    slug?: string;
  } | null
): poet is {
  _id: string;
  name: string;
  role?: string;
  profilePicture?: { publicId?: string; url: string };
  slug?: string;
} {
  return poet !== null && typeof poet === "object" && "name" in poet;
}

export default function PoemCard({ poem }: PoemCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [optimisticBookmarkCount, setOptimisticBookmarkCount] = useState(
    poem.bookmarkCount || 0
  );
  const { userData, fetchUserData } = useUserStore();
  const { bookmarkPoem } = usePoemStore();

  useEffect(() => {
    if (userData?._id && poem) {
      const userId = userData._id.toString();
      setIsBookmarked(
        userData.bookmarks?.some(
          (b) => b.poemId.toString() === poem._id.toString()
        ) ||
          poem.bookmarks?.some(
            (bookmark) => bookmark.userId.toString() === userId
          ) ||
          false
      );
    } else {
      setIsBookmarked(false);
    }

    setOptimisticBookmarkCount(poem.bookmarkCount || 0);
  }, [userData, poem]);

  const poetName = isPoetObject(poem.poet) ? poem.poet.name : "Unknown Poet";
  const poetImage = isPoetObject(poem.poet)
    ? poem.poet.profilePicture?.url || "/placeholder.svg?height=48&width=48"
    : "/placeholder.svg?height=48&width=48";

  const previewCouplet = poem.content.en[0]?.couplet || "";

  const formatCouplet = (couplet: string) => {
    // Only preserve line breaks that are already in the text
    return couplet;
  };

  const handleBookmark = async () => {
    if (!userData?._id) {
      toast.error("Please log in to bookmark poems");
      return;
    }

    setActionLoading("bookmark");
    const previousBookmarkCount = optimisticBookmarkCount;
    const previousIsBookmarked = isBookmarked;

    setOptimisticBookmarkCount(
      isBookmarked ? optimisticBookmarkCount - 1 : optimisticBookmarkCount + 1
    );
    setIsBookmarked(!isBookmarked);

    try {
      const result = await bookmarkPoem(
        poem._id,
        userData._id,
        isBookmarked ? "remove" : "add"
      );

      if (result.success) {
        await fetchUserData();
        toast.success(
          isBookmarked ? "Poem removed from bookmarks" : "Poem bookmarked"
        );
      } else {
        throw new Error(result.message || "Failed to update bookmark");
      }
    } catch (error) {
      console.error("Failed to bookmark poem:", error);
      toast.error("Failed to bookmark poem");
      setIsBookmarked(previousIsBookmarked);
      setOptimisticBookmarkCount(previousBookmarkCount);
    } finally {
      setActionLoading(null);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: poem.title.en,
        text: previewCouplet,
        url: `/poems/en/${poem.slug.en}`,
      });
    } else {
      navigator.clipboard.writeText(
        `${window.location.origin}/poems/en/${poem.slug.en}`
      );
      toast.success("Poem link copied to clipboard");
    }
  };

  return (
    <article className="group rounded-2xl border border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-lg hover:border-border transition-all duration-300 hover:-translate-y-1">
      {/* Enhanced Header */}
      <div className="flex items-center gap-4 p-5 border-b border-border/30">
        <div className="relative flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 overflow-hidden ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all duration-300">
            <Image
              src={poetImage || "/placeholder.svg?height=48&width=48"}
              alt={`${poetName} - Poet profile picture`}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=48&width=48";
              }}
            />
          </div>
          <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
            <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
            {poetName}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(poem.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {poem.category}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Content */}
      <div className="p-6">
        <Link href={`/poems/en/${poem.slug.en}`} className="block group/link">
          {/* Poetry Content - No Title, Only Couplet */}
          <div className="mb-6">
            <div className="relative p-5 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/30 group-hover/link:border-primary/30 transition-all duration-300">
              <div className="text-sm md:text-base leading-relaxed font-mono text-foreground/90 poetry-preview group-hover/link:text-primary/90 transition-colors duration-300 whitespace-pre-line">
                {formatCouplet(previewCouplet)}
              </div>

              {poem.content.en.length > 1 && (
                <div className="mt-3 pt-2 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">
                    +{poem.content.en.length - 1} more verses
                  </p>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* SEO Optimized Cover Image */}
        {poem.coverImage?.url && (
          <Link href={`/poems/en/${poem.slug.en}`} className="block mb-6">
            <div className="relative h-48 md:h-56 bg-muted/30 rounded-xl overflow-hidden group-hover:shadow-md transition-all duration-300">
              <Image
                src={poem.coverImage.url || "/placeholder.svg"}
                alt={`Illustration for poem by ${poetName} - ${poem.category} poetry`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </Link>
        )}

        {/* Enhanced Tags */}
        {poem.topics.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {poem.topics.slice(0, 3).map((topic: string) => (
              <span
                key={topic}
                className="px-3 py-1 text-xs rounded-full bg-accent/50 text-accent-foreground hover:bg-accent/70 transition-colors cursor-pointer border border-accent/30"
              >
                #{topic}
              </span>
            ))}
            {poem.topics.length > 3 && (
              <span className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                +{poem.topics.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Actions */}
      <div className="flex items-center border-t border-border/30 bg-muted/20 px-5 py-4">
        <div className="flex items-center justify-around w-full">
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-background/80 ${
              isBookmarked
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={handleBookmark}
            disabled={actionLoading === "bookmark"}
          >
            {actionLoading === "bookmark" ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-primary border-muted" />
            ) : (
              <Bookmark
                className={`h-4 w-4 transition-all duration-200 ${
                  isBookmarked ? "fill-current scale-110" : ""
                }`}
              />
            )}
            <span className="text-sm font-medium">
              {optimisticBookmarkCount.toLocaleString()}
            </span>
          </button>

          <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
            <Eye className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">
              {(poem.viewsCount || 0).toLocaleString()}
            </span>
          </div>

          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all duration-200"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .poetry-preview {
          line-height: 1.7;
          letter-spacing: 0.01em;
        }
      `}</style>
    </article>
  );
}
