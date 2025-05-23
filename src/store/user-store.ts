import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IUser } from "@/types/userTypes";

interface UserStore {
  userData: IUser | null;
  loading: boolean;
  lastFetched: number | null;
  fetchUserData: (force?: boolean) => Promise<void>;
  updateUserData: (data: FormData) => Promise<{ success: boolean; message?: string }>;
  clearUserData: () => void;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      userData: null,
      loading: false,
      lastFetched: null,

      fetchUserData: async (force = false) => {
        const { userData, lastFetched } = get();

        // Skip cache check if forced
        if (!force && userData && lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
          return;
        }

        set({ loading: true });
        try {
          const res = await fetch("/api/users/me");
          const data = await res.json();
          if (res.ok && data) {
            const userData: IUser = {
              ...data,
              _id: data._id ? data._id : undefined,
              googleId: data.googleId ? data.googleId : undefined,
              email: data.email,
              name: data.name,
              profilePicture: data.profilePicture
                ? { url: data.profilePicture.url, publicId: data.profilePicture.publicId }
                : undefined,
              roles: data.roles || ["user"],
              bio: data.bio ? data.bio : undefined,
              dob: data.dob ? new Date(data.dob) : undefined,
              dateOfDeath: data.dateOfDeath ? new Date(data.dateOfDeath) : undefined,
              location: data.location ? data.location : undefined,
              following: data.following || [],
              followers: data.followers || [],
              followerCount: data.followerCount ?? 0,
              followingCount: data.followingCount ?? 0,
              interests: data.interests || [],
              likedPoems: data.likedPoems || [],
              poems: data.poems || [],
              poemCount: data.poemCount ?? 0,
              bookmarks: data.bookmarks || [], // Add bookmarks
              collections: data.collections || [], // Add collections
              createdAt: new Date(data.createdAt),
              updatedAt: new Date(data.updatedAt),
            };
            set({ userData, lastFetched: Date.now() });
          } else {
            throw new Error(data.error || "Failed to fetch user data");
          }
        } catch {
          set({ userData: null });
        } finally {
          set({ loading: false });
        }
      },

      updateUserData: async (formData: FormData) => {
        try {
          const res = await fetch("/api/users/profile", {
            method: "PUT",
            body: formData,
          });
          const result = await res.json();

          if (res.ok) {
            // Force fetch to update cache after successful update
            await get().fetchUserData(true);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        } catch {
          return { success: false, message: "An error occurred while updating profile" };
        }
      },

      clearUserData: () => {
        set({ userData: null, lastFetched: null, loading: false });
      },
    }),
    {
      name: "user-storage",
      partialize: (state) => ({ userData: state.userData, lastFetched: state.lastFetched }),
    }
  )
);