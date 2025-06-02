import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PoetProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Profile Header Skeleton */}
      <Card className="border-border/50 bg-card overflow-hidden">
        <div className="h-24 sm:h-32 bg-gradient-to-r from-muted via-muted to-muted" />
        <CardContent className="p-4 sm:p-6 -mt-12 sm:-mt-16 relative">
          <div className="flex items-start gap-4">
            <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full relative z-10" />

            <div className="flex-1 pt-8 sm:pt-10 space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-6 sm:h-8 w-32 sm:w-48" />
                <Skeleton className="h-4 w-24 sm:w-32" />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-6 sm:gap-8">
                  <div className="text-center space-y-1">
                    <Skeleton className="h-5 sm:h-6 w-8" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <div className="text-center space-y-1">
                    <Skeleton className="h-5 sm:h-6 w-8" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Skeleton */}
      <div className="space-y-4 pt-4">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 sm:h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-12 sm:h-16 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 sm:h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-muted/30 rounded-xl p-4 text-center">
                  <Skeleton className="h-6 w-24 mx-auto mb-2" />
                  <Skeleton className="h-8 w-12 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function PoetWorksSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 sm:h-6 w-48 sm:w-64" />
              <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
            </div>
            <Skeleton className="h-8 sm:h-10 w-full sm:w-40" />
          </div>
        </CardHeader>
      </Card>

      {/* Works List Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 sm:h-6 w-3/4" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>

                <Skeleton className="h-16 sm:h-20 w-full rounded-lg" />

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Skeleton className="h-4 w-24" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8" />
                ))}
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
