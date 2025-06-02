// src/store/poem-store.ts
"use client";

import { create } from "zustand";
import { FeedItem , Pagination} from "@/types/poemTypes";


interface FeedState {
  feedItems: FeedItem[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  fetchFeed: (page?: number, limit?: number) => Promise<void>;
  setFeedItems: (items: FeedItem[]) => void;
  setPagination: (pagination: Pagination) => void;
  clearFeed: () => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  feedItems: [],
  pagination: null,
  loading: false,
  error: null,

  fetchFeed: async (page = 1, limit = 10) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/poems/feed?page=${page}&limit=${limit}`, {
        credentials: "include",
        next: { revalidate: 60 },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch feed");
      }
      const { items, pagination } = await response.json();
      set((state) => ({
        feedItems: page === 1 ? items : [...state.feedItems, ...items],
        pagination,
        loading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown error", loading: false });
    }
  },

  setFeedItems: (items: FeedItem[]) => set({ feedItems: items }),
  setPagination: (pagination: Pagination) => set({ pagination }),
  clearFeed: () => set({ feedItems: [], pagination: null, error: null, loading: false }),
}));