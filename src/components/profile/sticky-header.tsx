"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import type { IUser } from "@/types/userTypes";

interface StickyHeaderProps {
  isScrolled: boolean;
  userData: IUser;
  onBack: () => void;
}

export default function StickyHeader({ isScrolled, userData, onBack }: StickyHeaderProps) {
  const shouldShowPoemCount = userData.role === "admin" || userData.role === "poet";

  return (
    <div
      className={`fixed top-0 left-0 right-30 z-50 transition-all duration-300 ${
        isScrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"
      }`}
    >
      <div className="max-w-2xl mx-auto bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={userData.profilePicture?.url || "/placeholder.svg"}
                alt={userData.name || "User"}
                className="object-cover"
              />
              <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {userData.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg">{userData.name}</h2>
                <Badge variant="secondary" className="text-xs capitalize">
                  {userData.role}
                </Badge>
              </div>
              {shouldShowPoemCount && <p className="text-xs text-muted-foreground">{userData.poemCount ?? 0} poems</p>}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}