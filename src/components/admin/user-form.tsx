"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; // Import next/image
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAdminStore } from "@/store/admin-store";
import type { IUser } from "@/types/userTypes";
import { toast } from "sonner";
import { User, Mail, MapPin, FileText, Image as ImageIcon, Calendar } from "lucide-react";

interface UserFormProps {
  initialData?: IUser;
  slug?: string;
}

export default function UserForm({ initialData, slug }: UserFormProps) {
  const router = useRouter();
  const { addUser, updateUserByIdentifier } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialData;

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    role: (initialData?.role || "user") as "user" | "poet" | "admin",
    bio: initialData?.bio || "",
    location: initialData?.location || "",
    dob: initialData?.dob ? new Date(initialData.dob).toISOString().split("T")[0] : "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.profilePicture?.url || null);

  const [errors, setErrors] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        setErrors(["Only JPEG or PNG images are allowed"]);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(["Image must be less than 5MB"]);
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    const newErrors: string[] = [];
    if (!formData.name.trim()) newErrors.push("Name is required");
    if (!formData.email.trim()) newErrors.push("Email is required");
    if (formData.dob && isNaN(Date.parse(formData.dob))) newErrors.push("Invalid date of birth");

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          data.append(key, value);
        }
      });
      if (image) {
        data.append("image", image);
      }

      const result = isEdit
        ? await updateUserByIdentifier(slug!, data)
        : await addUser(data);

      if (result.success) {
        toast.success(`User ${isEdit ? "updated" : "created"} successfully`);
        router.push("/admin/users");
      } else {
        const errorMessage = result.message || `Failed to ${isEdit ? "update" : "create"} user`;
        toast.error(errorMessage);
        setErrors([errorMessage]);
      }
    } catch {
      const errorMessage = `An error occurred while ${isEdit ? "updating" : "creating"} the user`;
      toast.error(errorMessage);
      setErrors([errorMessage]);
    } finally {
      setLoading(false);
    }
  };

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
            {isEdit && initialData && (
              <div className="flex items-center gap-4 p-4 rounded-lg border mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={imagePreview || initialData.profilePicture?.url || "/placeholder.svg?height=64&width=64"}
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
                  {initialData.slug && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Slug: {initialData.slug}
                    </p>
                  )}
                </div>
              </div>
            )}

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
                    {!isEdit && (
                      <p className="text-xs text-muted-foreground">
                        A URL-friendly slug will be generated automatically from the name.
                      </p>
                    )}
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
                        disabled={isEdit}
                      />
                    </div>
                    {isEdit && (
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed in edit mode.
                      </p>
                    )}
                  </div>
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
                  <p className="text-xs text-muted-foreground">
                    Determines user permissions and access level.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Profile Picture</Label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="image"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleImageChange}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload a JPEG or PNG image (max 5MB).
                  </p>
                  {imagePreview && (
                    <div className="mt-2">
                      <Image
                        src={imagePreview}
                        alt="Profile preview"
                        width={96}
                        height={96}
                        className="rounded-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

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

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select your date of birth (optional).
                  </p>
                </div>
              </div>

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
  );
}