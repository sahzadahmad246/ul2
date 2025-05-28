// src/components/poems/PoemList.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePoemStore } from "@/store/poem-store";
import PoemCard from "./PoemCard";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle, BookOpen, Sparkles } from "lucide-react";
import type { SerializedPoem } from "@/types/poemTypes";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface PoemListProps {
  initialPoems: SerializedPoem[];
  initialPagination: Pagination;
}

export default function PoemList({ initialPoems, initialPagination }: PoemListProps) {
  const { poems, setPoems, loading, fetchPoems, pagination, setPagination } = usePoemStore();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize poems and pagination
  useEffect(() => {
    if (!isInitialized) {
      setPoems(initialPoems);
      setPagination(initialPagination);
      setIsInitialized(true);
    }
  }, [initialPoems, initialPagination, setPoems, setPagination, isInitialized]);

  // Enhanced infinite scroll with better performance
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && pagination && pagination.page < pagination.pages && !loading && !error) {
        fetchPoems(pagination.page + 1).catch((err) => {
          setError("Failed to load more poems. Please try again.");
          console.error("Error fetching more poems:", err);
        });
      }
    },
    [pagination, loading, fetchPoems, error],
  );

  useEffect(() => {
    const currentLoadMoreRef = loadMoreRef.current;

    if (!pagination || loading || error) return;

    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer with optimized options
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: "100px", // Start loading 100px before the element comes into view
    });

    if (currentLoadMoreRef) {
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
      fetchPoems(pagination.page + 1);
    } else {
      fetchPoems(1);
    }
  };

  // Enhanced error state
  if (error) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto space-y-6">
          <div className="relative">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <div className="absolute inset-0 h-16 w-16 mx-auto animate-ping">
              <AlertCircle className="h-16 w-16 text-destructive/20" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Oops! Something went wrong</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={handleRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Enhanced empty state
  if (poems.length === 0 && !loading && isInitialized) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto space-y-6">
          <div className="relative">
            <BookOpen className="h-20 w-20 text-muted-foreground/50 mx-auto mb-6" />
            <Sparkles className="absolute top-2 right-1/3 h-6 w-6 text-primary/60 animate-pulse" />
            <Sparkles className="absolute bottom-2 left-1/3 h-4 w-4 text-primary/40 animate-pulse delay-300" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-semibold">No poems yet</h3>
            <p className="text-muted-foreground leading-relaxed">
              Be the first to share your poetry with the world and inspire others with your words.
            </p>
          </div>
          <div className="pt-4">
            <Button asChild className="gap-2">
              <a href="/create">
                <Sparkles className="h-4 w-4" />
                Create Your First Poem
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced poem grid with responsive layout */}
      <div className="grid gap-6 md:gap-8">
        {poems.map((poem, index) => (
          <div
            key={poem._id}
            className="animate-in fade-in-50 slide-in-from-bottom-4"
            style={{
              animationDelay: `${(index % 10) * 100}ms`,
              animationFillMode: "both",
            }}
          >
            <PoemCard poem={poem} />
          </div>
        ))}
      </div>

      {/* Enhanced loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="absolute inset-0 h-8 w-8 animate-ping">
              <Loader2 className="h-8 w-8 text-primary/20" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading more beautiful poetry...</p>
        </div>
      )}

      {/* Intersection observer target */}
      {pagination && pagination.page < pagination.pages && <div ref={loadMoreRef} className="h-8 w-full" />}

      {/* Enhanced end state */}
      {pagination && pagination.page >= pagination.pages && poems.length > 0 && (
        <div className="text-center py-12 space-y-4">
          <div className="relative inline-block">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto" />
            <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-primary/60" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">You have reached the end!</p>
            <p className="text-muted-foreground">You have explored all {poems.length} poems in our collection.</p>
          </div>
          <div className="pt-2">
            <Button variant="outline" asChild className="gap-2">
              <a href="#top">
                <RefreshCw className="h-4 w-4" />
                Back to Top
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}