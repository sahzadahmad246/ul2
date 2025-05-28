"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAdminStore } from "@/store/admin-store"
import type { IUser } from "@/types/userTypes"
import { toast } from "sonner"
import { User, Mail, MapPin, FileText } from "lucide-react"

interface UserFormProps {
  initialData?: IUser
  slug?: string
}

export default function UserForm({ initialData, slug }: UserFormProps) {
  const router = useRouter()
  const { addUser, updateUserByIdentifier } = useAdminStore()
  const [loading, setLoading] = useState(false)
  const isEdit = !!initialData

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    slug: initialData?.slug || "",
    role: (initialData?.role || "user") as "user" | "poet" | "admin",
    bio: initialData?.bio || "",
    location: initialData?.location || "",
  })

  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setLoading(true)

    // Validation
    const newErrors: string[] = []
    if (!formData.name.trim()) newErrors.push("Name is required")
    if (!formData.email.trim()) newErrors.push("Email is required")
    if (!formData.slug.trim()) newErrors.push("Slug is required")

    if (newErrors.length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    try {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value)
      })

      const result = isEdit ? await updateUserByIdentifier(slug!, data) : await addUser(data)

      if (result.success) {
        toast.success(`User ${isEdit ? "updated" : "created"} successfully`)
        router.push("/admin/users")
      } else {
        toast.error(result.message || `Failed to ${isEdit ? "update" : "create"} user`)
        setErrors([result.message || `Failed to ${isEdit ? "update" : "create"} user`])
      }
    } catch {
      toast.error(`An error occurred while ${isEdit ? "updating" : "creating"} the user`)
      setErrors([`An error occurred while ${isEdit ? "updating" : "creating"} the user`])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <User className="h-6 w-6" />
              {isEdit ? "Edit User" : "Create New User"}
            </CardTitle>
            <p className="text-muted-foreground">
              {isEdit ? "Update user information" : "Add a new user to the platform"}
            </p>
          </CardHeader>

          <CardContent className="p-6">
            {/* Current User Info (Edit Mode) */}
            {isEdit && initialData && (
              <div className="flex items-center gap-4 p-4 rounded-lg border mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={initialData.profilePicture?.url || "/placeholder.svg?height=64&width=64"}
                    alt={initialData.name}
                  />
                  <AvatarFallback>{initialData.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{initialData.name}</h3>
                  <p className="text-sm text-muted-foreground">{initialData.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{initialData.role}</Badge>
                    <span className="text-xs text-muted-foreground">{initialData.poemCount || 0} poems</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {errors.length > 0 && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
                <ul className="space-y-1">
                  {errors.map((error, i) => (
                    <li key={i} className="text-sm">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Enter full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="Enter email address"
                        className="pl-10"
                        disabled={isEdit} // Don't allow email changes in edit mode
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                      placeholder="user-slug"
                      pattern="^[a-z0-9-]+$"
                      title="Only lowercase letters, numbers, and hyphens allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used in URLs. Only lowercase letters, numbers, and hyphens.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: "user" | "poet" | "admin") => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="poet">Poet</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Additional Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, Country"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Saving..." : isEdit ? "Update User" : "Create User"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
