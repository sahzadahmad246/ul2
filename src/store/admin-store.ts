"use client";

import { create } from "zustand";
import { IUser } from "@/types/userTypes";

interface AdminState {
  userData: IUser | null; // Current admin's user data
  users: IUser[]; // List of all users
  selectedUser: IUser | null; // Single user fetched by ID or slug
  loading: boolean;
  error: string | null;
  fetchUserData: () => Promise<void>; // From user store, removed force parameter
  updateUserData: (data: FormData) => Promise<{ success: boolean; message?: string }>; // From user store
  clearUserData: () => void; // From user store
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

  // Fetch current admin's user data (from user store)
  fetchUserData: async () => {
    try {
      set({ loading: true, error: null });
      const response = await fetch("/api/users");
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

  // Update current admin's user data (from user store)
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
        return { success: false, message: result.message || "Failed to update profile" };
      }
    } catch {
      return { success: false, message: "An error occurred while updating profile" };
    }
  },

  // Clear current admin's user data (from user store)
  clearUserData: () => set({ userData: null, error: null, loading: false }),

  // Fetch all users (admin-specific)
  fetchAllUsers: async (page = 1, limit = 10) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/users?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const { users }: { users: IUser[] } = await response.json();
      set({ users: users.map((user: IUser) => ({ ...user, _id: user._id.toString() })), loading: false });
    } catch {
      set({ error: "Failed to fetch users", loading: false });
    }
  },

  // Fetch a single user by ID or slug (admin-specific)
  fetchUserByIdentifier: async (identifier: string) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/users/${identifier}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      const user = await response.json();
      if (user) {
        set({ selectedUser: { ...user, _id: user._id.toString() }, loading: false });
      } else {
        set({ error: "User not found", loading: false });
      }
    } catch {
      set({ error: "Failed to fetch user", loading: false });
    }
  },

  // Add a new user (admin-specific)
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
          users: [...state.users, { ...result.user, _id: result.user._id.toString() }],
          loading: false,
        }));
        return { success: true };
      } else {
        set({ error: result.message || "Failed to add user", loading: false });
        return { success: false, message: result.message || "Failed to add user" };
      }
    } catch {
      set({ error: "An error occurred while adding user", loading: false });
      return { success: false, message: "An error occurred while adding user" };
    }
  },

  // Update a user by ID or slug (admin-specific)
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
            state.selectedUser && (state.selectedUser._id === result.user._id || state.selectedUser.slug === result.user.slug)
              ? { ...result.user, _id: result.user._id.toString() }
              : state.selectedUser,
          loading: false,
        }));
        return { success: true };
      } else {
        set({ error: result.message || "Failed to update user", loading: false });
        return { success: false, message: result.message || "Failed to update user" };
      }
    } catch {
      set({ error: "An error occurred while updating user", loading: false });
      return { success: false, message: "An error occurred while updating user" };
    }
  },

  // Delete a user by ID or slug (admin-specific)
  deleteUserByIdentifier: async (identifier: string) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/users/${identifier}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (response.ok) {
        set((state) => ({
          users: state.users.filter((user) => user._id !== identifier && user.slug !== identifier),
          selectedUser: state.selectedUser && (state.selectedUser._id === identifier || state.selectedUser.slug === identifier)
            ? null
            : state.selectedUser,
          loading: false,
        }));
        return { success: true };
      } else {
        set({ error: result.message || "Failed to delete user", loading: false });
        return { success: false, message: result.message || "Failed to delete user" };
      }
    } catch {
      set({ error: "An error occurred while deleting user", loading: false });
      return { success: false, message: "An error occurred while deleting user" };
    }
  },
}));