"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useFeedStore } from "@/store/feed-store"
import EnhancedPoemCard from "./PoemCard"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, AlertCircle, BookOpen, Sparkles, Heart } from "lucide-react"
import type { FeedItem, Pagination } from "@/types/poemTypes"

interface EnhancedPoemListProps {
  initialFeedItems: FeedItem[]
  initialPagination: Pagination
}

export default function EnhancedPoemList({ initialFeedItems, initialPagination }: EnhancedPoemListProps) {
  const { feedItems, setFeedItems, loading, fetchFeed, pagination, setPagination } = useFeedStore()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!isInitialized) {
      setFeedItems(initialFeedItems)
      setPagination(initialPagination)
      setIsInitialized(true)
    }
  }, [initialFeedItems, initialPagination, setFeedItems, setPagination, isInitialized])

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && pagination && pagination.page < pagination.pages && !loading && !error) {
        fetchFeed(pagination.page + 1).catch((err) => {
          setError("Failed to load more poems. Please try again.")
          console.error("Error fetching more poems:", err)
        })
      }
    },
    [pagination, loading, fetchFeed, error],
  )

  useEffect(() => {
    const currentLoadMoreRef = loadMoreRef.current

    if (!pagination || loading || error) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: "100px",
    })

    if (currentLoadMoreRef && observerRef.current) {
      observerRef.current.observe(currentLoadMoreRef)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [pagination, loading, error, handleIntersection])

  const handleRetry = () => {
    setError(null)
    if (pagination) {
      fetchFeed(pagination.page + 1)
    } else {
      fetchFeed(1)
    }
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto space-y-8">
          <div className="relative">
            <div className="h-20 w-20 mx-auto bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <div className="absolute inset-0 h-20 w-20 mx-auto animate-ping opacity-20">
              <div className="h-full w-full bg-destructive rounded-full" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground">Oops! Something went wrong</h3>
            <p className="text-muted-foreground text-lg leading-relaxed">{error}</p>
          </div>
          <Button onClick={handleRetry} size="lg" className="gap-2 shadow-lg">
            <RefreshCw className="h-5 w-5" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (feedItems.length === 0 && !loading && isInitialized) {
    return (
      <div className="text-center py-24">
        <div className="max-w-lg mx-auto space-y-8">
          <div className="relative">
            <div className="h-24 w-24 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center shadow-lg">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <Sparkles className="absolute top-2 right-1/3 h-6 w-6 text-primary/60 animate-pulse" />
            <Heart className="absolute bottom-2 left-1/3 h-5 w-5 text-accent/60 animate-pulse delay-300" />
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl font-bold text-foreground">No poems yet</h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Be the first to share your poetry with the world and inspire others with your beautiful words.
            </p>
          </div>
          <div className="pt-4">
            <Button asChild size="lg" className="gap-2 shadow-lg">
              <a href="/create">
                <Sparkles className="h-5 w-5" />
                Create Your First Poem
              </a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:gap-10">
        {feedItems.map((item, index) => (
          <div
            key={item.id}
            className="animate-in fade-in-50 slide-in-from-bottom-6"
            style={{
              animationDelay: `${(index % 10) * 150}ms`,
              animationFillMode: "both",
            }}
          >
            <EnhancedPoemCard feedItem={item} />
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="relative">
            <div className="h-12 w-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <div className="absolute inset-0 h-12 w-12 animate-ping opacity-20">
              <div className="h-full w-full bg-primary rounded-full" />
            </div>
          </div>
          <p className="text-lg text-muted-foreground animate-pulse font-medium">Loading more beautiful poetry...</p>
        </div>
      )}

      {pagination && pagination.page < pagination.pages && <div ref={loadMoreRef} className="h-8 w-full" />}

      {pagination && pagination.page >= pagination.pages && feedItems.length > 0 && (
        <div className="text-center py-16 space-y-6">
          <div className="relative inline-block">
            <div className="h-16 w-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center shadow-lg">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-primary/60" />
          </div>
          <div className="space-y-3">
            <p className="text-2xl font-bold text-foreground">You have reached the end!</p>
            <p className="text-muted-foreground text-lg">
              You have explored all {feedItems.length} beautiful poems in our feed.
            </p>
          </div>
          <div className="pt-4">
            <Button variant="outline" asChild size="lg" className="gap-2 shadow-md">
              <a href="#top">
                <RefreshCw className="h-5 w-5" />
                Back to Top
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
