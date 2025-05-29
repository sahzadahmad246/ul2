import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function PoetProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Picture */}
            <Skeleton className="h-32 w-32 rounded-full mx-auto md:mx-0" />

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div className="text-center md:text-left space-y-2">
                <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
                <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Section */}
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-border/50 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
