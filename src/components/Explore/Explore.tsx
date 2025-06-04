"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchStore } from "@/store/search-store"
import { usePoemStore } from "@/store/poem-store"
import { usePoetStore } from "@/store/poet-store"
import { useUserStore } from "@/store/user-store"
import { SearchBar } from "@/components/Explore/SearchBar"
import { ExploreSkeleton } from "@/components/Explore/ExploreSkeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Bookmark, Sparkles, Eye, Search, User, BookOpen, ChevronRight, TrendingUp } from "lucide-react"
import Link from "next/link"

export function Explore() {
  const {
    query,
    poems,
    users,
    poemPagination,
    userPagination,
    randomPoems,
    randomPoets,
    loading,
    error,
    fetchSearchResults,
    fetchRandomPoems,
    fetchRandomPoets,
  } = useSearchStore()
  const { poems: allPoems, fetchPoems } = usePoemStore()
  const { poets, fetchAllPoets } = usePoetStore()
  const { userData } = useUserStore()
  const [activeTab, setActiveTab] = useState<string>("all")
  const hasInitialized = useRef(false)

  // Initialize and fetch data on mount
  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === "undefined") return

    if (!hasInitialized.current) {
      if (!randomPoems.length && !randomPoets.length && !query) {
        fetchRandomPoems(6)
        fetchRandomPoets(6)
      }
      if (!allPoems.length) fetchPoems()
      if (!poets.length) fetchAllPoets()
      hasInitialized.current = true
    }
  }, [
    allPoems.length,
    poets.length,
    query,
    randomPoems.length,
    randomPoets.length,
    fetchPoems,
    fetchAllPoets,
    fetchRandomPoems,
    fetchRandomPoets,
  ])

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      fetchSearchResults(searchQuery, 1, 10)
    }
  }

  const handleLoadMorePoems = () => {
    if (poemPagination && poemPagination.page < poemPagination.pages) {
      fetchSearchResults(query, poemPagination.page + 1, poemPagination.limit)
    }
  }

  const handleLoadMoreUsers = () => {
    if (userPagination && userPagination.page < userPagination.pages) {
      fetchSearchResults(query, userPagination.page + 1, userPagination.limit)
    }
  }

  const formatCoupletDisplay = (couplet: string | undefined) => {
    if (!couplet) return [<div key="empty">No content available</div>]

    return couplet
      .split("\n")
      .filter((line) => line.trim())
      .map((line, index) => (
        <div key={index} className="leading-relaxed">
          {line}
        </div>
      ))
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-0 sm:p-4 py-3 sm:py-4">
        {/* Enhanced Search Bar */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-center bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Explore Poetry
          </h1>
          <SearchBar onSearch={handleSearch} initialQuery={query} loading={loading} />
        </div>

        {error && (
          <Card className="mb-4 sm:mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="p-3 text-center">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {query ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold">
                Search Results for <span className="text-primary">&quot;{query}&quot;</span>
              </h2>
            </div>

            {loading && poems.length === 0 && users.length === 0 ? (
              <ExploreSkeleton type="search" itemCount={5} />
            ) : (
              <Tabs defaultValue="poems" className="w-full">
                <TabsList className="grid grid-cols-2 mb-4 sm:mb-6">
                  <TabsTrigger value="poems" className="text-xs sm:text-sm">
                    <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Poems ({poems.length})
                  </TabsTrigger>
                  <TabsTrigger value="poets" className="text-xs sm:text-sm">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Poets ({users.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="poems" className="space-y-3">
                  {poems.length === 0 && !loading ? (
                    <Card className="border-dashed">
                      <CardContent className="p-3 text-center">
                        <div className="h-12 w-12 sm:h-16 sm:w-16 mx-auto bg-gradient-to-br from-muted/50 to-muted/30 rounded-full flex items-center justify-center mb-3">
                          <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium mb-2">No poems found</h3>
                        <p className="text-muted-foreground text-sm">Try searching with different keywords</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {poems.map((poem) => (
                        <Card
                          key={poem._id}
                          className="overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50 hover:border-primary/20"
                        >
                          <CardContent className="p-3">
                            <Link href={`/poems/en/${poem.slug.en}`} className="block group">
                              <div className="relative pl-3 sm:pl-4 py-2">
                                {/* Enhanced vertical gradient line */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/60 to-primary/20 rounded-full group-hover:from-primary group-hover:via-primary/80 group-hover:to-primary/40 transition-all duration-300" />

                                <div className="text-sm sm:text-base leading-relaxed font-serif whitespace-pre-line text-foreground/90 group-hover:text-foreground transition-colors">
                                  {formatCoupletDisplay(poem.content.en?.[0]?.couplet || "No couplet available")}
                                </div>
                              </div>
                            </Link>

                            <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/30">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5 sm:h-6 sm:w-6 border border-border/50">
                                  <AvatarImage
                                    src={poem.poet?.profilePicture?.url || "/placeholder.svg"}
                                    alt={poem.poet?.name || "Unknown"}
                                  />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {poem.poet?.name?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs sm:text-sm font-medium truncate">
                                  {poem.poet?.name || "Unknown"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  <span className="hidden sm:inline">{poem.viewsCount || 0}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Bookmark className="h-3 w-3" />
                                  <span className="hidden sm:inline">{poem.bookmarkCount || 0}</span>
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {poemPagination && poemPagination.page < poemPagination.pages && (
                        <div className="flex justify-center pt-2">
                          <Button
                            onClick={handleLoadMorePoems}
                            disabled={loading}
                            variant="outline"
                            className="gap-2 text-sm"
                          >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load More Poems"}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="poets" className="space-y-3">
                  {users.length === 0 && !loading ? (
                    <Card className="border-dashed">
                      <CardContent className="p-3 text-center">
                        <div className="h-12 w-12 sm:h-16 sm:w-16 mx-auto bg-gradient-to-br from-muted/50 to-muted/30 rounded-full flex items-center justify-center mb-3">
                          <User className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium mb-2">No poets found</h3>
                        <p className="text-muted-foreground text-sm">Try searching with different keywords</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {users.map((user) => (
                        <Card
                          key={user._id}
                          className="overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50 hover:border-primary/20"
                        >
                          <CardContent className="p-3">
                            <Link href={`/poet/${user.slug}`} className="flex items-center gap-3 sm:gap-4 group">
                              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-background ring-1 ring-border/50 group-hover:ring-primary/30 transition-all">
                                <AvatarImage src={user.profilePicture?.url || "/placeholder.svg"} alt={user.name} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm sm:text-base font-semibold group-hover:text-primary transition-colors">
                                  {user.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">@{user.slug}</p>
                                {user.poemCount > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="mt-1 text-xs bg-primary/10 text-primary border-primary/20"
                                  >
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    {user.poemCount} {user.poemCount === 1 ? "poem" : "poems"}
                                  </Badge>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </Link>
                          </CardContent>
                        </Card>
                      ))}

                      {userPagination && userPagination.page < userPagination.pages && (
                        <div className="flex justify-center pt-2">
                          <Button
                            onClick={handleLoadMoreUsers}
                            disabled={loading}
                            variant="outline"
                            className="gap-2 text-sm"
                          >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load More Poets"}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {loading && randomPoems.length === 0 && randomPoets.length === 0 ? (
              <ExploreSkeleton type="discover" />
            ) : (
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-4 sm:mb-6">
                  <TabsTrigger value="all" className="text-xs sm:text-sm">
                    <Sparkles className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                    <span className="hidden sm:inline">Explore</span>
                    <span className="sm:hidden">All</span>
                  </TabsTrigger>
                  <TabsTrigger value="bookmarks" className="text-xs sm:text-sm">
                    <Bookmark className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                    <span className="hidden sm:inline">Bookmarks</span>
                    <span className="sm:hidden">Saved</span>
                  </TabsTrigger>
                  <TabsTrigger value="trending" className="text-xs sm:text-sm">
                    <TrendingUp className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                    Trending
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 sm:space-y-5">
                  {/* Random Poems */}
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                          <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold">Discover Poems</h2>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="text-xs gap-1 h-8">
                        <Link href="/poems">
                          View All <ChevronRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>

                    {randomPoems.length === 0 && !loading ? (
                      <Card className="border-dashed">
                        <CardContent className="p-3 text-center">
                          <p className="text-muted-foreground text-sm">No poems available</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {randomPoems.slice(0, 3).map((poem) => (
                          <Card
                            key={poem._id}
                            className="overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50 hover:border-primary/20"
                          >
                            <CardContent className="p-3">
                              <Link href={`/poems/en/${poem.slug.en}`} className="block group">
                                <div className="relative pl-3 sm:pl-4 py-1.5 sm:py-2">
                                  {/* Enhanced vertical gradient line */}
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/60 to-primary/20 rounded-full group-hover:from-primary group-hover:via-primary/80 group-hover:to-primary/40 transition-all duration-300" />

                                  <div className="text-sm sm:text-base leading-relaxed font-serif whitespace-pre-line text-foreground/90 group-hover:text-foreground transition-colors">
                                    {formatCoupletDisplay(poem.content.en?.[0]?.couplet || "No couplet available")}
                                  </div>
                                </div>
                              </Link>

                              <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/30">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5 sm:h-6 sm:w-6 border border-border/50">
                                    <AvatarImage
                                      src={poem.poet?.profilePicture?.url || "/placeholder.svg"}
                                      alt={poem.poet?.name || "Unknown"}
                                    />
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                      {poem.poet?.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs sm:text-sm font-medium truncate">
                                    {poem.poet?.name || "Unknown"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    <span className="hidden sm:inline">{poem.viewsCount || 0}</span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Bookmark className="h-3 w-3" />
                                    <span className="hidden sm:inline">{poem.bookmarkCount || 0}</span>
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Random Poets */}
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold">Discover Poets</h2>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="text-xs gap-1 h-8">
                        <Link href="/poets">
                          View All <ChevronRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>

                    {randomPoets.length === 0 && !loading ? (
                      <Card className="border-dashed">
                        <CardContent className="p-3 text-center">
                          <p className="text-muted-foreground text-sm">No poets available</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {randomPoets.slice(0, 4).map((poet) => (
                          <Card
                            key={poet._id}
                            className="overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50 hover:border-primary/20"
                          >
                            <CardContent className="p-3">
                              <Link href={`/poet/${poet.slug}`} className="flex items-center gap-3 group">
                                <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-background ring-1 ring-border/50 group-hover:ring-primary/30 transition-all">
                                  <AvatarImage src={poet.profilePicture?.url || "/placeholder.svg"} alt={poet.name} />
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {poet.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                    {poet.name}
                                  </h3>
                                  <p className="text-xs text-muted-foreground truncate">@{poet.slug}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </Link>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </section>
                </TabsContent>

                <TabsContent value="bookmarks" className="space-y-4 sm:space-y-5">
                  {userData?.bookmarks?.length ? (
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                          <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold">Your Bookmarked Poems</h2>
                      </div>

                      <div className="space-y-2">
                        {userData.bookmarks.map(
                          (bookmark) =>
                            bookmark.poem && (
                              <Card
                                key={bookmark.poemId}
                                className="overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50 hover:border-primary/20"
                              >
                                <CardContent className="p-3">
                                  <Link href={`/poems/en/${bookmark.poem.slug}`} className="block group">
                                    <div className="relative pl-3 sm:pl-4 py-1.5 sm:py-2">
                                      {/* Enhanced vertical gradient line */}
                                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/60 to-primary/20 rounded-full group-hover:from-primary group-hover:via-primary/80 group-hover:to-primary/40 transition-all duration-300" />

                                      <div className="text-sm sm:text-base leading-relaxed font-serif whitespace-pre-line text-foreground/90 group-hover:text-foreground transition-colors">
                                        {formatCoupletDisplay(bookmark.poem.firstCouplet || "No couplet available")}
                                      </div>
                                    </div>
                                  </Link>

                                  <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/30">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs sm:text-sm font-medium">{bookmark.poem.poetName}</span>
                                    </div>

                                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Eye className="h-3 w-3" />
                                        <span className="hidden sm:inline">{bookmark.poem.viewsCount || 0}</span>
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ),
                        )}
                      </div>
                    </section>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="p-3 text-center">
                        <div className="h-12 w-12 sm:h-16 sm:w-16 mx-auto bg-gradient-to-br from-muted/50 to-muted/30 rounded-full flex items-center justify-center mb-3">
                          <Bookmark className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium mb-2">No bookmarked poems yet</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Start exploring and bookmark your favorite poems to see them here!
                        </p>
                        <Button asChild className="gap-2">
                          <Link href="/poems">
                            <Sparkles className="h-4 w-4" />
                            Explore Poems
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="trending" className="space-y-4 sm:space-y-5">
                  {loading && randomPoems.length === 0 ? (
                    <ExploreSkeleton type="trending" />
                  ) : (
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                          <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold">Trending Poems</h2>
                      </div>

                      {randomPoems.length === 0 && !loading ? (
                        <Card className="border-dashed">
                          <CardContent className="p-3 text-center">
                            <p className="text-muted-foreground text-sm">No trending poems available</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-2">
                          {randomPoems.slice(0, 5).map((poem, index) => (
                            <Card
                              key={poem._id}
                              className="overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50 hover:border-primary/20"
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-primary/10 text-primary border-primary/30"
                                  >
                                    #{index + 1}
                                  </Badge>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-xs sm:text-sm font-medium truncate">
                                      {poem.title?.en || "Untitled Poem"}
                                    </h3>
                                  </div>
                                </div>

                                <Link href={`/poems/en/${poem.slug.en}`} className="block group">
                                  <div className="relative pl-3 sm:pl-4 py-1.5 sm:py-2">
                                    {/* Enhanced vertical gradient line */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/60 to-primary/20 rounded-full group-hover:from-primary group-hover:via-primary/80 group-hover:to-primary/40 transition-all duration-300" />

                                    <div className="text-sm leading-relaxed font-serif whitespace-pre-line text-foreground/90 group-hover:text-foreground transition-colors">
                                      {formatCoupletDisplay(poem.content.en?.[0]?.couplet || "No couplet available")}
                                    </div>
                                  </div>
                                </Link>

                                <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/30">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5 sm:h-6 sm:w-6 border border-border/50">
                                      <AvatarImage
                                        src={poem.poet?.profilePicture?.url || "/placeholder.svg"}
                                        alt={poem.poet?.name || "Unknown"}
                                      />
                                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                        {poem.poet?.name?.charAt(0) || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs sm:text-sm font-medium truncate">
                                      {poem.poet?.name || "Unknown"}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      <span className="hidden sm:inline">{poem.viewsCount || 0}</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Bookmark className="h-3 w-3" />
                                      <span className="hidden sm:inline">{poem.bookmarkCount || 0}</span>
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </section>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
