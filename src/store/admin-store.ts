"use client";

import { create } from "zustand";
import { IUser } from "@/types/userTypes";

interface AdminState {
  userData: IUser | null;
  users: IUser[];
  selectedUser: IUser | null;
  loading: boolean;
  error: string | null;
  fetchUserData: () => Promise<void>;
  updateUserData: (data: FormData) => Promise<{ success: boolean; message?: string }>;
  clearUserData: () => void;
  fetchAllUsers: (page?: number, limit?: number) => Promise<void>;
  fetchUserByIdentifier: (identifier: string) => Promise<void>;
  addUser: (data: FormData) => Promise<{ success: boolean; message?: string }>;
  updateUserByIdentifier: (identifier: string, data: FormData) => Promise<{ success: boolean; message?: string }>;
  deleteUserByIdentifier: (identifier: string) => Promise<{ success: boolean; message?: string }>;
}

export const useAdminStore = create<AdminState>((set) => ({
  userData: null,
  users: [],
  selectedUser: null,
  loading: false,
  error: null,

  fetchUserData: async () => {
    try {
      set({ loading: true, error: null });
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const user = await response.json();
      if (user) {
        set({
          userData: { ...user, _id: user._id.toString() },
          loading: false,
        });
      } else {
        set({ error: "User not found", loading: false });
      }
    } catch {
      set({ error: "Failed to fetch user data", loading: false });
    }
  },

  updateUserData: async (data: FormData) => {
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        body: data,
      });
      const result = await response.json();
      if (response.ok) {
        set({ userData: { ...result.user, _id: result.user._id.toString() } });
        return { success: true };
      } else {
        return {
          success: false,
          message: result.message || "Failed to update profile",
        };
      }
    } catch {
      return {
        success: false,
        message: "An error occurred while updating profile",
      };
    }
  },

  clearUserData: () => set({ userData: null, error: null, loading: false }),

  fetchAllUsers: async (page = 1, limit = 10) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/users?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const { users }: { users: IUser[] } = await response.json();
      set({
        users: users.map((user: IUser) => ({
          ...user,
          _id: user._id.toString(),
        })),
        loading: false,
      });
    } catch {
      set({ error: "Failed to fetch users", loading: false });
    }
  },

  fetchUserByIdentifier: async (identifier: string) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/users/${identifier}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status}`);
      }
      const user = await response.json();
      if (user) {
        set({
          selectedUser: { ...user, _id: user._id.toString() },
          loading: false,
        });
      } else {
        set({ error: "User not found", loading: false, selectedUser: null });
      }
    } catch {
      set({ error: "Failed to fetch user", loading: false, selectedUser: null });
    }
  },

  addUser: async (data: FormData) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch("/api/users", {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (response.ok) {
        set((state) => ({
          users: [
            ...state.users,
            { ...result.user, _id: result.user._id.toString() },
          ],
          loading: false,
        }));
        return { success: true };
      } else {
        set({ error: result.message || "Failed to add user", loading: false });
        return {
          success: false,
          message: result.message || "Failed to add user",
        };
      }
    } catch {
      set({ error: "An error occurred while adding user", loading: false });
      return { success: false, message: "An error occurred while adding user" };
    }
  },

  updateUserByIdentifier: async (identifier: string, data: FormData) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/users/${identifier}`, {
        method: "PATCH",
        body: data,
      });
      const result = await response.json();
      if (response.ok) {
        set((state) => ({
          users: state.users.map((user) =>
            user._id === result.user._id || user.slug === result.user.slug
              ? { ...result.user, _id: result.user._id.toString() }
              : user
          ),
          selectedUser:
            state.selectedUser &&
            (state.selectedUser._id === result.user._id ||
              state.selectedUser.slug === result.user.slug)
              ? { ...result.user, _id: result.user._id.toString() }
              : state.selectedUser,
          loading: false,
        }));
        return { success: true };
      } else {
        set({
          error: result.message || "Failed to update user",
          loading: false,
        });
        return {
          success: false,
          message: result.message || "Failed to update user",
        };
      }
    } catch {
      set({ error: "An error occurred while updating user", loading: false });
      return {
        success: false,
        message: "An error occurred while updating user",
      };
    }
  },

  deleteUserByIdentifier: async (identifier: string) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/users/${identifier}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (response.ok) {
        set((state) => ({
          users: state.users.filter(
            (user) => user._id !== identifier && user.slug !== identifier
          ),
          selectedUser:
            state.selectedUser &&
            (state.selectedUser._id === identifier ||
              state.selectedUser.slug === identifier)
              ? null
              : state.selectedUser,
          loading: false,
        }));
        return { success: true };
      } else {
        set({
          error: result.message || "Failed to delete user",
          loading: false,
        });
        return {
          success: false,
          message: result.message || "Failed to delete user",
        };
      }
    } catch {
      set({ error: "An error occurred while deleting user", loading: false });
      return { success: false, message: "An error occurred while deleting user" };
    }
  },
}));