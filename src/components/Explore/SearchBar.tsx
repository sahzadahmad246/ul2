"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useSearchStore } from "@/store/search-store"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, X, Trash2, Search, Clock, ArrowRight } from "lucide-react"

interface SearchBarProps {
  onSearch: (query: string) => void
  initialQuery: string
  loading: boolean
}

export function SearchBar({ onSearch, initialQuery, loading }: SearchBarProps) {
  const {
    searchHistory,
    addSearchHistory,
    removeSearchHistory,
    clearSearchHistory,
    clearSearch,
    hydrateSearchHistory,
  } = useSearchStore()
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)

  // Hydrate search history on client mount
  useEffect(() => {
    if (typeof window === "undefined") return
    hydrateSearchHistory()
  }, [hydrateSearchHistory])

  // Sync initial query
  useEffect(() => {
    setSearchInput(initialQuery)
  }, [initialQuery])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        historyRef.current &&
        !historyRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleClear = () => {
    setSearchInput("")
    clearSearch()
    inputRef.current?.focus()
  }

  const handleHistoryClick = (query: string) => {
    setSearchInput(query)
    onSearch(query)
    setIsFocused(false)
  }

  const handleRemoveHistory = (query: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeSearchHistory(query)
  }

  const handleSearch = () => {
    if (searchInput.trim()) {
      addSearchHistory(searchInput)
      onSearch(searchInput)
    } else {
      clearSearch()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  // Show search history only when input is focused and empty
  const showSearchHistory = isFocused && searchHistory.length > 0 && !searchInput.trim()

  return (
    <div className="relative mb-4">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search poems, poets, or topics..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="pl-10 pr-10 h-11 text-sm bg-background border-border/50 focus:border-primary/50 transition-all rounded-lg shadow-sm focus:shadow-md"
            disabled={loading}
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-11 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Button
            type="submit"
            className="ml-2 h-11 px-3 rounded-lg shadow-sm hover:shadow-md transition-all"
            disabled={loading}
            onClick={handleSearch}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </form>

      {showSearchHistory && (
        <div
          ref={historyRef}
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-auto z-10"
        >
          <div className="flex justify-between items-center p-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Recent Searches</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearchHistory}
              className="text-destructive hover:text-destructive/80 text-xs h-7 px-2"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
          <div className="divide-y divide-border/50">
            {searchHistory.map((query) => (
              <div
                key={query}
                className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleHistoryClick(query)}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{query}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-full hover:bg-background"
                    onClick={(e) => handleRemoveHistory(query, e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                    <span className="sr-only">Remove</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-full hover:bg-background text-primary"
                    onClick={() => handleHistoryClick(query)}
                  >
                    <ArrowRight className="h-3 w-3" />
                    <span className="sr-only">Search</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
