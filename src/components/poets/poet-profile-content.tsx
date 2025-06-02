"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, Eye, Heart, ChevronDown, ChevronUp } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils/date"
import type { IPoet } from "@/types/userTypes"

// Extend IPoet to include totalViews as an optional field
interface PoetProfileContentProps {
  poet: IPoet & { totalViews?: number }
}

export default function PoetProfileContent({ poet }: PoetProfileContentProps) {
  const [showFullBio, setShowFullBio] = useState(false)
  const joinDate = new Date(poet.createdAt)
  const isValidJoinDate = !isNaN(joinDate.getTime())

  const bioText = poet.bio || "No biography available."
  const shouldShowToggle = bioText.length > 200
  const displayBio = shouldShowToggle && !showFullBio ? bioText.slice(0, 200) + "..." : bioText

  return (
    <div className="space-y-6">
      {/* Bio Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">About {poet.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="text-sm sm:text-base text-foreground leading-relaxed">
              {poet.bio ? (
                <div>
                  <p>{displayBio}</p>
                  {shouldShowToggle && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullBio(!showFullBio)}
                      className="mt-2 p-0 h-auto text-primary hover:text-primary/80 font-medium"
                    >
                      {showFullBio ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show More
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No biography available.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Poet</Badge>
              <Badge variant="outline">Urdu Literature</Badge>
              {poet.location && <Badge variant="outline">{poet.location}</Badge>}
            </div>

            {isValidJoinDate && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Member since {formatRelativeTime(joinDate)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-primary/10 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Total Poems</span>
              </div>
              <span className="text-2xl font-bold text-primary">{poet.poemCount || 0}</span>
            </div>

            <div className="bg-blue-500/10 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Total Views</span>
              </div>
              <span className="text-2xl font-bold text-blue-500">{poet.totalViews || 0}</span>
            </div>

            <div className="bg-red-500/10 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">Bookmarks</span>
              </div>
              <span className="text-2xl font-bold text-red-500">{poet.bookmarks?.length || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
