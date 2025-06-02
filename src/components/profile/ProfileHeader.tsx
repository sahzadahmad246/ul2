"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, MapPin, Calendar, Settings, LogOut, MoreHorizontal, Sparkles } from "lucide-react"
import { formatDate } from "@/lib/utils/date"
import type { IUser } from "@/types/userTypes"
import EditProfileDialog from "./ProfileForm"

interface ProfileHeaderProps {
  userData: IUser
  onBack: () => void
  onLogout: () => void
}

export default function ProfileHeader({ userData, onBack, onLogout }: ProfileHeaderProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const dob = userData.dob ? new Date(userData.dob) : null
  const isValidDob = dob && !isNaN(dob.getTime())
  const shouldShowPoemCount = userData.role === "admin" || userData.role === "poet"

  return (
    <>
      {/* Light Header Controls - Compatible with both modes */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full bg-background/80 backdrop-blur-md border border-border/50 hover:bg-background/90 transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-background/80 backdrop-blur-md border border-border/50 hover:bg-background/90 transition-all duration-200"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Enhanced Profile Info Section */}
      <div className="relative -mt-16 mb-6">
        <div className="flex justify-between items-end mb-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-background ring-4 ring-primary/20 transition-all duration-300 hover:ring-primary/40">
              <AvatarImage
                src={userData.profilePicture?.url || "/placeholder.svg"}
                alt={userData.name || "User"}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                {userData.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
              className="rounded-full bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card transition-all duration-200"
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="rounded-full bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card transition-all duration-200 text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {userData.name}
              </h1>
              <Badge variant="secondary" className="capitalize bg-primary/10 text-primary border-primary/20">
                {userData.role}
              </Badge>
            </div>
            <p className="text-muted-foreground font-medium">@{userData.slug}</p>
          </div>

          {userData.bio && (
            <div className="bg-gradient-to-r from-muted/30 to-muted/20 rounded-lg p-4">
              <p className="text-sm leading-relaxed text-foreground/90">{userData.bio}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {userData.location && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted/30">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{userData.location}</span>
              </div>
            )}
            {isValidDob && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted/30">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Born {formatDate(dob)}</span>
              </div>
            )}
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted/30">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Joined {formatDate(userData.createdAt)}</span>
            </div>
          </div>

          {/* Enhanced Stats */}
          <div className="flex gap-6 pt-2">
            {shouldShowPoemCount && (
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                <p className="text-xl font-bold text-primary">{userData.poemCount ?? 0}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Poems</p>
              </div>
            )}
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
              <p className="text-xl font-bold text-accent-foreground">{userData.bookmarks?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Bookmarks</p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-6 bg-gradient-to-r from-transparent via-border to-transparent" />

      <EditProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog} userData={userData} />
    </>
  )
}
