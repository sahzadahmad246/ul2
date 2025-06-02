"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FileText, User, Crown } from "lucide-react";
import Link from "next/link";
import type { IPoet } from "@/types/userTypes";

interface PoetCardProps {
  poet: IPoet;
}

export default function PoetCard({ poet }: PoetCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border bg-card overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center p-4 relative">
          {/* Profile Picture */}
          <div className="relative mr-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all">
              <AvatarImage
                src={poet.profilePicture?.url || "/placeholder.svg"}
                alt={poet.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-lg font-semibold">
                {poet.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-yellow-500 rounded-full flex items-center justify-center shadow-sm">
              <Crown className="h-3 w-3 text-white" />
            </div>
          </div>

          {/* Poet Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate">
              {poet.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              @{poet.slug}
            </p>
          </div>

          {/* Poem Count Badge - Top Right */}
          <Badge
            variant="secondary"
            className="absolute top-0 right-4 bg-primary/10 text-primary hover:bg-primary/20"
          >
            <FileText className="h-3 w-3 mr-1" />
            {poet.poemCount}
          </Badge>
        </div>

        {/* View Profile Button */}
        <Button
          asChild
          className="w-full rounded-none h-12 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
          variant="ghost"
        >
          <Link href={`/poet/${poet.slug}`}>
            <User className="h-4 w-4 mr-2" />
            View Profile
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
