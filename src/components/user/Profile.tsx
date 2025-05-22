"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { signIn } from "next-auth/react";
import {
  MapPin,
  Calendar,
  BookOpen,
  Bookmark,
  Heart,
  Edit,
  LogOut,
  ChevronDown,
  ChevronUp,
  ImageIcon,
} from "lucide-react";
import { useUserStore } from "@/store/user-store";
import ProfileFormDialog from "@/components/user/ProfileForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const { data: session, status } = useSession();
  const { userData, loading, fetchUserData } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const [showAllInterests, setShowAllInterests] = useState(false);
  const [activeTab, setActiveTab] = useState(userData?.roles?.includes("poet") ? "poems" : "likes");

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id && !userData) {
      fetchUserData(); // Only fetch if no userData
    }
  }, [status, session?.user?.id, userData, fetchUserData]);

  if (status === "loading" || loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-8 animate-pulse">
        <div className="h-48 bg-muted rounded-lg"></div>
        <div className="flex flex-col gap-4 px-4">
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 bg-muted rounded-full -mt-12 border-4 border-background"></div>
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user?.id) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Please sign in to view your profile</h2>
            <p className="text-muted-foreground mb-4">You need to be logged in to access this page</p>
            <Button onClick={() => signIn("google", { callbackUrl: "/profile" })}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const isPoet = userData?.roles?.includes("poet") || false;

  const displayedInterests = showAllInterests ? userData?.interests : (userData?.interests || []).slice(0, 5);
  const hasMoreInterests = (userData?.interests || []).length > 5;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-blue-600 to-violet-600 rounded-t-lg relative">
        <div className="absolute inset-0 bg-black/10 rounded-t-lg"></div>
      </div>

      {/* Profile Header */}
      <div className="px-4 bg-background rounded-b-lg shadow-sm pb-4">
        <div className="relative pt-2">
          <button
            onClick={() => setShowProfilePicture(true)}
            className="group relative h-24 w-24 rounded-full border-4 border-background absolute -top-12 left-4 overflow-hidden"
          >
            <Avatar className="h-full w-full">
              <AvatarImage
                src={userData?.profilePicture?.url || "/placeholder.svg?height=96&width=96"}
                alt={userData?.name || "User"}
              />
              <AvatarFallback className="text-2xl">{userData?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
          </button>

          <div className="absolute right-4 top-8 flex gap-2">
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="gap-1">
              <Edit className="h-3.5 w-3.5" />
              Edit profile
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm" className="gap-1">
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </div>

        <div className="mt-2 mb-2">
          <h1 className="text-xl font-bold">{userData?.name || "Unknown"}</h1>
          <p className="text-sm text-muted-foreground">{userData?.email || ""}</p>
        </div>

        {userData?.bio && <p className="text-sm mb-3 leading-relaxed">{userData.bio}</p>}

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
          {userData?.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{userData.location}</span>
            </div>
          )}
          {userData?.dob && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Born {new Date(userData.dob).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="flex gap-6 text-sm mb-4">
          <div className="flex items-center gap-1 hover:underline cursor-pointer">
            <span className="font-semibold">{userData?.followingCount ?? 0}</span>
            <span className="text-muted-foreground">Following</span>
          </div>
          <div className="flex items-center gap-1 hover:underline cursor-pointer">
            <span className="font-semibold">{userData?.followerCount ?? 0}</span>
            <span className="text-muted-foreground">Followers</span>
          </div>
          {isPoet && (
            <div className="flex items-center gap-1 hover:underline cursor-pointer">
              <span className="font-semibold">{userData?.poemCount ?? 0}</span>
              <span className="text-muted-foreground">Poems</span>
            </div>
          )}
        </div>

        {userData?.interests && userData.interests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {displayedInterests?.map((interest: string) => (
                <span
                  key={interest}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium capitalize hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  {interest}
                </span>
              ))}
            </div>
            {hasMoreInterests && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs px-2 h-7 text-muted-foreground"
                onClick={() => setShowAllInterests(!showAllInterests)}
              >
                {showAllInterests ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5 mr-1" /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5 mr-1" /> Show more
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList
            className="grid w-full"
            style={{
              gridTemplateColumns: isPoet ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
            }}
          >
            {isPoet && <TabsTrigger value="poems">Poems</TabsTrigger>}
            <TabsTrigger value="likes">Likes</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
          </TabsList>

          {isPoet && (
            <TabsContent value="poems" className="space-y-4 mt-4">
              {(userData?.poemCount ?? 0) > 0 ? (
                <div className="grid gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="overflow-hidden hover:bg-muted/30 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 mt-1">
                            <AvatarImage
                              src={userData?.profilePicture?.url || "/placeholder.svg?height=40&width=40"}
                              alt={userData?.name || "User"}
                            />
                            <AvatarFallback>{userData?.name?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{userData?.name || "Unknown"}</span>
                              <span className="text-xs text-muted-foreground">· 2d</span>
                            </div>
                            <p className="text-sm mt-1 leading-relaxed">
                              This is a sample poem. Your actual poems will appear here.
                            </p>
                            <div className="flex items-center gap-6 mt-3">
                              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                                <Heart className="h-3.5 w-3.5" />
                                <span>24</span>
                              </button>
                              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                                <BookOpen className="h-3.5 w-3.5" />
                                <span>3</span>
                              </button>
                              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                                <Bookmark className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                  <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-2">No poems yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">You have not created any poems yet.</p>
                  <Button>Create Poem</Button>
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="likes" className="mt-4">
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <Heart className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium mb-2">No liked poems</h3>
              <p className="text-sm text-muted-foreground">Poems you like will appear here.</p>
            </div>
          </TabsContent>

          <TabsContent value="bookmarks" className="mt-4">
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <Bookmark className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium mb-2">No bookmarks yet</h3>
              <p className="text-sm text-muted-foreground">Poems you bookmark will appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ProfileFormDialog open={isEditing} onOpenChange={setIsEditing} />

      <Dialog open={showProfilePicture} onOpenChange={setShowProfilePicture}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile Picture</DialogTitle>
            <DialogDescription>View or update your profile picture</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            <div className="relative w-64 h-64 rounded-full overflow-hidden border">
              <Avatar className="h-full w-full">
                <AvatarImage
                  src={userData?.profilePicture?.url || "/placeholder.svg?height=256&width=256"}
                  alt={userData?.name || "User"}
                  className="object-cover"
                />
                <AvatarFallback className="text-6xl">{userData?.name?.[0] || "U"}</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setIsEditing(true)}>
              Update Picture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>You will need to sign in again to access your account.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}