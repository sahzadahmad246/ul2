"use client"

import { useEffect, useRef, useState } from "react"
import { usePoemStore } from "@/store/poemStore"
import PoemCard from "./PoemCard"
import Loader from "./Loader"
import { Button } from "@/components/ui/button"

export default function PoemList() {
  const { poems, loading, page, totalPages, fetchPoems } = usePoemStore()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPoems(1).catch((err) => {
      setError("Failed to load poems. Please try again.")
      console.error("Error fetching poems:", err)
    })
  }, [fetchPoems])

  useEffect(() => {
    const currentLoadMoreRef = loadMoreRef.current // Store ref value
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && page < totalPages && !loading) {
          fetchPoems(page + 1)
        }
      },
      { threshold: 1.0 }
    )

    if (currentLoadMoreRef) {
      observerRef.current.observe(currentLoadMoreRef)
    }

    return () => {
      if (observerRef.current && currentLoadMoreRef) {
        observerRef.current.unobserve(currentLoadMoreRef) // Use stored ref value
      }
    }
  }, [page, totalPages, loading, fetchPoems])

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button
          onClick={() => {
            setError(null)
            fetchPoems(1, true)
          }}
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (poems.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium mb-2">No poems yet</h3>
        <p className="text-muted-foreground">Be the first to share your poetry with the world.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {poems.map((poem) => (
        <PoemCard key={poem._id.toString()} poem={poem} />
      ))}

      {loading && <Loader />}
      {page < totalPages && <div ref={loadMoreRef} className="h-4" />}

      {page >= totalPages && poems.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>You&apos;ve reached the end of the poetry collection</p>
        </div>
      )}
    </div>
  )
}