import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem('circuit-forge-theme') || 'dark') as Theme,
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('circuit-forge-theme', next);
    return { theme: next };
  }),
  setTheme: (theme: Theme) => {
    localStorage.setItem('circuit-forge-theme', theme);
    set({ theme });
  },
}));
