import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UiState {
  sidebarCollapsed: boolean
  hasHydrated: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  _setHasHydrated: (value: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      hasHydrated: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      _setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'mirko-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
      // Avoid SSR/CSR mismatch: render expanded until the persisted value loads.
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true)
      },
    },
  ),
)
