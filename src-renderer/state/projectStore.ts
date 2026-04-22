import { create } from 'zustand'
import type { Project, RecentProject } from '@/contracts/backend'

export interface ProjectState {
  currentProject: Project | null
  dirty: boolean
  recentProjects: RecentProject[]
  loading: boolean
  error: string | null

  setCurrentProject: (project: Project | null) => void
  setDirty: (dirty: boolean) => void
  setRecentProjects: (projects: RecentProject[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearProject: () => void
}

export const useProjectStore = create<ProjectState>()((set) => ({
  currentProject: null,
  dirty: false,
  recentProjects: [],
  loading: false,
  error: null,

  setCurrentProject: (project) => set({ currentProject: project, error: null }),
  setDirty: (dirty) => set({ dirty }),
  setRecentProjects: (projects) => set({ recentProjects: projects }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearProject: () => set({ currentProject: null, dirty: false }),
}))
