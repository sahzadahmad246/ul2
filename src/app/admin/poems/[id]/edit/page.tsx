"use client"

import { useEffect } from "react"
import { usePoemStore } from "@/store/poem-store"
import PoemForm from "@/components/admin/poem-form"
import { Card, CardContent } from "@/components/ui/card"

// Adjust the interface to account for params being a Promise
interface EditPoemPageProps {
  params: Promise<{ id: string }>
}

export default function EditPoemPage({ params }: EditPoemPageProps) {
  const { poem, fetchPoemByIdOrSlug, loading } = usePoemStore()

  // Handle the Promise for params
  useEffect(() => {
    params.then(({ id }) => {
      fetchPoemByIdOrSlug(id)
    })
  }, [params, fetchPoemByIdOrSlug])

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading poem...</p>
        </CardContent>
      </Card>
    )
  }

  if (!poem) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold mb-2">Poem Not Found</h2>
          <p className="text-muted-foreground">The poem you are looking for does not exist.</p>
        </CardContent>
      </Card>
    )
  }

  return <PoemForm initialData={poem} slug={poem.slug.en} />
}