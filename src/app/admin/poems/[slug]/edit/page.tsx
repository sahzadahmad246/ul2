"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import PoemForm from "@/components/poems/PoemForm"
import { usePoemStore } from "@/store/poemStore"
import { Card, CardContent } from "@/components/ui/card"

export default function EditPoemPage() {
  const params = useParams()
  const slug = params.slug as string
  const { singlePoem, fetchPoemBySlug, loading } = usePoemStore()

  useEffect(() => {
    if (slug) {
      fetchPoemBySlug(slug, true)
    }
  }, [slug, fetchPoemBySlug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!singlePoem) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Poem Not Found</h2>
          <p className="text-muted-foreground">The poem you are trying to edit could not be found.</p>
        </CardContent>
      </Card>
    )
  }

  return <PoemForm initialData={singlePoem} slug={slug} />
}
