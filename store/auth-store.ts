import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { AuthenticatedUser, TenantRead, TenantUserRole, UserRead } from '@/lib/api/auth'

interface SessionData {
  user: UserRead
  tenant: TenantRead
  role: TenantUserRole
  is_platform_operator: boolean
}

interface AuthState {
  token: string | null
  user: UserRead | null
  tenant: TenantRead | null
  role: TenantUserRole | null
  is_platform_operator: boolean
  hasHydrated: boolean
  setToken: (token: string) => void
  setSession: (session: SessionData | AuthenticatedUser) => void
  clear: () => void
  _setHasHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      tenant: null,
      role: null,
      is_platform_operator: false,
      hasHydrated: false,
      setToken: (token) => set({ token }),
      setSession: (session) =>
        set({
          user: session.user,
          tenant: session.tenant,
          role: session.role,
          is_platform_operator: session.is_platform_operator,
        }),
      clear: () => set({ token: null, user: null, tenant: null, role: null, is_platform_operator: false }),
      _setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'mirko-auth',
      storage: createJSONStorage(() => localStorage),
      // Sólo persistimos el token; user/tenant/role se re-obtienen vía /auth/me al hidratar.
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true)
      },
    },
  ),
)
