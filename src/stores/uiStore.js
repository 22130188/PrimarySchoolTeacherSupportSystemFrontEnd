import { create } from 'zustand';

/**
 * uiStore — quản lý các trạng thái UI toàn cục
 */
export const useUIStore = create((set) => ({

  isMobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  activeToolCategory: 'ai',
  setActiveToolCategory: (category) => set({ activeToolCategory: category }),

  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));
