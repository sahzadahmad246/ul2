"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import Navigation from "./navigation"
import { AdminNavigation } from "./admin-navigation"

interface ConditionalNavigationProps {
  children: React.ReactNode
}

export default function ConditionalNavigation({ children }: ConditionalNavigationProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith('/admin')

  if (isAdminRoute) {
    return <AdminNavigation>{children}</AdminNavigation>
  }

  return <Navigation>{children}</Navigation>
}