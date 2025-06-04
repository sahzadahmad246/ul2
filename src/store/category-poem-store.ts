"use client";

import { create } from "zustand";
import { FeedItem, Pagination } from "@/types/poemTypes";

interface CategoryFeedState {
  feedItems: FeedItem[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  fetchCategoryFeed: (category: string, page?: number, limit?: number) => Promise<void>;
  setFeedItems: (items: FeedItem[]) => void;
  setPagination: (pagination: Pagination) => void;
  clearFeed: () => void;
}

export const useCategoryFeedStore = create<CategoryFeedState>((set) => ({
  feedItems: [],
  pagination: null,
  loading: false,
  error: null,

  fetchCategoryFeed: async (category: string, page = 1, limit = 10) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/poems-by-category?category=${category}&page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch category poems");
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