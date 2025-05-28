import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold mb-2">Poem Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The poem you are looking for does not exist or may have been removed.
          </p>
          <Button asChild>
            <Link href="/poems">Browse All Poems</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
