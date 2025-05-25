// src/stores/poetStore.ts
import { create } from "zustand";
import { Types } from "mongoose";

interface PoetSummary {
  _id: string;
  name: string;
  profilePicture?: {
    publicId?: string;
    url?: string;
  };
}

interface Poet {
  _id: string;
  googleId?: string;
  email: string;
  name: string;
  slug: string;
  profilePicture?: {
    publicId?: string;
    url?: string;
  };
  role: string;
  bio?: string;
  dob?: Date;
  dateOfDeath?: Date;
  location?: string;
  following: { userId: Types.ObjectId; followedAt: Date }[];
  followers: { userId: Types.ObjectId; followedAt: Date }[];
  followerCount: number;
  followingCount: number;
  poemCount: number;
  poems: { poemId: Types.ObjectId }[];
  bookmarks: { poemId: Types.ObjectId; bookmarkedAt: Date }[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface PoetStore {
  poets: PoetSummary[];
  poet: Poet | null;
  loading: boolean;
  fetchPoets: () => Promise<void>;
  fetchPoet: (id: string) => Promise<void>;
}

export const usePoetStore = create<PoetStore>((set) => ({
  poets: [],
  poet: null,
  loading: false,

  fetchPoets: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/users/poets");
      const data = await res.json();
      if (res.ok && data.poets) {
        set({ poets: data.poets });
      } else {
        throw new Error(data.message || "Failed to fetch poets");
      }
    } catch (error) {
      console.error("[PoetStore] Error fetching poets:", error);
    } finally {
      set({ loading: false });
    }
  },

  fetchPoet: async (id: string) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/users/poets/${id}`);
      const data = await res.json();
      if (res.ok && data) {
        set({ poet: data });
      } else {
        throw new Error(data.message || "Failed to fetch poet");
      }
    } catch (error) {
      console.error("[PoetStore] Error fetching poet:", error);
      set({ poet: null });
    } finally {
      set({ loading: false });
    }
  },
}));