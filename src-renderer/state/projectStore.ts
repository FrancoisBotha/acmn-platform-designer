import { create } from 'zustand'
import type { Project, RecentProject } from '@/contracts/backend'

export interface ProjectState {
  currentProject: Project | null
  dirty: boolean
  activeCpmFile: string | null
  recentProjects: RecentProject[]
  loading: boolean
  error: string | null

  setCurrentProject: (project: Project | null) => void
  setDirty: (dirty: boolean) => void
  setRecentProjects: (projects: RecentProject[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearProject: () => void
  saveProject: () => Promise<void>
  saveProjectAs: () => Promise<void>
}

function formatSaveError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message
    if (msg.includes('EACCES') || msg.includes('EPERM')) {
      return 'Could not write to location (permission denied). Try saving to a different folder.'
    }
  }
  return 'Could not save project. Please try again.'
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  currentProject: null,
  dirty: false,
  activeCpmFile: null,
  recentProjects: [],
  loading: false,
  error: null,

  setCurrentProject: (project) =>
    set({
      currentProject: project,
      error: null,
      activeCpmFile: project?.casePlanModels?.[0]?.file ?? null,
    }),
  setDirty: (dirty) => set({ dirty }),
  setRecentProjects: (projects) => set({ recentProjects: projects }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearProject: () => set({ currentProject: null, dirty: false, activeCpmFile: null }),

  saveProject: async () => {
    const project = get().currentProject
    if (!project) return
    set({ loading: true, error: null })
    try {
      await window.acmn.project.save(project)
      set({ dirty: false, loading: false })
    } catch (err) {
      set({ error: formatSaveError(err), loading: false })
      throw err
    }
  },

  saveProjectAs: async () => {
    const project = get().currentProject
    if (!project) return
    const newPath = await window.acmn.dialog.saveFolder()
    if (!newPath) return
    set({ loading: true, error: null })
    try {
      const newProject = await window.acmn.project.saveAs(project, newPath)
      set({
        currentProject: newProject,
        dirty: false,
        loading: false,
        activeCpmFile: newProject?.casePlanModels?.[0]?.file ?? null,
      })
    } catch (err) {
      set({ error: formatSaveError(err), loading: false })
      throw err
    }
  },
}))
