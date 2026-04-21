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

const sampleNodes: Node[] = [
  { id: 'sample-agent-1', type: 'agent', position: { x: 50, y: 0 }, data: { label: 'Agent', elementType: 'agent' } },
  { id: 'sample-tool-1', type: 'tool', position: { x: 50, y: 150 }, data: { label: 'Tool', elementType: 'tool' } },
  { id: 'sample-guardrail-1', type: 'guardrail', position: { x: 350, y: 0 }, data: { label: 'Guardrail', elementType: 'guardrail' } },
  { id: 'sample-evaluator-1', type: 'evaluator', position: { x: 350, y: 150 }, data: { label: 'Evaluator', elementType: 'evaluator' } },
  { id: 'sample-handoff-1', type: 'handoff', position: { x: 650, y: 0 }, data: { label: 'Handoff', elementType: 'handoff' } },
  { id: 'sample-human-task-1', type: 'human-task', position: { x: 650, y: 150 }, data: { label: 'Human Task', elementType: 'human-task' } },
  { id: 'sample-process-task-1', type: 'process-task', position: { x: 950, y: 0 }, data: { label: 'Process Task', elementType: 'process-task' } },
  { id: 'sample-agent-2', type: 'agent', position: { x: 950, y: 150 }, data: { label: 'Agent B', elementType: 'agent' } },
  { id: 'sample-connector-1', type: 'connector', position: { x: 1250, y: 0 }, data: { label: 'Event Connector', elementType: 'connector-event', connectorSubType: 'event' } },
  { id: 'sample-tool-2', type: 'tool', position: { x: 1250, y: 150 }, data: { label: 'Tool B', elementType: 'tool' } },
]

const sampleEdges: Edge[] = [
  { id: 'wire-data', type: 'acmn-wire', source: 'sample-agent-1', target: 'sample-tool-1', data: { wireType: 'data' as const } },
  { id: 'wire-confidence-gated', type: 'acmn-wire', source: 'sample-guardrail-1', target: 'sample-evaluator-1', data: { wireType: 'confidence-gated' as const } },
  { id: 'wire-escalation', type: 'acmn-wire', source: 'sample-handoff-1', target: 'sample-human-task-1', data: { wireType: 'escalation' as const } },
  { id: 'wire-event', type: 'acmn-wire', source: 'sample-process-task-1', target: 'sample-agent-2', data: { wireType: 'event' as const } },
  { id: 'wire-case-file', type: 'acmn-wire', source: 'sample-connector-1', target: 'sample-tool-2', data: { wireType: 'case-file' as const } },
]

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(sampleNodes)
  const [edges, , onEdgesChange] = useEdgesState(sampleEdges)
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
