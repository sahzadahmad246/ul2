"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Cover Photo Skeleton */}
      <div className="relative h-48 bg-gradient-to-r from-muted to-muted/50">
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* Profile Content Skeleton */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <div className="relative -mt-16 mb-6">
          <div className="flex justify-between items-end mb-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-5 w-32" />
            </div>

            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-3/4" />

            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>

            <div className="flex gap-6 pt-2">
              <div className="text-center">
                <Skeleton className="h-7 w-8 mx-auto mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="text-center">
                <Skeleton className="h-7 w-8 mx-auto mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>

        <Skeleton className="h-px w-full my-6" />

        {/* Bookmarks Section Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </div>

          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
