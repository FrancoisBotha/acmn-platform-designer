import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  SelectionMode,
  type Node,
  type NodeChange,
  type EdgeChange,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { nanoid } from 'nanoid'
import { Routes, Route } from 'react-router-dom'
import Palette from '@/components/Palette'
import DefaultNode from '@/components/nodes/DefaultNode'
import AgentNode from '@/components/nodes/AgentNode'
import ToolNode from '@/components/nodes/ToolNode'
import GuardrailNode from '@/components/nodes/GuardrailNode'
import EvaluatorNode from '@/components/nodes/EvaluatorNode'
import HandoffNode from '@/components/nodes/HandoffNode'
import HumanTaskNode from '@/components/nodes/HumanTaskNode'
import ProcessTaskNode from '@/components/nodes/ProcessTaskNode'
import CasePlanModelNode from '@/components/nodes/CasePlanModelNode'
import StageNode from '@/components/nodes/StageNode'
import MilestoneNode from '@/components/nodes/MilestoneNode'
import SentryEntryNode from '@/components/nodes/SentryEntryNode'
import SentryExitNode from '@/components/nodes/SentryExitNode'
import DiscretionaryItemNode from '@/components/nodes/DiscretionaryItemNode'
import ConnectorNode from '@/components/nodes/ConnectorNode'
import AcmnWireEdge from '@/components/edges/AcmnWireEdge'
import { acmnElementTypeMap, nodeTypeMap } from '@/lib/acmnElementTypes'
import { useProjectStore } from '@/state/projectStore'
import { useCanvasStore } from '@/state/canvasStore'
import {
  AddElementCommand,
  RemoveElementCommand,
  MoveElementCommand,
  type MoveEntry,
} from '@/state/commands'
import { WelcomeScreen } from '@/features/welcome/WelcomeScreen'
import { TopBar } from '@/components/TopBar'
import { DirtyCheckDialog } from '@/components/DirtyCheckDialog'
import { SelectionBadge } from '@/components/SelectionBadge'
import { TestPlaceholder } from '@/features/test/TestPlaceholder'
import { PublishPlaceholder } from '@/features/publish/PublishPlaceholder'

const nodeTypes = {
  default: DefaultNode,
  agent: AgentNode,
  tool: ToolNode,
  guardrail: GuardrailNode,
  evaluator: EvaluatorNode,
  handoff: HandoffNode,
  'human-task': HumanTaskNode,
  'process-task': ProcessTaskNode,
  'case-plan-model': CasePlanModelNode,
  stage: StageNode,
  milestone: MilestoneNode,
  'sentry-entry': SentryEntryNode,
  'sentry-exit': SentryExitNode,
  'discretionary-item': DiscretionaryItemNode,
  connector: ConnectorNode,
}

const edgeTypes = {
  'acmn-wire': AcmnWireEdge,
}

const containerNodeTypes = new Set(['stage', 'case-plan-model'])

function DesignCanvas() {
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const applyNodesChange = useCanvasStore((s) => s.applyNodesChange)
  const applyEdgesChange = useCanvasStore((s) => s.applyEdgesChange)
  const pushCommand = useCanvasStore((s) => s.pushCommand)
  const undo = useCanvasStore((s) => s.undo)
  const redo = useCanvasStore((s) => s.redo)
  const clearSelection = useCanvasStore((s) => s.clearSelection)

  const reactFlowInstance = useRef<ReactFlowInstance | null>(null)
  const dragStartPositions = useRef<Map<string, { x: number; y: number }> | null>(null)

  const saveProject = useProjectStore((s) => s.saveProject)
  const saveProjectAs = useProjectStore((s) => s.saveProjectAs)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      const isModal = !!target.closest('[role="dialog"]')

      if (e.key === 's' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault()
        saveProjectAs().catch(() => {})
        return
      }
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        saveProject().catch(() => {})
        return
      }

      if (isInput || isModal) return

      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault()
        redo()
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        undo()
      } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        redo()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useCanvasStore.getState()
        const selectedNodeIds = state.nodes.filter((n) => n.selected).map((n) => n.id)
        const selectedEdgeIds = state.edges.filter((ed) => ed.selected).map((ed) => ed.id)
        if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) {
          e.preventDefault()
          pushCommand(new RemoveElementCommand(selectedNodeIds, selectedEdgeIds))
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, pushCommand, saveProject, saveProjectAs])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const safe = changes.filter((c) => c.type !== 'remove')
      if (safe.length > 0) applyNodesChange(safe)
    },
    [applyNodesChange],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const safe = changes.filter((c) => c.type !== 'remove')
      if (safe.length > 0) applyEdgesChange(safe)
    },
    [applyEdgesChange],
  )

  const onNodeDragStart = useCallback((_: React.MouseEvent, _node: Node, draggedNodes: Node[]) => {
    dragStartPositions.current = new Map(
      draggedNodes.map((n) => [n.id, { x: n.position.x, y: n.position.y }]),
    )
  }, [])

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, _node: Node, draggedNodes: Node[]) => {
      if (!dragStartPositions.current) return
      const moves: MoveEntry[] = []
      for (const n of draggedNodes) {
        const from = dragStartPositions.current.get(n.id)
        if (!from) continue
        if (from.x === n.position.x && from.y === n.position.y) continue
        moves.push({ id: n.id, from, to: { x: n.position.x, y: n.position.y } })
      }
      if (moves.length > 0) {
        pushCommand(new MoveElementCommand(moves))
      }
      dragStartPositions.current = null
    },
    [pushCommand],
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const elementTypeId = e.dataTransfer.getData('application/acmn-element-type')
      if (!elementTypeId || !reactFlowInstance.current) return

      const elementType = acmnElementTypeMap.get(elementTypeId)
      if (!elementType) return

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      })

      const resolvedType = nodeTypeMap[elementType.id] ?? 'default'

      const nodeData: Record<string, unknown> = {
        label: elementType.label,
        elementType: elementType.id,
      }

      if (elementType.connectorSubType) {
        nodeData.connectorSubType = elementType.connectorSubType
      }

      const newNode: Node = {
        id: nanoid(),
        type: resolvedType,
        position,
        data: nodeData,
      }

      const currentNodes = useCanvasStore.getState().nodes
      const parentCandidate = [...currentNodes].reverse().find((n) => {
        if (!containerNodeTypes.has(n.type ?? '')) return false
        const w =
          n.measured?.width ??
          (acmnElementTypeMap.get(n.data.elementType as string)?.defaultWidth ?? 0)
        const h =
          n.measured?.height ??
          (acmnElementTypeMap.get(n.data.elementType as string)?.defaultHeight ?? 0)
        return (
          position.x >= n.position.x &&
          position.x <= n.position.x + w &&
          position.y >= n.position.y &&
          position.y <= n.position.y + h
        )
      })

      if (parentCandidate && !containerNodeTypes.has(resolvedType)) {
        newNode.parentId = parentCandidate.id
        newNode.extent = 'parent'
        newNode.position = {
          x: position.x - parentCandidate.position.x,
          y: position.y - parentCandidate.position.y,
        }
      }

      pushCommand(new AddElementCommand(newNode))
    },
    [pushCommand],
  )

  return (
    <div className="flex flex-1 overflow-hidden">
      <Palette />

      <main className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          onInit={(instance) => {
            reactFlowInstance.current = instance
          }}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode={null}
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode="Control"
          panOnDrag={[1, 2]}
          panOnScroll
          fitView
        >
          <Background variant={BackgroundVariant.Dots} />
          <Controls />
          <MiniMap position="bottom-right" />
          <SelectionBadge />
        </ReactFlow>
      </main>

      <aside className="w-72 shrink-0 border-l border-border bg-muted/40 p-4">
        <h2 className="mb-3 text-sm font-semibold tracking-tight">Properties</h2>
        <p className="text-xs text-muted-foreground">Select a node to view its properties</p>
      </aside>
    </div>
  )
}

function ProjectShell() {
  const [showDirtyDialog, setShowDirtyDialog] = useState(false)

  const saveProject = useProjectStore((s) => s.saveProject)
  const dirty = useProjectStore((s) => s.dirty)
  const clearProject = useProjectStore((s) => s.clearProject)
  const currentProject = useProjectStore((s) => s.currentProject)
  const activeCpmFile = useProjectStore((s) => s.activeCpmFile)

  useEffect(() => {
    if (!currentProject) return
    const cpmPart = activeCpmFile ? ` · ${activeCpmFile}` : ''
    const dirtyPart = dirty ? ' — modified' : ''
    const title = `ACMN Designer — ${currentProject.name}${cpmPart}${dirtyPart}`
    window.acmn.window.setTitle(title)
  }, [currentProject, activeCpmFile, dirty])

  const handleCloseRequest = useCallback(() => {
    if (dirty) {
      setShowDirtyDialog(true)
    } else {
      clearProject()
      window.acmn.window.setTitle('ACMN Designer')
    }
  }, [dirty, clearProject])

  const handleDirtySave = useCallback(async () => {
    try {
      await saveProject()
      setShowDirtyDialog(false)
      clearProject()
      window.acmn.window.setTitle('ACMN Designer')
    } catch {
      setShowDirtyDialog(false)
    }
  }, [saveProject, clearProject])

  const handleDirtyDiscard = useCallback(() => {
    setShowDirtyDialog(false)
    clearProject()
    window.acmn.window.setTitle('ACMN Designer')
  }, [clearProject])

  const handleDirtyCancel = useCallback(() => {
    setShowDirtyDialog(false)
  }, [])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
      <TopBar onClose={handleCloseRequest} />

      <Routes>
        <Route path="/" element={<DesignCanvas />} />
        <Route path="/test" element={<TestPlaceholder />} />
        <Route path="/test/:scenarioId" element={<TestPlaceholder />} />
        <Route path="/publish" element={<PublishPlaceholder />} />
      </Routes>

      {showDirtyDialog && (
        <DirtyCheckDialog
          onSave={handleDirtySave}
          onDiscard={handleDirtyDiscard}
          onCancel={handleDirtyCancel}
        />
      )}
    </div>
  )
}

export default function App() {
  const currentProject = useProjectStore((s) => s.currentProject)

  if (!currentProject) {
    return <WelcomeScreen />
  }

  return <ProjectShell />
}
