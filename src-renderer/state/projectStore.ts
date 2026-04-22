import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Project, RecentProject } from '@/contracts/backend'
import { useCanvasStore } from './canvasStore'

export interface ProjectState {
  currentProject: Project | null
  dirty: boolean
  activeCpmId: string | null
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
  setActiveCpm: (id: string) => void
  createCpm: (name: string) => Promise<void>
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
  activeCpmId: null,
  activeCpmFile: null,
  recentProjects: [],
  loading: false,
  error: null,

  setCurrentProject: (project) =>
    set({
      currentProject: project,
      error: null,
      activeCpmId: project?.casePlanModels?.[0]?.id ?? null,
      activeCpmFile: project?.casePlanModels?.[0]?.file ?? null,
    }),
  setDirty: (dirty) => set({ dirty }),
  setRecentProjects: (projects) => set({ recentProjects: projects }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearProject: () =>
    set({ currentProject: null, dirty: false, activeCpmId: null, activeCpmFile: null }),

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
        activeCpmId: newProject?.casePlanModels?.[0]?.id ?? null,
        activeCpmFile: newProject?.casePlanModels?.[0]?.file ?? null,
      })
    } catch (err) {
      set({ error: formatSaveError(err), loading: false })
      throw err
    }
  },

  setActiveCpm: (id) => {
    const project = get().currentProject
    if (!project) return
    const ref = project.casePlanModels.find((cpm) => cpm.id === id)
    if (!ref) return
    useCanvasStore.getState().clearSelection()
    set({ activeCpmId: ref.id, activeCpmFile: ref.file })
  },

  createCpm: async (name) => {
    const project = get().currentProject
    if (!project) return
    const id = nanoid()
    const file = `case-plan-models/${name.toLowerCase().replace(/\s+/g, '-')}.json`
    const updatedProject: Project = {
      ...project,
      casePlanModels: [...project.casePlanModels, { id, file }],
      modified: new Date().toISOString(),
    }
    useCanvasStore.getState().clearSelection()
    set({
      currentProject: updatedProject,
      activeCpmId: id,
      activeCpmFile: file,
      dirty: true,
    })
    try {
      await window.acmn.project.save(updatedProject)
      set({ dirty: false })
    } catch (err) {
      set({ error: formatSaveError(err) })
    }
  },
}))
