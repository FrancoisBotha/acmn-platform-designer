import { useCallback, useRef } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { nanoid } from 'nanoid'
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
import { WelcomeScreen } from '@/features/welcome/WelcomeScreen'

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

function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, , onEdgesChange] = useEdgesState<Edge>([])
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null)

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const containerNodeTypes = new Set(['stage', 'case-plan-model'])

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

      setNodes((nds) => {
        const parentCandidate = [...nds]
          .reverse()
          .find((n) => {
            if (!containerNodeTypes.has(n.type ?? '')) return false
            const w = n.measured?.width ?? (acmnElementTypeMap.get(n.data.elementType as string)?.defaultWidth ?? 0)
            const h = n.measured?.height ?? (acmnElementTypeMap.get(n.data.elementType as string)?.defaultHeight ?? 0)
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

        return [...nds, newNode]
      })
    },
    [setNodes],
  )

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Palette />

      <main className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={(instance) => { reactFlowInstance.current = instance }}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode={['Delete', 'Backspace']}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} />
          <Controls />
          <MiniMap position="bottom-right" />
        </ReactFlow>
      </main>

      <aside className="w-72 shrink-0 border-l border-border bg-muted/40 p-4">
        <h2 className="mb-3 text-sm font-semibold tracking-tight">
          Properties
        </h2>
        <p className="text-xs text-muted-foreground">
          Select a node to view its properties
        </p>
      </aside>
    </div>
  )
}

export default function App() {
  const currentProject = useProjectStore((s) => s.currentProject)

  if (!currentProject) {
    return <WelcomeScreen />
  }

  return <Canvas />
}
