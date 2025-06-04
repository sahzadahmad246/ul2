"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Eye, Share2, Sparkles } from "lucide-react";
import { useUserStore } from "@/store/user-store";
import { usePoemStore } from "@/store/poem-store";
import { toast } from "sonner";
import type { FeedItem } from "@/types/poemTypes";
import { formatRelativeTime } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import DownloadCouplet from "./DownloadCouplet";
interface PoemCardProps {
  feedItem: FeedItem;
}

export default function PoemCard({ feedItem }: PoemCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [optimisticBookmarkCount, setOptimisticBookmarkCount] = useState(
    feedItem.bookmarkCount || 0
  );
  const [topicsDialogOpen, setTopicsDialogOpen] = useState(false);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const { userData, fetchUserData } = useUserStore();
  const { bookmarkPoem } = usePoemStore();

  useEffect(() => {
    if (userData?._id) {
      setIsBookmarked(
        userData.bookmarks?.some(
          (b) => b.poemId.toString() === feedItem.poemId
        ) || false
      );
    } else {
      setIsBookmarked(false);
    }
    setOptimisticBookmarkCount(feedItem.bookmarkCount || 0);
  }, [userData, feedItem]);

  const poetName = feedItem.poet.name || "Unknown Poet";
  const poetImage =
    feedItem.poet.profilePicture?.url || "/placeholder.svg?height=48&width=48";
  const poetSlug = feedItem.poet.slug || "unknown";

  const formatCouplet = (couplet: string) => {
    return couplet.split("\n").map((line, index) => (
      <div key={index} className="leading-relaxed">
        {line}
      </div>
    ));
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
        feedItem.poemId,
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
    } catch (e: unknown) {
      console.error("Failed to bookmark poem:", e);
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
        title: `Poem by ${poetName}`,
        text: feedItem.couplet,
        url: `/poems/${feedItem.language}/${feedItem.slug}`,
      });
    } else {
      navigator.clipboard.writeText(
        `${window.location.origin}/poems/${feedItem.language}/${feedItem.slug}`
      );
      toast.success("Poem link copied to clipboard");
    }
  };

  const isUrdu = feedItem.language === "ur";
  const textDirection = isUrdu ? "rtl" : "ltr";
  const fontClass = isUrdu ? "font-noto-nastaliq" : "font-inter";

  return (
    <article className="group relative rounded-3xl border border-border/40 overflow-hidden bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm shadow-lg hover:shadow-2xl hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] max-w-full">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header */}
      <div className="relative flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6 border-b border-border/20">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative flex-shrink-0">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 shadow-lg">
              <Image
                src={poetImage || "/placeholder.svg"}
                alt={`${poetName} - Poet profile picture`}
                width={56}
                height={56}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=56&width=56";
                }}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
          <div className="flex-1 min-w-0 max-w-[calc(100%-70px)]">
            <Link href={`/poet/${poetSlug}`}>
              <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors duration-300">
                {poetName}
              </h3>
            </Link>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="text-muted-foreground/80 font-medium truncate">
                @{poetSlug}
              </span>
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground font-medium font-inter bg-muted/30 px-3 py-1 rounded-full">
          {feedItem.createdAt
            ? formatRelativeTime(feedItem.createdAt)
            : "Unknown"}
        </div>
      </div>

      {/* Couplet with stylish vertical line */}
      <div className="relative p-4 sm:p-6">
        <Link
          href={`/poems/${feedItem.language}/${feedItem.slug}`}
          className="block group/link"
        >
          <div className="relative mb-6">
            <div
              className={`relative ${
                isUrdu ? "pr-6" : "pl-6"
              } ${fontClass} overflow-hidden`}
              dir={textDirection}
              lang={isUrdu ? "ur" : "en"}
            >
              {/* Stylish vertical line - left for en/hi, right for ur */}
              <div
                className={`absolute ${
                  isUrdu ? "right-0" : "left-0"
                } top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/80 to-primary/40 rounded-full shadow-sm group-hover/link:shadow-primary/50 transition-all duration-300`}
              />
              <div
                className={`absolute ${
                  isUrdu ? "right-0" : "left-0"
                } top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-transparent rounded-full animate-pulse opacity-0 group-hover/link:opacity-100 transition-opacity duration-300`}
              />

              <div className="text-lg md:text-xl leading-loose text-foreground/90 poetry-preview group-hover/link:text-primary/90 transition-colors duration-300 space-y-2">
                {formatCouplet(feedItem.couplet)}
              </div>
            </div>
          </div>
        </Link>

        {/* Cover Image */}
        {feedItem.coverImage?.url && (
          <Link
            href={`/poems/${feedItem.language}/${feedItem.slug}`}
            className="block mb-6"
          >
            <div className="relative h-52 md:h-64 bg-muted/30 rounded-2xl overflow-hidden group-hover:shadow-xl transition-all duration-500 border border-border/20">
              <Image
                src={feedItem.coverImage.url || "/placeholder.svg"}
                alt={`Illustration for poem by ${poetName}`}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </Link>
        )}

        {/* Topics - Single line with dialog */}
        {feedItem.topics.length > 0 && (
          <div className="flex items-center gap-2 mb-4 overflow-hidden">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {feedItem.topics.slice(0, 2).map((topic: string) => (
                <Badge
                  key={topic}
                  variant="secondary"
                  className="text-xs bg-accent/40 hover:bg-accent/60 transition-colors border border-accent/30 whitespace-nowrap"
                >
                  #{topic}
                </Badge>
              ))}
              {feedItem.topics.length > 2 && (
                <Dialog
                  open={topicsDialogOpen}
                  onOpenChange={setTopicsDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-6 px-2 bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary font-medium whitespace-nowrap"
                    >
                      +{feedItem.topics.length - 2} more
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        All Topics
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {feedItem.topics.map((topic: string) => (
                        <Badge
                          key={topic}
                          variant="secondary"
                          className="text-sm bg-accent/50 hover:bg-accent/70 transition-colors border border-accent/30"
                        >
                          #{topic}
                        </Badge>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="relative flex items-center border-t border-border/20 bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1">
            <button
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl transition-all duration-300 hover:bg-background/60 hover:shadow-md ${
                isBookmarked
                  ? "text-primary bg-primary/15 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={handleBookmark}
              disabled={actionLoading === "bookmark"}
            >
              {actionLoading === "bookmark" ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-primary border-muted" />
              ) : (
                <Bookmark
                  className={`h-4 w-4 transition-all duration-300 ${
                    isBookmarked ? "fill-current scale-110" : ""
                  }`}
                />
              )}
              <span className="text-sm font-semibold font-inter">
                {optimisticBookmarkCount.toLocaleString()}
              </span>
            </button>

            <div className="flex items-center gap-2 px-4 py-2 text-muted-foreground">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-semibold font-inter">
                {(feedItem.viewsCount || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background/60 hover:shadow-md transition-all duration-300"
              onClick={() => setIsDownloadDialogOpen(true)}
            >
              <Download className="h-4 w-4" />
              <span className="text-sm font-semibold font-inter hidden sm:inline">
                Download
              </span>
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background/60 hover:shadow-md transition-all duration-300"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              <span className="text-sm font-semibold font-inter hidden sm:inline">
                Share
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Download Dialog */}
      <DownloadCouplet
        poemSlug={feedItem.slug}
        open={isDownloadDialogOpen}
        onOpenChange={setIsDownloadDialogOpen}
      />

      <style jsx>{`
        .poetry-preview {
          line-height: 2.4;
          letter-spacing: 0.02em;
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
        }
        .font-noto-nastaliq {
          font-family: var(--font-noto-nastaliq), "Noto Nastaliq Urdu",
            sans-serif;
          font-size: 1.25rem;
        }
        .font-inter {
          font-family: var(--font-inter), "Inter", sans-serif;
        }
      `}</style>
    </article>
  );
}
