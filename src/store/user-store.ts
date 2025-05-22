// src/store/user-store.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { IUser } from "@/types/userTypes"

interface UserStore {
  userData: IUser | null
  loading: boolean
  fetchUserData: () => Promise<void>
  updateUserData: (data: FormData) => Promise<{ success: boolean; message?: string }>
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      userData: null,
      loading: false,

      fetchUserData: async () => {
        set({ loading: true })
        try {
          const res = await fetch("/api/users/me")
          const data = await res.json()
          if (data.user) {
            // Map API response to IUser, ensuring defaults for optional fields
            const userData: IUser = {
              ...data.user,
              dob: data.user.dob ? new Date(data.user.dob) : undefined,
              createdAt: new Date(data.user.createdAt),
              updatedAt: new Date(data.user.updatedAt),
              poemCount: data.user.poemCount ?? 0, // Default to 0 if undefined
              followerCount: data.user.followerCount ?? 0, // Default to 0
              followingCount: data.user.followingCount ?? 0, // Default to 0
            }
            set({ userData })
          }
          return data.user
        } catch (error) {
          console.error("Error fetching user data:", error)
        } finally {
          set({ loading: false })
        }
      },

      updateUserData: async (formData: FormData) => {
        try {
          const res = await fetch("/api/users/profile", {
            method: "PUT",
            body: formData,
          })
          const result = await res.json()

          if (res.ok) {
            await get().fetchUserData()
            return { success: true }
          } else {
            return { success: false, message: result.message }
          }
        } catch (error) {
          console.error("Error updating profile:", error)
          return { success: false, message: "An error occurred while updating profile" }
        }
      },
    }),
    {
      name: "user-storage",
      partialize: (state) => ({ userData: state.userData }),
    },
  ),
)