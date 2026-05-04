import { create } from 'zustand';
import type { WorkshopIndex, WorkshopItem } from '../ipc/workshopIpc';
import { workshopFetchIndex } from '../ipc/workshopIpc';

interface WorkshopState {
  /** Cached workshop index */
  index: WorkshopIndex | null;
  /** Whether we are currently fetching the index */
  loading: boolean;
  /** Last error message, if any */
  error: string | null;
  /** Timestamp (ms) of last successful fetch */
  lastFetched: number;
  /** Current search query */
  searchQuery: string;
  /** Current type filter ('' = all) */
  typeFilter: string;

  fetchIndex: (url?: string, force?: boolean) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setTypeFilter: (filter: string) => void;
  /** Filtered items based on searchQuery and typeFilter */
  filteredItems: () => WorkshopItem[];
}

export const useWorkshopStore = create<WorkshopState>((set, get) => ({
  index: null,
  loading: false,
  error: null,
  lastFetched: 0,
  searchQuery: '',
  typeFilter: '',

  fetchIndex: async (url, force) => {
    const now = Date.now();
    if (!force && get().index && now - get().lastFetched < 5 * 60 * 1000 && !url) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const index = await workshopFetchIndex(url);
      set({ index, loading: false, lastFetched: Date.now() });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setTypeFilter: (filter) => set({ typeFilter: filter }),

  filteredItems: () => {
    const { index, searchQuery, typeFilter } = get();
    if (!index) return [];
    let items = index.items;
    if (typeFilter) {
      items = items.filter((item) => item.type === typeFilter);
    }
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(lower) ||
          item.description.toLowerCase().includes(lower) ||
          item.tags.some((t) => t.toLowerCase().includes(lower)) ||
          item.author.toLowerCase().includes(lower),
      );
    }
    return items;
  },
}));
