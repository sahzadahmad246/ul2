"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { FileText, MapPin, User } from 'lucide-react'
import Link from "next/link"
import type { IPoet } from "@/types/userTypes"

interface PoetCardProps {
  poet: IPoet
}

export default function PoetCard({ poet }: PoetCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border bg-card">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Profile Picture */}
          <Avatar className="h-20 w-20 ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all">
            <AvatarImage 
              src={poet.profilePicture?.url || "/placeholder.svg"} 
              alt={poet.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-lg font-semibold">
              {poet.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Poet Info */}
          <div className="space-y-2 w-full">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
              {poet.name}
            </h3>
            
            {poet.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {poet.bio}
              </p>
            )}

            {poet.location && (
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{poet.location}</span>
              </div>
            )}
          </div>

          {/* Poem Count Badge */}
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
            <FileText className="h-3 w-3 mr-1" />
            {poet.poemCount} {poet.poemCount === 1 ? 'Poem' : 'Poems'}
          </Badge>

          {/* View Profile Button */}
          <Button 
            asChild 
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
            variant="outline"
          >
            <Link href={`/poet/${poet.slug}`}>
              <User className="h-4 w-4 mr-2" />
              View Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
