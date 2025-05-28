// src/components/navigation/Navigation.tsx
"use client";

import { ReactNode } from "react";

import MobileNav from "./MobileNav";
import DesktopNav from "./DesktopNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavigationProps {
  children: ReactNode;
}

export default function Navigation({ children }: NavigationProps) {
  
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {isMobile ? (
        <MobileNav>{children}</MobileNav>
      ) : (
        <DesktopNav>{children}</DesktopNav>
      )}
    </div>
  );
}