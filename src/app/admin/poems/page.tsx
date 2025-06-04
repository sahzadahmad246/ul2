"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePoemStore } from "@/store/poem-store"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, BookOpen } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import type { IPoem, SerializedPoem } from "@/types/poemTypes"

export default function PoemsPage() {
  const { poems, fetchPoems, deletePoem, loading } = usePoemStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  useEffect(() => {
    fetchPoems(1, 100)
  }, [fetchPoems])

  // Convert SerializedPoem[] to IPoem[] with safe null checks
const convertedPoems: IPoem[] = (poems || []).map((poem: SerializedPoem): IPoem => ({
  ...poem,
  createdAt: new Date(poem.createdAt),
  updatedAt: new Date(poem.updatedAt),
  bookmarks: (poem.bookmarks || []).map(bookmark => ({
    ...bookmark,
    bookmarkedAt: new Date(bookmark.bookmarkedAt),
  })),
}));

  const filteredPoems = convertedPoems.filter((poem: IPoem) => {
    const matchesSearch =
      poem.title.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poem.title.hi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poem.title.ur.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || poem.status === statusFilter
    const matchesCategory = categoryFilter === "all" || poem.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleDelete = async (poem: IPoem) => {
    if (confirm(`Are you sure you want to delete "${poem.title.en}"?`)) {
      const result = await deletePoem(poem._id)
      if (result.success) {
        toast.success("Poem deleted successfully")
      } else {
        toast.error(result.message || "Failed to delete poem")
      }
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    return status === "published" ? "default" : "secondary"
  }

  const categories = ["poem", "ghazal", "sher", "nazm", "rubai", "marsiya", "qataa", "other"]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Poems Management</h1>
          <p className="text-muted-foreground">Manage poetry content and publications</p>
        </div>
        <Button asChild>
          <Link href="/admin/poems/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Poem
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Poems</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Poems Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Poems ({filteredPoems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Bookmarks</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPoems.map((poem) => (
                    <TableRow key={poem._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium line-clamp-1">{poem.title.en}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {poem.title.hi} • {poem.title.ur}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{poem.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(poem.status)}>{poem.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {poem.viewsCount || 0}
                        </div>
                      </TableCell>
                      <TableCell>{poem.bookmarkCount || 0}</TableCell>
                      <TableCell>{new Date(poem.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/poems/${poem.slug.en}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(poem)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}