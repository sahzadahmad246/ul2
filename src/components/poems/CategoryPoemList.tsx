"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useCategoryFeedStore } from "@/store/category-poem-store"; 
import PoemCard from "./PoemCard";
import PoemListSkeleton from "./PoemListSkelton";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle, BookOpen, Sparkles, Heart } from "lucide-react";
import type { FeedItem, Pagination } from "@/types/poemTypes";

interface CategoryPoemListProps {
  initialFeedItems: FeedItem[];
  initialPagination: Pagination;
  category: string;
}

export default function CategoryPoemList({ initialFeedItems, initialPagination, category }: CategoryPoemListProps) {
  const { feedItems, setFeedItems, loading, fetchCategoryFeed, pagination, setPagination } = useCategoryFeedStore();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      setFeedItems(initialFeedItems);
      setPagination(initialPagination);
      setIsInitialized(true);
    }
  }, [initialFeedItems, initialPagination, setFeedItems, setPagination, isInitialized]);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && pagination && pagination.page < pagination.pages && !loading && !error) {
        fetchCategoryFeed(category, pagination.page + 1).catch((err) => {
          setError("Failed to load more poems. Please try again.");
          console.error("Error fetching more poems:", err);
        });
      }
    },
    [pagination, loading, fetchCategoryFeed, error, category],
  );

  useEffect(() => {
    const currentLoadMoreRef = loadMoreRef.current;

    if (!pagination || loading || error) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: "100px",
    });

    if (currentLoadMoreRef && observerRef.current) {
      observerRef.current.observe(currentLoadMoreRef);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [pagination, loading, error, handleIntersection]);

  const handleRetry = () => {
    setError(null);
    if (pagination) {
      fetchCategoryFeed(category, pagination.page + 1);
    } else {
      fetchCategoryFeed(category, 1);
    }
  };

  if (loading && feedItems.length === 0 && !error && isInitialized) {
    return <PoemListSkeleton count={6} />;
  }

  if (error) {
    return (
      <div className="text-center py-12 sm:py-20 px-4">
        <div className="max-w-md mx-auto space-y-6 sm:space-y-8">
          <div className="relative">
            <div className="h-16 sm:h-20 w-16 sm:w-20 mx-auto bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 sm:h-10 w-8 sm:w-10 text-destructive" />
            </div>
            <div className="absolute inset-0 h-16 sm:h-20 w-16 sm:w-20 mx-auto animate-ping opacity-20">
              <div className="h-full w-full bg-destructive rounded-full" />
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">Oops! Something went wrong</h3>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">{error}</p>
          </div>
          <Button onClick={handleRetry} size="lg" className="gap-2 shadow-lg">
            <RefreshCw className="h-4 sm:h-5 w-4 sm:w-5" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (feedItems.length === 0 && !loading && isInitialized) {
    return (
      <div className="text-center py-16 sm:py-24 px-4">
        <div className="max-w-lg mx-auto space-y-6 sm:space-y-8">
          <div className="relative">
            <div className="h-20 sm:h-24 w-20 sm:w-24 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center shadow-lg">
              <BookOpen className="h-10 sm:h-12 w-10 sm:w-12 text-primary" />
            </div>
            <Sparkles className="absolute top-2 right-1/3 h-5 sm:h-6 w-5 sm:w-6 text-primary/60 animate-pulse" />
            <Heart className="absolute bottom-2 left-1/3 h-4 sm:h-5 w-4 sm:w-5 text-accent/60 animate-pulse delay-300" />
          </div>
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
              No {category.charAt(0).toUpperCase() + category.slice(1)} poems yet
            </h3>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              Be the first to share your {category} poetry with the world.
            </p>
          </div>
          <div className="pt-4">
            <Button asChild size="lg" className="gap-2 shadow-lg">
              <a href="/create">
                <Sparkles className="h-4 sm:h-5 w-4 sm:w-5" />
                Create Your First Poem
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-4 max-w-full">
      <div className="grid gap-6 md:gap-8 lg:gap-10 max-w-full">
        {feedItems.map((item, index) => (
          <div
            key={item.id}
            className="animate-in fade-in-50 slide-in-from-bottom-6 w-full overflow-hidden"
            style={{
              animationDelay: `${(index % 10) * 150}ms`,
              animationFillMode: "both",
            }}
          >
            <PoemCard feedItem={item} />
          </div>
        ))}
      </div>

      {loading && feedItems.length > 0 && (
        <div className="space-y-6 md:space-y-4">
          <PoemListSkeleton count={3} />
        </div>
      )}

      {loading && feedItems.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8 sm:py-16 space-y-4 sm:space-y-6">
          <div className="relative">
            <div className="h-10 sm:h-12 w-10 sm:w-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="h-5 sm:h-6 w-5 sm:w-6 animate-spin text-primary" />
            </div>
            <div className="absolute inset-0 h-10 sm:h-12 w-10 sm:w-12 animate-ping opacity-20">
              <div className="h-full w-full bg-primary rounded-full" />
            </div>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground animate-pulse font-medium">
            Loading more {category} poetry...
          </p>
        </div>
      )}

      {pagination && pagination.page < pagination.pages && <div ref={loadMoreRef} className="h-8 w-full" />}

      {pagination && pagination.page >= pagination.pages && feedItems.length > 0 && (
        <div className="text-center py-8 sm:py-16 space-y-4 sm:space-y-6 px-4">
          <div className="relative inline-block">
            <div className="h-12 sm:h-16 w-12 sm:w-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center shadow-lg">
              <BookOpen className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 h-5 sm:h-6 w-5 sm:w-6 text-primary/60" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            <p className="text-xl sm:text-2xl font-bold text-foreground">You have reached the end!</p>
            <p className="text-muted-foreground text-base sm:text-lg">
              You have explored all {feedItems.length} beautiful {category} poems.
            </p>
          </div>
          <div className="pt-4">
            <Button variant="outline" asChild size="lg" className="gap-2 shadow-md">
              <a href="#top">
                <RefreshCw className="h-4 sm:h-5 w-4 sm:w-5" />
                Back to Top
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}