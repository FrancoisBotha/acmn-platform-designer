import { useCallback, useEffect, useRef, useState } from 'react'
import type { Node } from '@xyflow/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCanvasStore } from '@/state/canvasStore'
import { useProjectStore } from '@/state/projectStore'
import { acmnElementTypeMap } from '@/lib/acmnElementTypes'
import { FieldLabel } from './HelpTooltip'
import { WireProperties } from './WireProperties'
import { AgentProperties } from './AgentProperties'
import { ToolProperties } from './ToolProperties'
import { GuardrailProperties } from './GuardrailProperties'
import { EvaluatorProperties } from './EvaluatorProperties'
import { StageProperties } from './StageProperties'
import { MilestoneProperties } from './MilestoneProperties'
import { HumanTaskProperties } from './HumanTaskProperties'
import { DomainContextProperties } from './DomainContextProperties'
import { ConnectorProperties } from './ConnectorProperties'

const DEFAULT_WIDTH = 400
const MIN_WIDTH = 200
const MAX_WIDTH = 800
const RAIL_WIDTH = 32
const STORAGE_KEY = 'propertyPanelWidth'
const COLLAPSED_KEY = 'propertyPanelCollapsed'

function readPersistedWidth(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const n = parseInt(raw, 10)
      if (n >= MIN_WIDTH && n <= MAX_WIDTH) return n
    }
  } catch {}
  return DEFAULT_WIDTH
}

function persistWidth(w: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(w))
  } catch {}
}

function readPersistedCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true'
  } catch {}
  return false
}

function persistCollapsed(v: boolean): void {
  try {
    localStorage.setItem(COLLAPSED_KEY, String(v))
  } catch {}
}

function useSelection() {
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const selectedNodes = nodes.filter((n) => n.selected)
  const selectedEdges = edges.filter((e) => e.selected)
  return { selectedNodes, selectedEdges, allNodes: nodes, allEdges: edges }
}

function CaseVariablesDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[400px] rounded-lg border border-border bg-background p-6 shadow-lg">
        <h3 className="text-sm font-semibold mb-2">Case Variables</h3>
        <p className="text-xs text-muted-foreground mb-4">
          The case variables editor will be available in a future release
          (epic_CASE_VARIABLES_AND_SENTRIES_06).
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function CpmProperties() {
  const currentProject = useProjectStore((s) => s.currentProject)
  const activeCpmId = useProjectStore((s) => s.activeCpmId)
  const [caseVarsOpen, setCaseVarsOpen] = useState(false)

  const cpmRef = currentProject?.casePlanModels?.find((c) => c.id === activeCpmId)
  const cpmName = cpmRef?.file?.replace(/.*\//, '').replace(/\.json$/, '') ?? 'Untitled'

  const domainContexts = currentProject?.domainContexts ?? []
  const domainBinding = domainContexts.length > 0
    ? domainContexts[0].file?.replace(/.*\//, '').replace(/\.json$/, '') ?? 'None'
    : 'None'

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel label="Case Name" tooltip="The name of this case plan model" />
        <input
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={cpmName}
          readOnly
        />
      </div>
      <div>
        <FieldLabel label="Version Label" tooltip="The current version identifier for this case plan model" />
        <input
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value="1"
          readOnly
        />
      </div>
      <div>
        <FieldLabel label="Description" tooltip="A brief description of the purpose and scope of this case plan" />
        <textarea
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm resize-y min-h-[60px]"
          placeholder="No description"
          readOnly
        />
      </div>
      <div>
        <FieldLabel label="Domain Context Binding" tooltip="The domain context linked to this case plan model" />
        <input
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={domainBinding}
          readOnly
        />
      </div>
      <div>
        <button
          type="button"
          className="w-full rounded border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent/50"
          onClick={() => setCaseVarsOpen(true)}
        >
          Case variables&hellip;
        </button>
      </div>
      <CaseVariablesDialog open={caseVarsOpen} onClose={() => setCaseVarsOpen(false)} />
    </div>
  )
}

function MultiSelectHint({ count }: { count: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
      <p className="text-sm font-medium">{count} elements selected</p>
      <p className="text-xs">Select a single element to edit properties.</p>
    </div>
  )
}

function ElementHeader({
  node,
  onNameChange,
}: {
  node: Node
  onNameChange: (name: string) => void
}) {
  const data = node.data as Record<string, unknown>
  const elementTypeId = (data.elementType as string) ?? node.type ?? ''
  const elementType = acmnElementTypeMap.get(elementTypeId)
  const Icon = elementType?.icon
  const label = String(data.label ?? elementType?.label ?? 'Element')
  const typeBadge = elementType?.label ?? elementTypeId

  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />}
      <input
        className="flex-1 min-w-0 rounded border border-transparent hover:border-border focus:border-ring bg-transparent px-1 py-0.5 text-sm font-semibold outline-none"
        value={label}
        onChange={(e) => onNameChange(e.target.value)}
      />
      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        {typeBadge}
      </span>
    </div>
  )
}

function getElementTypeId(node: Node): string {
  const data = node.data as Record<string, unknown>
  return (data.elementType as string) ?? node.type ?? ''
}

function isConnectorNode(node: Node): boolean {
  const data = node.data as Record<string, unknown>
  const elementType = (data.elementType as string) ?? ''
  return elementType.startsWith('connector-')
}

const typedPanels: Record<string, React.ComponentType<{ node: Node }>> = {
  agent: AgentProperties,
  tool: ToolProperties,
  guardrail: GuardrailProperties,
  evaluator: EvaluatorProperties,
  stage: StageProperties,
  'cmmn-milestone': MilestoneProperties,
  'human-task': HumanTaskProperties,
  'domain-context': DomainContextProperties,
}

function NodeProperties({ node }: { node: Node }) {
  const applyNodesChange = useCanvasStore((s) => s.applyNodesChange)

  const handleNameChange = useCallback(
    (name: string) => {
      applyNodesChange([
        {
          type: 'reset',
          item: {
            ...node,
            data: { ...(node.data as Record<string, unknown>), label: name },
          },
        },
      ])
    },
    [node, applyNodesChange],
  )

  const typeId = getElementTypeId(node)
  const TypedPanel = typedPanels[typeId]

  return (
    <div>
      <ElementHeader node={node} onNameChange={handleNameChange} />
      {TypedPanel ? (
        <TypedPanel key={node.id} node={node} />
      ) : isConnectorNode(node) ? (
        <ConnectorProperties node={node} />
      ) : (
        <div className="space-y-4">
          <div>
            <FieldLabel label="Element Type" tooltip="The ACMN element type of this node" />
            <input
              className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
              value={acmnElementTypeMap.get(typeId)?.label ?? typeId}
              readOnly
            />
          </div>
          <div>
            <FieldLabel label="ID" tooltip="Unique identifier for this element within the model" />
            <input
              className="w-full rounded border border-border bg-muted px-2 py-1 text-xs font-mono"
              value={node.id}
              readOnly
            />
          </div>
        </div>
      )}
    </div>
  )
}

function PanelContent() {
  const { selectedNodes, selectedEdges } = useSelection()

  const totalSelected = selectedNodes.length + selectedEdges.length

  if (totalSelected === 0) {
    return (
      <>
        <h2 className="mb-3 text-sm font-semibold tracking-tight">
          Case Plan Model
        </h2>
        <CpmProperties />
      </>
    )
  }

  if (totalSelected > 1) {
    return (
      <>
        <h2 className="mb-3 text-sm font-semibold tracking-tight">
          Properties
        </h2>
        <MultiSelectHint count={totalSelected} />
      </>
    )
  }

  if (selectedEdges.length === 1) {
    return (
      <>
        <h2 className="mb-3 text-sm font-semibold tracking-tight">
          Wire Properties
        </h2>
        <WireProperties edge={selectedEdges[0]} />
      </>
    )
  }

  if (selectedNodes.length === 1) {
    return (
      <>
        <h2 className="mb-3 text-sm font-semibold tracking-tight">
          Properties
        </h2>
        <NodeProperties node={selectedNodes[0]} />
      </>
    )
  }

  return null
}

export function PropertyPanel() {
  const [width, setWidth] = useState(readPersistedWidth)
  const [collapsed, setCollapsed] = useState(readPersistedCollapsed)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      persistCollapsed(next)
      return next
    })
  }, [])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (collapsed) return
      e.preventDefault()
      dragging.current = true
      startX.current = e.clientX
      startWidth.current = width
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [collapsed, width],
  )

  const onDragHandleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 50 : 10
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setWidth((w) => {
          const next = Math.min(MAX_WIDTH, w + step)
          persistWidth(next)
          return next
        })
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setWidth((w) => {
          const next = Math.max(MIN_WIDTH, w - step)
          persistWidth(next)
          return next
        })
      }
    },
    [],
  )

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return
      const delta = startX.current - e.clientX
      const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth.current + delta))
      setWidth(next)
    }

    function onMouseUp() {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setWidth((w) => {
        persistWidth(w)
        return w
      })
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  if (collapsed) {
    return (
      <aside
        className="shrink-0 border-l border-border bg-muted/40 flex flex-col items-center pt-2"
        style={{ width: RAIL_WIDTH }}
      >
        <button
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-accent"
          onClick={toggleCollapse}
          aria-label="Expand property panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </aside>
    )
  }

  return (
    <aside
      className="shrink-0 border-l border-border bg-muted/40 flex relative"
      style={{ width }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-ring/50 active:bg-ring/70 z-10 focus-visible:bg-ring/70 focus-visible:outline-none focus-visible:w-1.5"
        onMouseDown={onMouseDown}
        onKeyDown={onDragHandleKeyDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize property panel"
        aria-valuenow={width}
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={MAX_WIDTH}
        tabIndex={0}
      />
      <div className="flex-1 overflow-y-auto p-4 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div />
          <button
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-accent"
            onClick={toggleCollapse}
            aria-label="Collapse property panel"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <PanelContent />
      </div>
    </aside>
  )
}
