"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, Share2, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/date";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SerializedPoem } from "@/types/poemTypes";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = {
  "all-works": "All Works",
  ghazal: "Ghazals",
  sher: "Shers",
  nazm: "Nazms",
  "top-20": "Top 20 Poems",
  "top-20-ghazal": "Top 20 Ghazals",
  "top-20-sher": "Top 20 Shers",
};

interface PoetWorksContentProps {
  poet: {
    _id: string;
    name: string;
    profilePicture?: {
      url: string;
      publicId?: string;
    };
    slug?: string;
  };
  worksData: {
    poems: SerializedPoem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    category: string;
    sortBy: string;
  };
  category: string;
  currentPage: number;
  sortBy: string;
}

const getFirstCouplet = (poem: SerializedPoem) => {
  const englishContent = poem.content.en?.[0]?.couplet;
  if (!englishContent) return "No content available";

  // Format couplet with proper line breaks
  return englishContent
    .split("\n")
    .filter((line) => line.trim())
    .slice(0, 2)
    .join("\n");
};

const getPoemTitle = (poem: SerializedPoem) => {
  return poem.title.en || poem.title.hi || poem.title.ur || "Untitled Poem";
};

export default function PoetWorksContent({
  poet,
  worksData,
  category,
  currentPage,
  sortBy,
}: PoetWorksContentProps) {
  const router = useRouter();
  const [selectedSort, setSelectedSort] = useState(sortBy);
  const [bookmarkedPoems, setBookmarkedPoems] = useState<Set<string>>(
    new Set()
  );

  const handleSortChange = (newSort: string) => {
    setSelectedSort(newSort);
    const url = new URL(window.location.href);
    url.searchParams.set("sortBy", newSort);
    url.searchParams.set("page", "1");
    router.push(url.pathname + url.search);
  };

  const handlePageChange = (page: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", page.toString());
    router.push(url.pathname + url.search);
  };

  const handleBookmark = async (poemId: string) => {
    const isCurrentlyBookmarked = bookmarkedPoems.has(poemId);

    // Optimistic update
    const newBookmarkedPoems = new Set(bookmarkedPoems);
    if (isCurrentlyBookmarked) {
      newBookmarkedPoems.delete(poemId);
    } else {
      newBookmarkedPoems.add(poemId);
    }
    setBookmarkedPoems(newBookmarkedPoems);

    try {
      // Add your bookmark API call here
      toast.success(
        isCurrentlyBookmarked ? "Removed from bookmarks" : "Added to bookmarks"
      );
    } catch {
      // Revert on error
      setBookmarkedPoems(bookmarkedPoems);
      toast.error("Failed to update bookmark");
    }
  };

  const handleShare = (poem: SerializedPoem) => {
    const url = `/poems/en/${poem.slug.en || poem._id}`;
    if (navigator.share) {
      navigator.share({
        title: getPoemTitle(poem),
        text: getFirstCouplet(poem),
        url: window.location.origin + url,
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + url);
      toast.success("Poem link copied to clipboard");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">
                {categoryLabels[category]} by {poet.name}
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {worksData.pagination.total} poems found
              </p>
            </div>

            <Select value={selectedSort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="top">Most Popular</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Custom Poem Cards */}
      {worksData.poems.length > 0 ? (
        <div className="space-y-4">
          {worksData.poems.map((poem) => (
            <Card
              key={poem._id}
              className="hover:shadow-md transition-all duration-200"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/poems/en/${poem.slug.en || poem._id}`}
                        className="block"
                      >
                        <h3 className="font-semibold text-base sm:text-lg line-clamp-2 hover:text-primary transition-colors">
                          {getPoemTitle(poem)}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {poem.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(new Date(poem.createdAt))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* First Couplet with Vertical Line */}
                  <Link
                    href={`/poems/en/${poem.slug.en || poem._id}`}
                    className="block"
                  >
                    <div className="relative pl-4 py-2">
                      {/* Vertical gradient line */}
                      <div
                        className=" mr-8 absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-foreground via-foreground/60 to-foreground/20 dark:from-white dark:via-white/60 dark:to-white/20 rounded-full"
                      />

                      <div className="text-sm sm:text-base leading-relaxed font-serif whitespace-pre-line text-foreground/90 hover:text-foreground transition-colors">
                        {getFirstCouplet(poem)}
                      </div>
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{poem.viewsCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bookmark className="h-4 w-4" />
                        <span>{poem.bookmarkCount || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBookmark(poem._id)}
                        className={
                          bookmarkedPoems.has(poem._id) ? "text-primary" : ""
                        }
                      >
                        <Bookmark
                          className={`h-4 w-4 ${
                            bookmarkedPoems.has(poem._id) ? "fill-current" : ""
                          }`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(poem)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-muted-foreground">
              No poems found in this category.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {worksData.pagination.pages > 1 && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Page {currentPage} of {worksData.pagination.pages}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!worksData.pagination.hasPrev}
                  className="text-xs sm:text-sm"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, worksData.pagination.pages) },
                    (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-8 h-8 p-0 text-xs"
                        >
                          {page}
                        </Button>
                      );
                    }
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!worksData.pagination.hasNext}
                  className="text-xs sm:text-sm"
                >
                  Next
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
