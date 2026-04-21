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
}

const noop = () => {}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, , onEdgesChange] = useEdgesState([])
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null)

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

      const newNode: Node = {
        id: nanoid(),
        type: resolvedType,
        position,
        data: {
          label: elementType.label,
          elementType: elementType.id,
        },
      }

      setNodes((nds) => [...nds, newNode])
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
          onConnect={noop}
          onInit={(instance) => { reactFlowInstance.current = instance }}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
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
