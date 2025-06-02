"use client";

import { create } from "zustand";
import { IPoem,  Pagination } from "@/types/poemTypes";
import { IUser } from "@/types/userTypes";  
interface SearchState {
  query: string;
  poems: IPoem[];
  users: IUser[];
  poemPagination: Pagination | null;
  userPagination: Pagination | null;
  randomPoems: IPoem[];
  randomPoets: IUser[];
  searchHistory: string[];
  loading: boolean;
  error: string | null;
  fetchSearchResults: (query: string, page?: number, limit?: number, language?: string) => Promise<void>;
  fetchRandomPoems: (limit?: number) => Promise<void>;
  fetchRandomPoets: (limit?: number) => Promise<void>;
  setQuery: (query: string) => void;
  addSearchHistory: (query: string) => void;
  removeSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  clearSearch: () => void;
  hydrateSearchHistory: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  poems: [],
  users: [],
  poemPagination: null,
  userPagination: null,
  randomPoems: [],
  randomPoets: [],
  searchHistory: [], // Initialize empty for SSR
  loading: false,
  error: null,

  fetchSearchResults: async (query: string, page = 1, limit = 10, language?: string) => {
    try {
      set({ loading: true, error: null });
      const params = new URLSearchParams({ query, page: page.toString(), limit: limit.toString() });
      if (language) params.append("language", language);
      const response = await fetch(`/api/search?${params.toString()}`, {
        credentials: "include",
        next: { revalidate: 60 },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch search results");
      }
      const { poems, users } = await response.json();
      set((state) => ({
        poems: page === 1 ? poems.results : [...state.poems, ...poems.results],
        users: page === 1 ? users.results : [...state.users, ...users.results],
        poemPagination: poems.pagination,
        userPagination: users.pagination,
        loading: false,
        query,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown error", loading: false });
    }
  },

  fetchRandomPoems: async (limit = 10) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/poems?limit=${limit}&random=true`, {
        credentials: "include",
        next: { revalidate: 60 },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch random poems");
      }
      const { poems } = await response.json();
      set({ randomPoems: poems, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown error", loading: false });
    }
  },

  fetchRandomPoets: async (limit = 10) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/poets?limit=${limit}&random=true`, {
        credentials: "include",
        next: { revalidate: 60 },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch random poets");
      }
      const { poets } = await response.json();
      set({ randomPoets: poets, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown error", loading: false });
    }
  },

  setQuery: (query: string) => set({ query }),

  addSearchHistory: (query: string) => {
    if (!query.trim()) return;
    set((state) => {
      const updatedHistory = [query, ...state.searchHistory.filter((q) => q !== query)].slice(0, 10);
      if (typeof window !== "undefined") {
        localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
      }
      return { searchHistory: updatedHistory };
    });
  },

  removeSearchHistory: (query: string) => {
    set((state) => {
      const updatedHistory = state.searchHistory.filter((q) => q !== query);
      if (typeof window !== "undefined") {
        localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
      }
      return { searchHistory: updatedHistory };
    });
  },

  clearSearchHistory: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("searchHistory");
    }
    set({ searchHistory: [] });
  },

  clearSearch: () =>
    set({
      query: "",
      poems: [],
      users: [],
      poemPagination: null,
      userPagination: null,
      error: null,
      loading: false,
    }),

  hydrateSearchHistory: () => {
    if (typeof window !== "undefined") {
      const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
      set({ searchHistory: history });
    }
  },
}));