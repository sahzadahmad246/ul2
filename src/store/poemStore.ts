import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IPoem } from "@/types/poemTypes";

interface PoemApiResponse {
  success: boolean;
  message?: string;
  errors?: { path: string[]; message: string }[];
}

interface PoemStore {
  poems: IPoem[];
  singlePoem: IPoem | null;
  loading: boolean;
  lastFetched: number | null;
  page: number;
  totalPages: number;
  fetchPoems: (page?: number, force?: boolean) => Promise<void>;
  fetchPoemBySlug: (slug: string, force?: boolean) => Promise<void>;
  createPoem: (formData: FormData) => Promise<PoemApiResponse>;
  updatePoem: (slug: string, formData: FormData) => Promise<PoemApiResponse>;
  deletePoem: (slug: string) => Promise<PoemApiResponse>;
  clearSinglePoem: () => void;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

export const usePoemStore = create<PoemStore>()(
  persist(
    (set, get) => ({
      poems: [],
      singlePoem: null,
      loading: false,
      lastFetched: null,
      page: 1,
      totalPages: 1,

      fetchPoems: async (page = 1, force = false) => {
        const { poems, lastFetched, page: currentPage } = get();

        if (!force && lastFetched && Date.now() - lastFetched < CACHE_DURATION && page === currentPage) {
          console.log("[PoemStore] Using cached poems, page:", page);
          return;
        }

        set({ loading: true });
        try {
          console.log("[PoemStore] Fetching fresh poems, page:", page, "force:", force);
          const res = await fetch(`/api/poems?page=${page}&limit=10`);
          const data = await res.json();
          if (res.ok && data.poems) {
            const formattedPoems: IPoem[] = await Promise.all(
              data.poems.map(async (poem: IPoem) => {
                const poetRes = await fetch(`/api/users/${poem.poet._id}`);
                const poetData = await poetRes.json();
                return {
                  ...poem,
                  _id: poem._id,
                  poet: poetRes.ok ? { _id: poem.poet._id, name: poetData.name, role: poetData.role } : poem.poet,
                  createdAt: new Date(poem.createdAt),
                  updatedAt: new Date(poem.updatedAt),
                };
              })
            );
            set({
              poems: page === 1 ? formattedPoems : [...poems, ...formattedPoems],
              page,
              totalPages: data.pagination.pages,
              lastFetched: Date.now(),
            });
          } else {
            throw new Error(data.message || "Failed to fetch poems");
          }
        } catch (error) {
          console.error("[PoemStore] Error fetching poems:", error);
        } finally {
          set({ loading: false });
        }
      },

      fetchPoemBySlug: async (slug: string, force = false) => {
        const { singlePoem, lastFetched } = get();

        if (!force && singlePoem && singlePoem.slug.en === slug && lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
          console.log("[PoemStore] Using cached poem, slug:", slug);
          return;
        }

        set({ loading: true });
        try {
          console.log("[PoemStore] Fetching fresh poem, slug:", slug, "force:", force);
          const res = await fetch(`/api/poems/${slug}`);
          const data = await res.json();
          if (res.ok && data) {
            const poetRes = await fetch(`/api/users/${data.poet._id}`);
            const poetData = await poetRes.json();
            const formattedPoem: IPoem = {
              ...data,
              _id: data._id,
              poet: poetRes.ok ? { _id: data.poet._id, name: poetData.name, role: poetData.role } : data.poet,
              createdAt: new Date(data.createdAt),
              updatedAt: new Date(data.updatedAt),
            };
            set({ singlePoem: formattedPoem, lastFetched: Date.now() });
          } else {
            throw new Error(data.message || "Failed to fetch poem");
          }
        } catch (error) {
          console.error("[PoemStore] Error fetching poem:", error);
          set({ singlePoem: null });
        } finally {
          set({ loading: false });
        }
      },

      createPoem: async (formData: FormData) => {
        try {
          const res = await fetch("/api/poems", {
            method: "POST",
            body: formData,
          });
          const result = await res.json();
          if (res.ok) {
            await get().fetchPoems(1, true); // Refresh poem list
            return { success: true };
          } else {
            return { success: false, message: result.message, errors: result.errors };
          }
        } catch {
          return { success: false, message: "An error occurred while creating poem" };
        }
      },

      updatePoem: async (slug: string, formData: FormData) => {
        try {
          const res = await fetch(`/api/poems/${slug}`, {
            method: "PUT",
            body: formData,
          });
          const result = await res.json();
          if (res.ok) {
            await get().fetchPoemBySlug(slug, true); // Refresh single poem
            await get().fetchPoems(1, true); // Refresh poem list
            return { success: true };
          } else {
            return { success: false, message: result.message, errors: result.errors };
          }
        } catch {
          return { success: false, message: "An error occurred while updating poem" };
        }
      },

      deletePoem: async (slug: string) => {
        try {
          const res = await fetch(`/api/poems/${slug}`, {
            method: "DELETE",
          });
          const result = await res.json();
          if (res.ok) {
            await get().fetchPoems(1, true); // Refresh poem list
            set({ singlePoem: null });
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        } catch {
          return { success: false, message: "An error occurred while deleting poem" };
        }
      },

      clearSinglePoem: () => {
        set({ singlePoem: null });
      },
    }),
    {
      name: "poem-storage",
      partialize: (state) => ({
        poems: state.poems,
        singlePoem: state.singlePoem,
        lastFetched: state.lastFetched,
        page: state.page,
        totalPages: state.totalPages,
      }),
    }
  )
);