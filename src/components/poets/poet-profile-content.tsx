"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Eye, Heart } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/date";
import { IPoet } from "@/types/userTypes"; // Import IPoet type

// Extend IPoet to include totalViews as an optional field
interface PoetProfileContentProps {
  poet: IPoet & { totalViews?: number }; // Add totalViews as optional
}

export default function PoetProfileContent({ poet }: PoetProfileContentProps) {
  const joinDate = new Date(poet.createdAt);
  const isValidJoinDate = !isNaN(joinDate.getTime());

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
      {/* About Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            About {poet.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {poet.bio ? (
            <p className="text-sm sm:text-base text-foreground leading-relaxed">{poet.bio}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No biography available.</p>
          )}

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
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm">Total Poems</span>
              </div>
              <span className="font-semibold text-sm sm:text-base">{poet.poemCount || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm">Total Views</span>
              </div>
              <span className="font-semibold text-sm sm:text-base">{poet.totalViews || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm">Bookmarks</span>
              </div>
              <span className="font-semibold text-sm sm:text-base">{poet.bookmarks?.length || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}