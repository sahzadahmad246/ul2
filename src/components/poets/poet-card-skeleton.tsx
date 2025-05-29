import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function PoetCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Profile Picture Skeleton */}
          <Skeleton className="h-20 w-20 rounded-full" />

          {/* Name Skeleton */}
          <div className="space-y-2 w-full">
            <Skeleton className="h-6 w-32 mx-auto" />

            {/* Bio Skeleton */}
            <div className="space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
            </div>

            {/* Location Skeleton */}
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>

          {/* Badge Skeleton */}
          <Skeleton className="h-6 w-20" />

          {/* Button Skeleton */}
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}
