"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, MapPin, Calendar, Settings, LogOut, MoreHorizontal } from "lucide-react"
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
      {/* Cover Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/30"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/30"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Profile Info Section */}
      <div className="relative -mt-16 mb-6">
        <div className="flex justify-between items-end mb-4">
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
            <AvatarImage src={userData.profilePicture?.url || "/placeholder.svg"} alt={userData.name || "User"} />
            <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {userData.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)} className="rounded-full">
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline" size="sm" onClick={onLogout} className="rounded-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{userData.name}</h1>
              <Badge variant="secondary" className="capitalize">
                {userData.role}
              </Badge>
            </div>
            <p className="text-muted-foreground">@{userData.slug}</p>
          </div>

          {userData.bio && <p className="text-sm leading-relaxed">{userData.bio}</p>}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {userData.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {userData.location}
              </div>
            )}
            {isValidDob && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Born {formatDate(dob)}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined {formatDate(userData.createdAt)}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 pt-2">
            {shouldShowPoemCount && (
              <div className="text-center">
                <p className="text-xl font-bold">{userData.poemCount ?? 0}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Poems</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-xl font-bold">{userData.bookmarks?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Bookmarks</p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      <EditProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog} userData={userData} />
    </>
  )
}
