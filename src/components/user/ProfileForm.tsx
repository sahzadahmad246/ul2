"use client"

import type React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { useUserStore } from "@/store/user-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import ProfileImageUpload from "./profile-image-upload"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ProfileFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const INTERESTS = ["love", "nature", "history", "philosophy", "spirituality", "life"]

export default function ProfileFormDialog({ open, onOpenChange }: ProfileFormDialogProps) {
  const { userData, updateUserData } = useUserStore()

  const [formData, setFormData] = useState({
    name: userData?.name || "",
    bio: userData?.bio || "",
    dob: userData?.dob ? new Date(userData.dob).toISOString().split("T")[0] : "",
    location: userData?.location || "",
    interests: userData?.interests || [],
  })

  const [image, setImage] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)

    const data = new FormData()
    if (formData.name) data.append("name", formData.name)
    if (formData.bio) data.append("bio", formData.bio)
    if (formData.dob) data.append("dob", formData.dob)
    if (formData.location) data.append("location", formData.location)
    if (formData.interests.length > 0) data.append("interests", JSON.stringify(formData.interests))
    if (image) data.append("image", image)

    const result = await updateUserData(data)

    setSubmitting(false)

    if (result.success) {
      toast.success("Profile updated successfully")
      onOpenChange(false)
    } else {
      toast.error(result.message || "Failed to update profile")
    }
  }

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => {
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest]

      return { ...prev, interests: newInterests }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form id="profile-form" onSubmit={handleSubmit} className="space-y-6 py-2">
            <ProfileImageUpload
              initialImage={userData?.profilePicture?.url}
              onImageChange={setImage}
              name={userData?.name}
            />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Your location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Interests</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {INTERESTS.map((interest) => (
                    <Button
                      key={interest}
                      type="button"
                      variant={formData.interests.includes(interest) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInterestToggle(interest)}
                      className="capitalize"
                    >
                      {interest}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="submit" form="profile-form" disabled={submitting}>
            {submitting ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
