import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IUser } from "@/types/userTypes";

interface AdminStore {
  users: IUser[];
  selectedUser: IUser | null;
  loading: boolean;
  lastFetched: number | null;
  fetchUsers: (force?: boolean) => Promise<void>;
  fetchUser: (id: string) => Promise<void>;
  updateUser: (id: string, data: Partial<IUser>) => Promise<{ success: boolean; message?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; message?: string }>;
  clearSelectedUser: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      users: [],
      selectedUser: null,
      loading: false,
      lastFetched: null,

      fetchUsers: async (force = false) => {
        const { users, lastFetched } = get();

        if (!force && users.length > 0 && lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
          console.log("[AdminStore] Using cached users");
          return;
        }

        set({ loading: true });
        try {
          console.log("[AdminStore] Fetching fresh users, force:", force);
          const res = await fetch("/api/users");
          const data = await res.json();

          if (res.ok && data.users) {
            const formattedUsers: IUser[] = data.users.map((user: IUser) => ({
              ...user,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt),
              dob: user.dob ? new Date(user.dob) : undefined,
              dateOfDeath: user.dateOfDeath ? new Date(user.dateOfDeath) : undefined,
            }));
            set({
              users: formattedUsers,
              lastFetched: Date.now(),
            });
          } else {
            throw new Error(data.message || "Failed to fetch users");
          }
        } catch (error) {
          console.error("[AdminStore] Error fetching users:", error);
        } finally {
          set({ loading: false });
        }
      },

      fetchUser: async (id: string) => {
        set({ loading: true });
        try {
          const res = await fetch(`/api/users/${id}`);
          const data = await res.json();

          if (res.ok) {
            const formattedUser: IUser = {
              ...data,
              createdAt: new Date(data.createdAt),
              updatedAt: new Date(data.updatedAt),
              dob: data.dob ? new Date(data.dob) : undefined,
              dateOfDeath: data.dateOfDeath ? new Date(data.dateOfDeath) : undefined,
            };
            set({ selectedUser: formattedUser });
          } else {
            throw new Error(data.message || "Failed to fetch user");
          }
        } catch (error) {
          console.error("[AdminStore] Error fetching user:", error);
          set({ selectedUser: null });
        } finally {
          set({ loading: false });
        }
      },

      updateUser: async (id: string, data: Partial<IUser>) => {
        try {
          const res = await fetch(`/api/users/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          const result = await res.json();

          if (res.ok) {
            await get().fetchUsers(true); // Refresh users list
            if (get().selectedUser?._id?.toString() === id) {
              await get().fetchUser(id); // Refresh selected user
            }
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        } catch {
          return { success: false, message: "An error occurred while updating user" };
        }
      },

      deleteUser: async (id: string) => {
        try {
          const res = await fetch(`/api/users/${id}`, {
            method: "DELETE",
          });
          const result = await res.json();

          if (res.ok) {
            await get().fetchUsers(true); // Refresh users list
            set({ selectedUser: null }); // Clear selected user if it was deleted
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        } catch {
          return { success: false, message: "An error occurred while deleting user" };
        }
      },

      clearSelectedUser: () => {
        set({ selectedUser: null });
      },
    }),
    {
      name: "admin-storage",
      partialize: (state) => ({
        users: state.users,
        lastFetched: state.lastFetched,
      }),
    }
  )
);