import { create } from 'zustand'
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react'
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import { nanoid } from 'nanoid'
import type { CanvasCommand, CanvasData } from './commands'
import { RemoveElementCommand, PasteElementsCommand } from './commands'
import type { PortDirection, PortType } from '../lib/acmnElementTypes'
import { acmnElementTypeMap } from '../lib/acmnElementTypes'
import type { PortInfo, ConnectionEndpoint } from '../lib/portCompatibility'
import { canConnect as canConnectPure } from '../lib/portCompatibility'

const MAX_HISTORY = 100

export interface ClipboardData {
  nodes: Node[]
  edges: Edge[]
  anchorX: number
  anchorY: number
}

export interface CanvasState {
  nodes: Node[]
  edges: Edge[]
  undoStack: CanvasCommand[]
  redoStack: CanvasCommand[]
  clipboard: ClipboardData | null
  clipboardPasteCount: number

  applyNodesChange: (changes: NodeChange[]) => void
  applyEdgesChange: (changes: EdgeChange[]) => void
  pushCommand: (cmd: CanvasCommand) => void
  undo: () => void
  redo: () => void
  clearSelection: () => void
  copySelection: () => void
  cutSelection: () => void
  pasteClipboard: (viewportCenter: { x: number; y: number }) => void
  clearClipboard: () => void
}

export const useCanvasStore = create<CanvasState>()((set, get) => ({
  nodes: [],
  edges: [],
  undoStack: [],
  redoStack: [],
  clipboard: null,
  clipboardPasteCount: 0,

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

  copySelection: () => {
    const { nodes, edges } = get()
    const selectedNodes = nodes.filter((n) => n.selected)
    if (selectedNodes.length === 0) return

    const selectedIds = new Set(selectedNodes.map((n) => n.id))
    const internalEdges = edges.filter(
      (e) => selectedIds.has(e.source) && selectedIds.has(e.target),
    )

    const cx = selectedNodes.reduce((sum, n) => sum + n.position.x, 0) / selectedNodes.length
    const cy = selectedNodes.reduce((sum, n) => sum + n.position.y, 0) / selectedNodes.length

    const clonedNodes = selectedNodes.map((n) => {
      const { measured, dragging, resizing, selected, ...rest } = n as Node & {
        dragging?: boolean
        resizing?: boolean
      }
      return { ...rest }
    })

    const clonedEdges = internalEdges.map((e) => {
      const { selected, ...rest } = e
      return { ...rest }
    })

    set({
      clipboard: { nodes: clonedNodes, edges: clonedEdges, anchorX: cx, anchorY: cy },
      clipboardPasteCount: 0,
    })
  },

  cutSelection: () => {
    const state = get()
    const selectedNodes = state.nodes.filter((n) => n.selected)
    if (selectedNodes.length === 0) return

    state.copySelection()

    const selectedNodeIds = selectedNodes.map((n) => n.id)
    const selectedEdgeIds = state.edges.filter((e) => e.selected).map((e) => e.id)
    state.pushCommand(new RemoveElementCommand(selectedNodeIds, selectedEdgeIds))
  },

  pasteClipboard: (viewportCenter) => {
    const { clipboard, clipboardPasteCount } = get()
    if (!clipboard || clipboard.nodes.length === 0) return

    const offset = clipboardPasteCount * 16
    const targetX = viewportCenter.x + offset
    const targetY = viewportCenter.y + offset

    const idMap = new Map<string, string>()
    for (const node of clipboard.nodes) {
      idMap.set(node.id, nanoid())
    }

    const newNodes: Node[] = clipboard.nodes.map((n) => ({
      ...n,
      id: idMap.get(n.id)!,
      position: {
        x: n.position.x - clipboard.anchorX + targetX,
        y: n.position.y - clipboard.anchorY + targetY,
      },
      selected: false,
      parentId: n.parentId && idMap.has(n.parentId) ? idMap.get(n.parentId) : undefined,
      extent: n.parentId && idMap.has(n.parentId) ? n.extent : undefined,
    }))

    const newEdges: Edge[] = clipboard.edges
      .filter((e) => idMap.has(e.source) && idMap.has(e.target))
      .map((e) => ({
        ...e,
        id: nanoid(),
        source: idMap.get(e.source)!,
        target: idMap.get(e.target)!,
        selected: false,
      }))

    get().pushCommand(new PasteElementsCommand(newNodes, newEdges))
    set({ clipboardPasteCount: clipboardPasteCount + 1 })
  },

  clearClipboard: () => {
    set({ clipboard: null, clipboardPasteCount: 0 })
  },
}))

export function lookupPort(nodeId: string, handleId: string): PortInfo | undefined {
  const { nodes } = useCanvasStore.getState()
  const node = nodes.find((n) => n.id === nodeId)
  if (!node) return undefined

  const elementType = acmnElementTypeMap.get(node.type ?? '')
  if (!elementType) return undefined

  const port = elementType.ports.find((p) => p.id === handleId)
  if (!port) return undefined

  return { portType: port.portType, direction: port.direction }
}

export function canConnect(source: ConnectionEndpoint, target: ConnectionEndpoint): boolean {
  return canConnectPure(source, target, lookupPort)
}

export type { PortInfo, ConnectionEndpoint, PortType, PortDirection }
