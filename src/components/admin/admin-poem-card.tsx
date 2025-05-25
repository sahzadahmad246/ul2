"use client";

import type React from "react";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { IPoem } from "@/types/poemTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Heart,
  Bookmark,
  Calendar,
  User,
  ExternalLink,
  Clock,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { usePoemStore } from "@/store/poemStore";
import { toast } from "sonner";

interface AdminPoemCardProps {
  poem: IPoem;
}

export function AdminPoemCard({ poem }: AdminPoemCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deletePoem } = usePoemStore();
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePoem(poem.slug.en);
      if (result.success) {
        toast.success("Poem deleted successfully");
        setShowDeleteDialog(false);
      } else {
        toast.error(result.message || "Failed to delete poem");
      }
    } catch {
      toast.error("An error occurred while deleting the poem");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    router.push(`/admin/poems/${poem.slug.en}/edit`);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on action buttons
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest('[role="button"]')
    ) {
      return;
    }
    router.push(`/poems/en/${poem.slug.en}`);
  };

  const poetName =
    typeof poem.poet === "object" && "name" in poem.poet
      ? poem.poet.name
      : "Unknown Poet";

  return (
    <>
      <Card
        className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {poem.title.en}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {poetName}
                </span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/poems/en/${poem.slug.en}`);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {poem.coverImage && (
            <div className="relative h-32 rounded-md overflow-hidden">
              <Image
                src={poem.coverImage || "/placeholder.svg"}
                alt={poem.title.en}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {poem.content.en[0]?.couplet || "No content available"}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(poem.createdAt, { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{poem.status}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-3 w-3" />
                <span>{(poem.viewsCount || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>
                  {(poem.likes?.length || 0) + (poem.bookmarkCount || 0)} eng.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1 text-red-500">
                <Heart className="h-3 w-3" />
                <span>{poem.likes?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-blue-500">
                <Bookmark className="h-3 w-3" />
                <span>{poem.bookmarkCount || 0}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                {poem.category}
              </Badge>
              <Badge
                variant={poem.status === "published" ? "default" : "outline"}
                className="text-xs"
              >
                {poem.status}
              </Badge>
            </div>

            {poem.topics.length > 0 && (
              <div className="flex gap-1">
                {poem.topics.slice(0, 2).map((topic) => (
                  <Badge key={topic} variant="outline" className="text-xs">
                    #{topic}
                  </Badge>
                ))}
                {poem.topics.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{poem.topics.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/poems/en/${poem.slug.en}`);
              }}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poem</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{poem.title.en}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
