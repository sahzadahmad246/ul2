"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAdminStore } from "@/store/adminStore";
import type { IUser } from "@/types/userTypes";
import { toast } from "sonner";
import { X } from "lucide-react";

interface UserEditDialogProps {
  user: IUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserEditDialog({
  user,
  open,
  onOpenChange,
}: UserEditDialogProps) {
  const { updateUser } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    role: "user" as "user" | "poet" | "admin",
    bio: "",
    location: "",
    interests: [] as string[],
  });
  const [interestsInput, setInterestsInput] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        slug: user.slug || "",
        role: user.role || "user",
        bio: user.bio || "",
        location: user.location || "",
        interests: user.interests || [],
      });
      setInterestsInput((user.interests || []).join(", "));
    }
  }, [user]);

  const handleInterestsChange = (value: string) => {
    setInterestsInput(value);
    const interests = value
      .split(",")
      .map((interest) => interest.trim())
      .filter((interest) => interest.length > 0);
    setFormData((prev) => ({ ...prev, interests }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;

    setLoading(true);
    try {
      const result = await updateUser(user._id.toString(), formData);
      if (result.success) {
        toast.success("User updated successfully");
        onOpenChange(false);
      } else {
        toast.error(result.message || "Failed to update user");
      }
    } catch {
      toast.error("An error occurred while updating the user");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Avatar and Basic Info */}
          <div className="flex items-center gap-4 p-4 rounded-lg border">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={
                  user.profilePicture?.url ||
                  "/placeholder.svg?height=64&width=64"
                }
                alt={user.name}
              />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{user.role}</Badge>
                <span className="text-xs text-muted-foreground">
                  {user.followerCount || 0} followers • {user.poemCount || 0}{" "}
                  poems
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: "user" | "poet" | "admin") =>
                setFormData({ ...formData, role: value })
              }
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

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              rows={3}
              placeholder="User bio..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="User location..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interests">Interests</Label>
            <Input
              id="interests"
              value={interestsInput}
              onChange={(e) => handleInterestsChange(e.target.value)}
              placeholder="poetry, literature, art (comma separated)"
            />
            {formData.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.interests.map((interest, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {interest}
                    <button
                      type="button"
                      onClick={() => {
                        const newInterests = formData.interests.filter(
                          (_, i) => i !== index
                        );
                        setFormData({ ...formData, interests: newInterests });
                        setInterestsInput(newInterests.join(", "));
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Updating..." : "Update User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
