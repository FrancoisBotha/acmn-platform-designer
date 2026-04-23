import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Edge } from '@xyflow/react'
import type { Project, RecentProject, CasePlanModelEdge, AcmnWireType, BufferingStrategy } from '@/contracts/backend'
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
  loadActiveCpm: () => Promise<void>
  saveActiveCpm: () => Promise<void>
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
        await get().saveActiveCpm()
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

    loadActiveCpm: async () => {
      const { currentProject, activeCpmFile } = get()
      if (!currentProject || !activeCpmFile) return
      try {
        const cpm = await window.acmn.cpm.load(currentProject.path, activeCpmFile)
        const canvas = useCanvasStore.getState()
        const rfEdges: Edge[] = (cpm.edges ?? []).map((e: CasePlanModelEdge) => ({
          id: e.id,
          source: e.source,
          sourceHandle: e.sourceHandle ?? null,
          target: e.target,
          targetHandle: e.targetHandle ?? null,
          type: e.wireType ?? 'data',
          data: {
            wireType: e.wireType ?? 'data',
            buffering: e.buffering ?? 'immediate',
            ...(e.transform != null ? { transform: e.transform } : {}),
            ...(e.confidenceThreshold != null ? { confidenceThreshold: e.confidenceThreshold } : {}),
          },
        }))
        canvas.applyNodesChange(
          cpm.nodes.map((n) => ({ type: 'add' as const, item: { id: n.id, type: n.type, position: n.position, data: { label: n.label, ...n.properties, elementType: n.type }, parentId: n.parentId } }))
        )
        canvas.applyEdgesChange(
          rfEdges.map((e) => ({ type: 'add' as const, item: e }))
        )
        canvas.setCaseVariables(Array.isArray(cpm.caseVariables) ? cpm.caseVariables as never : [])
      } catch {
        // File may not exist yet for a newly created CPM
      }
    },

    saveActiveCpm: async () => {
      const { currentProject, activeCpmId, activeCpmFile } = get()
      if (!currentProject || !activeCpmId || !activeCpmFile) return
      const { nodes, edges, caseVariables } = useCanvasStore.getState()
      const cpmEdges: CasePlanModelEdge[] = edges.map((e: Edge) => {
        const d = (e.data ?? {}) as Record<string, unknown>
        const edge: CasePlanModelEdge = {
          id: e.id,
          source: e.source,
          sourceHandle: e.sourceHandle ?? undefined,
          target: e.target,
          targetHandle: e.targetHandle ?? undefined,
          wireType: ((d.wireType as string) ?? e.type ?? 'data') as AcmnWireType,
          buffering: ((d.buffering as string) ?? 'immediate') as BufferingStrategy,
        }
        if (d.transform != null) edge.transform = String(d.transform)
        if (typeof d.confidenceThreshold === 'number') edge.confidenceThreshold = d.confidenceThreshold
        return edge
      })
      const cpm = {
        id: activeCpmId,
        name: currentProject.casePlanModels.find((c) => c.id === activeCpmId)?.file?.replace(/.*\//, '').replace(/\.json$/, '') ?? activeCpmId,
        version: '1',
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type ?? '',
          label: String((n.data as Record<string, unknown>).label ?? ''),
          position: n.position,
          parentId: n.parentId,
          properties: { ...(n.data as Record<string, unknown>) },
        })),
        edges: cpmEdges,
        stages: [],
        milestones: [],
        sentries: [],
        caseVariables: caseVariables,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        file: activeCpmFile,
      }
      await window.acmn.cpm.save(currentProject.path, cpm as never)
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
