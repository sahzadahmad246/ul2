"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useUserStore } from "@/store/user-store"
import ProfileHeader from "./ProfileHeader"
import ProfileContent from "./ProfileContent"
import ProfileSkeleton from "./profile-skeleton"
import StickyHeader from "./sticky-header"
import LogoutDialog from "./logout-dialog"

export default function Profile() {
  const { status } = useSession()
  const { userData, fetchUserData, clearUserData } = useUserStore()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserData()
    } else if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, fetchUserData, router])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 200)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
      clearUserData()
      router.push("/")
    } catch {
      // Handle error silently
    }
    setShowLogoutDialog(false)
  }

  if (status === "loading" || !userData) {
    return <ProfileSkeleton />
  }

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader isScrolled={isScrolled} userData={userData} onBack={() => router.back()} />

      {/* Cover Photo */}
      <div className="relative h-48 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <ProfileHeader userData={userData} onBack={() => router.back()} onLogout={() => setShowLogoutDialog(true)} />

        <ProfileContent userData={userData} />
      </div>

      <LogoutDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} onConfirm={handleSignOut} />
    </div>
  )
}