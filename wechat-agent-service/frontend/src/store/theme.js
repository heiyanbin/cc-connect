import { create } from 'zustand';

function resolveTheme(theme) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function applyTheme(resolved) {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export const useThemeStore = create((set) => ({
  theme: 'light',
  resolved: 'light',
  setTheme: (theme) => {
    const resolved = resolveTheme(theme);
    localStorage.setItem('cc_theme', theme);
    applyTheme(resolved);
    set({ theme, resolved });
  },
  init: () => {
    const saved = localStorage.getItem('cc_theme') || 'light';
    const resolved = resolveTheme(saved);
    applyTheme(resolved);
    set({ theme: saved, resolved });
  },
}));