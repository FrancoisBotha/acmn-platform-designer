import { create } from 'zustand'
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react'
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import type { CanvasCommand, CanvasData } from './commands'

const MAX_HISTORY = 100

export interface CanvasState {
  nodes: Node[]
  edges: Edge[]
  undoStack: CanvasCommand[]
  redoStack: CanvasCommand[]

  applyNodesChange: (changes: NodeChange[]) => void
  applyEdgesChange: (changes: EdgeChange[]) => void
  pushCommand: (cmd: CanvasCommand) => void
  undo: () => void
  redo: () => void
  clearSelection: () => void
}

export const useCanvasStore = create<CanvasState>()((set, get) => ({
  nodes: [],
  edges: [],
  undoStack: [],
  redoStack: [],

  applyNodesChange: (changes) => {
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) }))
  },

  applyEdgesChange: (changes) => {
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) }))
  },

  pushCommand: (cmd) => {
    const state = get()
    const data: CanvasData = { nodes: state.nodes, edges: state.edges }
    const next = cmd.apply(data)
    const undoStack = [...state.undoStack, cmd]
    if (undoStack.length > MAX_HISTORY) undoStack.shift()
    set({ nodes: next.nodes, edges: next.edges, undoStack, redoStack: [] })
  },

  undo: () => {
    const state = get()
    if (state.undoStack.length === 0) return
    const cmd = state.undoStack[state.undoStack.length - 1]
    const data: CanvasData = { nodes: state.nodes, edges: state.edges }
    const prev = cmd.undo(data)
    const redoStack = [...state.redoStack, cmd]
    if (redoStack.length > MAX_HISTORY) redoStack.shift()
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      undoStack: state.undoStack.slice(0, -1),
      redoStack,
    })
  },

  redo: () => {
    const state = get()
    if (state.redoStack.length === 0) return
    const cmd = state.redoStack[state.redoStack.length - 1]
    const data: CanvasData = { nodes: state.nodes, edges: state.edges }
    const next = cmd.apply(data)
    const undoStack = [...state.undoStack, cmd]
    if (undoStack.length > MAX_HISTORY) undoStack.shift()
    set({
      nodes: next.nodes,
      edges: next.edges,
      redoStack: state.redoStack.slice(0, -1),
      undoStack,
    })
  },

  clearSelection: () => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
      edges: state.edges.map((e) => (e.selected ? { ...e, selected: false } : e)),
    }))
  },
}))
