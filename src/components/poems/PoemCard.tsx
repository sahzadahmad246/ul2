// src/app/components/PoemCard.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { IPoem } from "@/types/poemTypes";
import { Heart, Bookmark, Eye, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { usePoetStore } from "@/store/poetStore";
import { useUserStore } from "@/store/user-store";
import { usePoemStore } from "@/store/poemStore";
import { Types } from "mongoose";
import { toast } from "sonner";

interface PoemCardProps {
  poem: IPoem;
}

// Type guard to check if poet is an object with name and profilePicture
function isPoetObject(
  poet:
    | Types.ObjectId
    | {
        _id: Types.ObjectId;
        name: string;
        role: string;
        profilePicture?: { publicId?: string; url?: string };
      }
): poet is {
  _id: Types.ObjectId;
  name: string;
  role: string;
  profilePicture?: { publicId?: string; url?: string };
} {
  return typeof poet === "object" && "name" in poet;
}

export default function PoemCard({ poem }: PoemCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(poem.likes?.length || 0);
  const [optimisticBookmarkCount, setOptimisticBookmarkCount] = useState(poem.bookmarkCount || 0);
  const { poet, fetchPoet } = usePoetStore();
  const { userData, fetchUserData } = useUserStore();
  const { singlePoem, fetchPoemBySlug } = usePoemStore();

  // Initialize like, bookmark states, and counts based on user data and poem
  useEffect(() => {
    if (userData?._id && poem) {
      const userId = userData._id.toString();
      setIsLiked(
        userData.likedPoems?.some((p) => p.poemId.toString() === poem._id.toString()) ||
          poem.likes?.some((like) => like.userId.toString() === userId) ||
          false
      );
      setIsBookmarked(
        userData.bookmarks?.some((b) => b.poemId.toString() === poem._id.toString()) ||
          poem.bookmarks?.some((bookmark) => bookmark.userId.toString() === userId) ||
          false
      );
    } else {
      setIsLiked(false);
      setIsBookmarked(false);
    }

    // Sync counts with singlePoem if available and matches the poem
    if (singlePoem?._id.toString() === poem._id.toString()) {
      setOptimisticLikeCount(singlePoem.likes?.length || 0);
      setOptimisticBookmarkCount(singlePoem.bookmarkCount || 0);
    } else {
      setOptimisticLikeCount(poem.likes?.length || 0);
      setOptimisticBookmarkCount(poem.bookmarkCount || 0);
    }
  }, [userData, poem, singlePoem]);

  // Fetch poet data when component mounts
  useEffect(() => {
    if (typeof poem.poet === "string") {
      fetchPoet(poem.poet);
    } else if (isPoetObject(poem.poet)) {
      fetchPoet(poem.poet._id.toString());
    }
  }, [poem.poet, fetchPoet]);

  // Poet information with fallback
  const poetName =
    poet?.name || (isPoetObject(poem.poet) ? poem.poet.name : "Unknown Poet");
  const poetImage = (poet?.profilePicture?.url ||
    (isPoetObject(poem.poet) ? poem.poet.profilePicture?.url : null) ||
    "/placeholder.svg?height=40&width=40") as string;

  // Get first couplet from English content for preview
  const previewCouplet = poem.content.en[0]?.couplet || "";
  const formatCouplet = (couplet: string) => {
    return couplet.replace(/\n/g, "\n");
  };

  const handleLike = async () => {
    if (!userData?._id) {
      alert("Please log in to like poems.");
      return;
    }
    setActionLoading("like");
    const previousLikeCount = optimisticLikeCount;
    const previousIsLiked = isLiked;
    setOptimisticLikeCount(isLiked ? optimisticLikeCount - 1 : optimisticLikeCount + 1);
    setIsLiked(!isLiked); // Optimistic update
    try {
      const formData = new FormData();
      formData.append(isLiked ? "removeLike" : "addLike", userData._id.toString());
      console.log("[PoemCard] Sending PUT request for like with slug:", poem.slug.en, "userId:", userData._id.toString());

      const res = await fetch(`/api/poems/${poem.slug.en}`, {
        method: "PUT",
        body: formData,
      });
      const result = await res.json();

      if (res.ok) {
        await Promise.all([
          fetchUserData(true), // Refresh user data
          fetchPoemBySlug(poem.slug.en, true), // Refresh poem data
        ]);
      } else {
        throw new Error(result.message || "Failed to update like");
      }
    } catch (error) {
      console.error("[PoemCard] Failed to like poem:", error);
      alert("Failed to like poem.");
      setIsLiked(previousIsLiked); // Revert state
      setOptimisticLikeCount(previousLikeCount); // Revert count
    } finally {
      setActionLoading(null);
    }
  };

  const handleBookmark = async () => {
    if (!userData?._id) {
      alert("Please log in to bookmark poems.");
      return;
    }
    setActionLoading("bookmark");
    const previousBookmarkCount = optimisticBookmarkCount;
    const previousIsBookmarked = isBookmarked;
    setOptimisticBookmarkCount(isBookmarked ? optimisticBookmarkCount - 1 : optimisticBookmarkCount + 1);
    setIsBookmarked(!isBookmarked); // Optimistic update
    try {
      const formData = new FormData();
      formData.append(isBookmarked ? "removeBookmark" : "addBookmark", userData._id.toString());
      console.log("[PoemCard] Sending PUT request for bookmark with slug:", poem.slug.en, "userId:", userData._id.toString());

      const res = await fetch(`/api/poems/${poem.slug.en}`, {
        method: "PUT",
        body: formData,
      });
      const result = await res.json();

      if (res.ok) {
        await Promise.all([
          fetchUserData(true), // Refresh user data
          fetchPoemBySlug(poem.slug.en, true), // Refresh poem data
        ]);
        toast.success(isBookmarked ? "Poem removed from bookmarks" : "Poem bookmarked", {
          duration: 3000,
        });
      } else {
        throw new Error(result.message || "Failed to update bookmark");
      }
    } catch (error) {
      console.error("[PoemCard] Failed to bookmark poem:", error);
      toast.error("Failed to bookmark poem", { duration: 3000 });
      setIsBookmarked(previousIsBookmarked); // Revert state
      setOptimisticBookmarkCount(previousBookmarkCount); // Revert count
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
    }
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card shadow-sm">
      {/* Post Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted overflow-hidden">
          <Image
            src={poetImage}
            alt={poetName}
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-medium text-sm">{poetName}</h3>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(poem.createdAt, { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-5">
        <Link href={`/poems/en/${poem.slug.en}`} className="block group">
          <p className="text-sm mb-4 whitespace-pre-line line-clamp-4 text-foreground group-hover:text-primary transition-colors">
            {formatCouplet(previewCouplet)}
          </p>
          {poem.content.en.length > 1 && (
            <p className="text-xs text-muted-foreground">
              +{poem.content.en.length - 1} more couplets
            </p>
          )}
        </Link>

        {/* Cover Image */}
        {poem.coverImage && (
          <div className="h-48 bg-muted rounded-md mb-4 flex items-center justify-center overflow-hidden">
            <Image
              src={poem.coverImage}
              alt={poem.title.en}
              width={500}
              height={192}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Post Tags */}
        {poem.topics.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {poem.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="px-2 py-1 text-xs rounded-md bg-accent/50 text-accent-foreground"
              >
                #{topic}
              </span>
            ))}
            {poem.topics.length > 3 && (
              <span className="px-2 py-1 text-xs rounded-md bg-accent/50 text-accent-foreground">
                +{poem.topics.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center border-t border-border p-3 w-full justify-around gap-8 text-sm text-muted-foreground">
        <button
          className={`flex items-center gap-2 hover:text-red-500 transition-colors ${
            isLiked ? "text-red-500" : ""
          }`}
          onClick={handleLike}
          disabled={actionLoading === "like"}
        >
          {actionLoading === "like" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-primary border-muted"></div>
          ) : (
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          )}
          <span>{optimisticLikeCount}</span>
        </button>
        <button
          className={`flex items-center gap-2 hover:text-primary transition-colors ${
            isBookmarked ? "text-primary" : ""
          }`}
          onClick={handleBookmark}
          disabled={actionLoading === "bookmark"}
        >
          {actionLoading === "bookmark" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-primary border-muted"></div>
          ) : (
            <Bookmark
              className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`}
            />
          )}
          <span>{optimisticBookmarkCount}</span>
        </button>
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span>{poem.viewsCount || 0}</span>
        </div>
        <button
          className="flex items-center gap-2 hover:text-primary transition-colors"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}