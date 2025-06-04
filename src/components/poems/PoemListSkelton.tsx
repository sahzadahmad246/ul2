"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface PoemListSkeletonProps {
  count?: number
}

export function PoemListSkeleton({ count = 6 }: PoemListSkeletonProps) {
  return (
    <div className="space-y-6 md:space-y-4 max-w-full">
      <div className="grid gap-6 md:gap-8 lg:gap-10 max-w-full">
        {Array.from({ length: count }).map((_, index) => (
          <PoemCardSkeleton key={index} index={index} />
        ))}
      </div>
    </div>
  )
}

function PoemCardSkeleton({ index }: { index: number }) {
  return (
    <Card 
      className="group relative rounded-3xl border border-border/40 overflow-hidden bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm shadow-lg max-w-full animate-in fade-in-50 slide-in-from-bottom-6"
      style={{
        animationDelay: `${(index % 10) * 150}ms`,
        animationFillMode: "both",
      }}
    >
      {/* Header Skeleton */}
      <div className="relative flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6 border-b border-border/20">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative flex-shrink-0">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-gradient-to-br from-primary/30 to-primary/20 rounded-full flex items-center justify-center">
              <Skeleton className="h-3 w-3 rounded-full" />
            </div>
          </div>
          <div className="flex-1 min-w-0 max-w-[calc(100%-70px)]">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Couplet Content Skeleton */}
      <div className="relative p-4 sm:p-6">
        <div className="relative mb-6">
          <div className="relative pl-6 overflow-hidden">
            {/* Stylish vertical line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/30 via-primary/20 to-primary/10 rounded-full" />
            
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-6 w-5/6" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          </div>
        </div>

        {/* Cover Image Skeleton (randomly show/hide to match real behavior) */}
        {Math.random() > 0.4 && (
          <div className="mb-6">
            <Skeleton className="h-52 md:h-64 w-full rounded-2xl" />
          </div>
        )}

        {/* Topics Skeleton */}
        <div className="flex items-center gap-2 mb-4 overflow-hidden">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            {Math.random() > 0.5 && (
              <Skeleton className="h-6 w-14 rounded-full" />
            )}
          </div>
        </div>
      </div>

      {/* Action Bar Skeleton */}
      <div className="relative flex items-center border-t border-border/20 bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1">
            {/* Bookmark button skeleton */}
            <div className="flex items-center gap-2 px-2 sm:px-4 py-2 rounded-xl">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-8" />
            </div>

            {/* Views skeleton */}
            <div className="flex items-center gap-2 px-4 py-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>

          {/* Share button skeleton */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-12 hidden sm:block" />
          </div>
        </div>
      </div>
    </Card>
  )
}

export default PoemListSkeleton
