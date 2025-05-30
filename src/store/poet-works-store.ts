"use client";

import { create } from "zustand";
import type { SerializedPoem } from "@/types/poemTypes";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PoetWorksState {
  works: Record<string, SerializedPoem[]>; // category -> poems
  pagination: Record<string, Pagination>; // category -> pagination
  loading: Record<string, boolean>; // category -> loading state
  error: string | null;

  fetchPoetWorks: (
    poetSlug: string,
    category: string,
    page?: number,
    limit?: number,
    sortBy?: string,
  ) => Promise<void>;

  bookmarkPoem: (
    poemId: string,
    userId: string,
    action: "add" | "remove",
    category: string,
  ) => Promise<{ success: boolean; message?: string }>;
}

export const usePoetWorksStore = create<PoetWorksState>((set) => ({
  works: {},
  pagination: {},
  loading: {},
  error: null,

  fetchPoetWorks: async (poetSlug: string, category: string, page = 1, limit = 20, sortBy = "recent") => {
    try {
      set((state) => ({
        loading: { ...state.loading, [category]: true },
        error: null,
      }));

      const response = await fetch(
        `/api/poet/${poetSlug}/works?category=${category}&page=${page}&limit=${limit}&sortBy=${sortBy}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch poet works (status: ${response.status})`);
      }

      const { poems, pagination } = await response.json();

      set((state) => ({
        works: {
          ...state.works,
          [category]: page === 1 ? poems : [...(state.works[category] || []), ...poems],
        },
        pagination: {
          ...state.pagination,
          [category]: pagination,
        },
        loading: { ...state.loading, [category]: false },
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      set((state) => ({
        error: errorMessage,
        loading: { ...state.loading, [category]: false },
      }));
    }
  },

  bookmarkPoem: async (poemId: string, userId: string, action: "add" | "remove", category: string) => {
    try {
      const response = await fetch("/api/poems/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poemId, userId, action }),
      });

      const result = await response.json();

      if (response.ok) {
        set((state) => ({
          works: {
            ...state.works,
            [category]:
              state.works[category]?.map((poem) => {
                if (poem._id === poemId) {
                  const updatedBookmarks =
                    action === "add"
                      ? [...poem.bookmarks, { userId, bookmarkedAt: new Date().toISOString() }]
                      : poem.bookmarks.filter((b) => b.userId !== userId);
                  return {
                    ...poem,
                    bookmarks: updatedBookmarks,
                    bookmarkCount: updatedBookmarks.length,
                  };
                }
                return poem;
              }) || [],
          },
        }));
        return { success: true };
      } else {
        return { success: false, message: result.message || `Failed to ${action} bookmark` };
      }
    } catch {
      return {
        success: false,
        message: `An error occurred while ${action === "add" ? "bookmarking" : "unbookmarking"} poem`,
      };
    }
  },
}));