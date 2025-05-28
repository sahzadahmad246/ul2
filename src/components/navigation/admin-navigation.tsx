"use client"

import type React from "react"
import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "../admin/admin-sidebar"
import { useUserStore } from "@/store/user-store"
import { Card, CardContent } from "@/components/ui/card"
import { Shield } from 'lucide-react'

interface AdminNavigationProps {
  children: React.ReactNode
}

export function AdminNavigation({ children }: AdminNavigationProps) {
  const { data: session, status } = useSession()
  const { userData, fetchUserData } = useUserStore()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/")
      return
    }

    if (session.user?.id) {
      fetchUserData()
    }
  }, [session, status, router, fetchUserData])

  useEffect(() => {
    if (userData && userData.role !== "admin") {
      router.push("/")
    }
  }, [userData, router])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || (userData && userData.role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to access this area.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold">Admin Dashboard</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto max-w-7xl p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}