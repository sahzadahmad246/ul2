"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"

interface PoemSearchProps {
  onSearch: (query: string) => void
  onFilterChange: (filters: SearchFilters) => void
}

interface SearchFilters {
  category?: string
  language?: string
  topics?: string[]
}

export default function PoemSearch({ onSearch, onFilterChange }: PoemSearchProps) {
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<SearchFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFilterChange(updatedFilters)
  }

  const clearFilters = () => {
    setFilters({})
    onFilterChange({})
  }

  const hasActiveFilters = Object.values(filters).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  )

  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search poems, poets, or topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={hasActiveFilters ? "border-primary" : ""}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
              !
            </Badge>
          )}
        </Button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 border rounded-lg bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Filters</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={filters.category || ""}
                onValueChange={(value) => updateFilters({ category: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select
                value={filters.language || ""}
                onValueChange={(value) => updateFilters({ language: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All languages</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी</SelectItem>
                  <SelectItem value="ur">اردو</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Popular Topics</label>
              <div className="flex flex-wrap gap-2">
                {["love", "nature", "life", "philosophy", "spirituality", "romance"].map((topic) => (
                  <Badge
                    key={topic}
                    variant={filters.topics?.includes(topic) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const currentTopics = filters.topics || []
                      const newTopics = currentTopics.includes(topic)
                        ? currentTopics.filter((t) => t !== topic)
                        : [...currentTopics, topic]
                      updateFilters({ topics: newTopics.length > 0 ? newTopics : undefined })
                    }}
                  >
                    #{topic}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
