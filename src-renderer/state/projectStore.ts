import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Project, RecentProject } from '@/contracts/backend'
import { useCanvasStore } from './canvasStore'

const DEFAULT_AUTO_SAVE_INTERVAL = 30_000

let _autoSaveTimerId: ReturnType<typeof setTimeout> | null = null

function clearAutoSaveTimer(): void {
  if (_autoSaveTimerId !== null) {
    clearTimeout(_autoSaveTimerId)
    _autoSaveTimerId = null
  }
}

function armAutoSaveTimer(fire: () => void, interval: number): void {
  clearAutoSaveTimer()
  _autoSaveTimerId = setTimeout(fire, interval)
}

export interface MigrationToastInfo {
  fromVersion: string
  toVersion: string
  backupPath: string
}

export interface ProjectState {
  currentProject: Project | null
  dirty: boolean
  activeCpmId: string | null
  activeCpmFile: string | null
  recentProjects: RecentProject[]
  loading: boolean
  error: string | null
  pendingMigrationToast: MigrationToastInfo | null
  autoSaveEnabled: boolean
  autoSaveInterval: number
  lastSavedAt: number | null

  setCurrentProject: (project: Project | null) => void
  setDirty: (dirty: boolean) => void
  setRecentProjects: (projects: RecentProject[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setPendingMigrationToast: (info: MigrationToastInfo | null) => void
  clearProject: () => void
  saveProject: () => Promise<void>
  saveProjectAs: () => Promise<void>
  setActiveCpm: (id: string) => void
  createCpm: (name: string) => Promise<void>
  flushAutoSave: () => Promise<void>
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

export const useProjectStore = create<ProjectState>()((set, get) => {
  function fireAutoSave(): void {
    const state = get()
    if (!state.dirty || !state.currentProject || !state.autoSaveEnabled) return
    state.saveProject().catch(() => {})
  }

  return {
    currentProject: null,
    dirty: false,
    activeCpmId: null,
    activeCpmFile: null,
    recentProjects: [],
    loading: false,
    error: null,
    pendingMigrationToast: null,
    autoSaveEnabled: true,
    autoSaveInterval: DEFAULT_AUTO_SAVE_INTERVAL,
    lastSavedAt: null,

    setCurrentProject: (project) =>
      set({
        currentProject: project,
        error: null,
        activeCpmId: project?.casePlanModels?.[0]?.id ?? null,
        activeCpmFile: project?.casePlanModels?.[0]?.file ?? null,
      }),

    setDirty: (dirty) => {
      set({ dirty })

      if (dirty && get().autoSaveEnabled) {
        armAutoSaveTimer(fireAutoSave, get().autoSaveInterval)
      } else if (!dirty) {
        clearAutoSaveTimer()
      }
    },

    setRecentProjects: (projects) => set({ recentProjects: projects }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setPendingMigrationToast: (info) => set({ pendingMigrationToast: info }),

    clearProject: () => {
      clearAutoSaveTimer()
      set({
        currentProject: null,
        dirty: false,
        activeCpmId: null,
        activeCpmFile: null,
        pendingMigrationToast: null,
        lastSavedAt: null,
      })
    },

    saveProject: async () => {
      clearAutoSaveTimer()
      const project = get().currentProject
      if (!project) return
      set({ loading: true, error: null })
      try {
        await window.acmn.project.save(project)
        set({ dirty: false, loading: false, lastSavedAt: Date.now() })
      } catch (err) {
        set({ error: formatSaveError(err), loading: false })
        throw err
      }
    },

    saveProjectAs: async () => {
      clearAutoSaveTimer()
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
          lastSavedAt: Date.now(),
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
        set({ dirty: false, lastSavedAt: Date.now() })
      } catch (err) {
        set({ error: formatSaveError(err) })
      }
    },

    flushAutoSave: async () => {
      clearAutoSaveTimer()
      const state = get()
      if (state.dirty && state.currentProject) {
        await state.saveProject()
      }
    },
  }
})
