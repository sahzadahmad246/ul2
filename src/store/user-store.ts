// src/store/user-store.ts
"use client";

import { create } from "zustand";
import { IUser } from "@/types/userTypes";

interface UserState {
  userData: IUser | null;
  loading: boolean;
  error: string | null;
  fetchUserData: () => Promise<void>; 
  updateUserData: (data: FormData) => Promise<{ success: boolean; message?: string }>;
  clearUserData: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userData: null,
  loading: false,
  error: null,
  fetchUserData: async () => {
    try {
      set({ loading: true, error: null });
      const response = await fetch("/api/user");
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const user = await response.json();
     
      if (user) {
        set({ userData: { ...user, _id: user._id.toString() }, loading: false });
      } else {
        set({ error: "User not found", loading: false });
      }
    } catch {
      set({ error: "Failed to fetch user data", loading: false });
    }
  },
  updateUserData: async (data: FormData) => {
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        body: data,
      });
      const result = await response.json();
      if (response.ok) {
        set({ userData: { ...result.user, _id: result.user._id.toString() } });
        return { success: true };
      } else {
        return { success: false, message: result.message || "Failed to update profile" };
      }
    } catch {
      return { success: false, message: "An error occurred while updating profile" };
    }
  },
  clearUserData: () => set({ userData: null, error: null, loading: false }),
}));