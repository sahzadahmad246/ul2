import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function PoetCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center p-4 relative">
          {/* Profile Picture Skeleton */}
          <Skeleton className="h-16 w-16 rounded-full mr-4" />

          {/* Name and Username Skeleton */}
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Badge Skeleton */}
          <Skeleton className="h-6 w-16 absolute top-4 right-4" />
        </div>

        {/* Button Skeleton */}
        <Skeleton className="h-12 w-full rounded-none" />
      </CardContent>
    </Card>
  )
}
