import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, FileX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">
            <FileX className="h-16 w-16 mx-auto text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Poem Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The poem you are looking for does not exist or may have been removed.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/poems">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Poems
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
