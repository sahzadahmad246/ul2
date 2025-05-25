"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AdminPoemCard } from "@/components/admin/admin-poem-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePoemStore } from "@/store/poemStore"
import { Plus, Search } from "lucide-react"

export default function AdminPoemsPage() {
  const { poems, fetchPoems, loading } = usePoemStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    fetchPoems(1, true)
  }, [fetchPoems])

  const filteredPoems = poems.filter((poem) => {
    const matchesSearch =
      poem.title.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poem.title.hi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poem.title.ur.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || poem.status === statusFilter
    const matchesCategory = categoryFilter === "all" || poem.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Poems</h1>
          <p className="text-muted-foreground">Manage all poems on the platform</p>
        </div>
        <Button asChild>
          <Link href="/admin/poems/new">
            <Plus className="h-4 w-4 mr-2" />
            Add New Poem
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search poems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="poem">Poem</SelectItem>
            <SelectItem value="ghazal">Ghazal</SelectItem>
            <SelectItem value="sher">Sher</SelectItem>
            <SelectItem value="nazm">Nazm</SelectItem>
            <SelectItem value="rubai">Rubai</SelectItem>
            <SelectItem value="marsiya">Marsiya</SelectItem>
            <SelectItem value="qataa">Qataa</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredPoems.length} of {poems.length} poems
            </p>
          </div>

          {filteredPoems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No poems found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPoems.map((poem) => (
                <AdminPoemCard key={poem.slug.en} poem={poem} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
