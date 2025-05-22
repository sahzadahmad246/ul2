"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"

interface ProfileImageUploadProps {
  initialImage?: string
  onImageChange: (file: File | null) => void
  name?: string
}

export default function ProfileImageUpload({ initialImage, onImageChange, name = "" }: ProfileImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null

    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
      onImageChange(file)

      // Clean up the object URL when component unmounts
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setPreviewUrl(initialImage || null)
      onImageChange(null)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="h-24 w-24 border-2 border-border">
          <AvatarImage src={previewUrl || "/placeholder.svg?height=96&width=96"} alt="Profile" />
          <AvatarFallback className="text-2xl">{name ? name[0].toUpperCase() : "U"}</AvatarFallback>
        </Avatar>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md opacity-90 hover:opacity-100"
          onClick={triggerFileInput}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
