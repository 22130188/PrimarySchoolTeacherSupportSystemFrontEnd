import { create } from 'zustand';



export const useAdminStore = create((set) => ({
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  mobileSidebarOpen: false,
  setMobileSidebarOpen: (v) => set({ mobileSidebarOpen: v }),
  toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
}));
