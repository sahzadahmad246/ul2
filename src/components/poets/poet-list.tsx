"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, Grid, List, Users } from "lucide-react"
import { usePoetStore } from "@/store/poet-store"
import PoetCard from "./poet-card"
import PoetCardSkeleton from "./poet-card-skeleton"

export default function PoetList() {
  const { poets, loading, error, fetchAllPoets } = usePoetStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchAllPoets(currentPage, 12)
  }, [currentPage, fetchAllPoets])

  // Filter poets based on search query
  const filteredPoets = useMemo(() => {
    if (!searchQuery.trim()) return poets

    return poets.filter(
      (poet) =>
        poet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        poet.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        poet.location?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [poets, searchQuery])

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-8 text-center">
          <div className="text-destructive mb-2">Error loading poets</div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => fetchAllPoets(currentPage, 12)} className="mt-4" variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Discover Poets</h1>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search poets by name, bio, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            <Button variant="outline" className="shrink-0">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${filteredPoets.length} poet${filteredPoets.length !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {/* Poets Grid/List */}
      {loading ? (
        <div
          className={`grid gap-6 ${
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
          }`}
        >
          {[...Array(8)].map((_, i) => (
            <PoetCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredPoets.length > 0 ? (
        <div
          className={`grid gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1 max-w-2xl mx-auto"
          }`}
        >
          {filteredPoets.map((poet) => (
            <PoetCard key={poet._id} poet={poet} />
          ))}
        </div>
      ) : (
        <Card className="border-border/50 bg-card">
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-2">No poets found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search terms or clear the search to see all poets."
                : "No poets are available at the moment."}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-4">
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Load More Button */}
      {!loading && filteredPoets.length > 0 && filteredPoets.length >= 12 && (
        <div className="flex justify-center">
          <Button onClick={() => setCurrentPage((prev) => prev + 1)} variant="outline" className="min-w-32">
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}
