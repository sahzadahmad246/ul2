// src/components/navigation/navItems.ts
import { Home, Compass, User, BookOpen, Feather, BookText, Settings, LayoutDashboard } from "lucide-react";

export const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Explore", href: "/explore", icon: Compass },
  { name: "Poet", href: "/poet", icon: User },
  { name: "Sher", href: "/sher", icon: BookOpen },
  { name: "Ghazal", href: "/ghazal", icon: Feather },
  { name: "Nazm", href: "/nazm", icon: BookText },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
];