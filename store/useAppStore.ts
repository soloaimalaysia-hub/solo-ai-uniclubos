'use client'

import { create } from 'zustand'

export interface UcoUser {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string | null
  platform_role?: string | null
  club_id?: string | null
}

interface AppStore {
  user: UcoUser | null
  setUser: (user: UcoUser | null) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
