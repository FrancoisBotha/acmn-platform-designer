import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import type { Node } from '@xyflow/react'
import { Plus, Trash2 } from 'lucide-react'
import { useCanvasStore } from '@/state/canvasStore'
import { UpdateElementPropertiesCommand, RemoveWireCommand, BatchCommand } from '@/state/commands'
import { FieldLabel } from './HelpTooltip'

const MonacoEditor = lazy(() => import('@monaco-editor/react'))

const TAB_NAMES = [
  'Identity',
  'Model',
  'Tools',
  'Context',
  'Strategy',
  'Confidence',
  'Ports',
  'Lifecycle',
  'State',
] as const

type TabName = (typeof TAB_NAMES)[number]

function getData(node: Node): Record<string, unknown> {
  return node.data as Record<string, unknown>
}

function useAgentUpdate(nodeId: string) {
  const pushCommand = useCanvasStore((s) => s.pushCommand)
  const nodes = useCanvasStore((s) => s.nodes)

  const currentData = useMemo(() => {
    const node = nodes.find((n) => n.id === nodeId)
    return node ? getData(node) : {}
  }, [nodes, nodeId])

  const updateProps = useCallback(
    (props: Record<string, unknown>) => {
      const oldProps: Record<string, unknown> = {}
      for (const key of Object.keys(props)) {
        oldProps[key] = currentData[key]
      }
      pushCommand(new UpdateElementPropertiesCommand(nodeId, props, oldProps))
    },
    [nodeId, pushCommand, currentData],
  )

  return { data: currentData, updateProps }
}

// --- Tab bar ---

function TabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: TabName
  onTabChange: (tab: TabName) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = TAB_NAMES.indexOf(activeTab)
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        const next = TAB_NAMES[(idx + 1) % TAB_NAMES.length]
        onTabChange(next)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const next = TAB_NAMES[(idx - 1 + TAB_NAMES.length) % TAB_NAMES.length]
        onTabChange(next)
      }
    },
    [activeTab, onTabChange],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const activeBtn = container.querySelector<HTMLButtonElement>('[data-active="true"]')
    if (activeBtn) activeBtn.focus()
  }, [activeTab])

  return (
    <div
      ref={containerRef}
      className="flex border-b border-border overflow-x-auto"
      role="tablist"
      aria-label="Agent property tabs"
      onKeyDown={handleKeyDown}
      style={{ scrollbarWidth: 'thin' }}
    >
      {TAB_NAMES.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={activeTab === tab}
          data-active={activeTab === tab}
          tabIndex={activeTab === tab ? 0 : -1}
          className={`shrink-0 px-3 py-1.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring ${
            activeTab === tab
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
          }`}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

// --- Shared field components ---

function TextInput({
  label,
  tooltip,
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  label: string
  tooltip?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  readOnly?: boolean
}) {
  return (
    <div>
      <FieldLabel label={label} tooltip={tooltip} />
      <input
        className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  )
}

function NumberInput({
  label,
  tooltip,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
}: {
  label: string
  tooltip?: string
  value: number | undefined
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
}) {
  return (
    <div>
      <FieldLabel label={label} tooltip={tooltip} />
      <input
        type="number"
        className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
        value={value ?? ''}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
      />
    </div>
  )
}

function SelectInput({
  label,
  tooltip,
  value,
  onChange,
  options,
}: {
  label: string
  tooltip?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <FieldLabel label={label} tooltip={tooltip} />
      <select
        className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// --- Monaco wrapper with expand-to-modal ---

function MonacoField({
  label,
  tooltip,
  value,
  onChange,
  language,
}: {
  label: string
  tooltip?: string
  value: string
  onChange: (v: string) => void
  language?: string
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <FieldLabel label={label} tooltip={tooltip} />
        <button
          className="text-[10px] text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(true)}
        >
          Expand
        </button>
      </div>
      <Suspense
        fallback={
          <textarea
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm resize-y font-mono"
            style={{ minHeight: '4lh', maxHeight: '12lh' }}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        }
      >
        <div className="rounded border border-border overflow-hidden" style={{ minHeight: 80, maxHeight: 240 }}>
          <MonacoEditor
            height={Math.max(80, Math.min(240, (value.split('\n').length + 1) * 20))}
            language={language ?? 'plaintext'}
            value={value}
            onChange={(v) => onChange(v ?? '')}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'off',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              fontSize: 12,
              padding: { top: 4, bottom: 4 },
              overviewRulerLanes: 0,
              folding: false,
              glyphMargin: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
            }}
          />
        </div>
      </Suspense>

      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg border border-border w-[80vw] h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-sm font-medium">{label}</span>
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded(false)}
              >
                Close
              </button>
            </div>
            <div className="flex-1">
              <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading editor...</div>}>
                <MonacoEditor
                  height="100%"
                  language={language ?? 'plaintext'}
                  value={value}
                  onChange={(v) => onChange(v ?? '')}
                  options={{
                    minimap: { enabled: true },
                    wordWrap: 'on',
                    fontSize: 13,
                    padding: { top: 8, bottom: 8 },
                  }}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Multi-select for string lists ---

function MultiSelectTags({
  label,
  tooltip,
  values,
  onChange,
  placeholder,
}: {
  label: string
  tooltip?: string
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  const addItem = () => {
    const trimmed = input.trim()
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed])
      setInput('')
    }
  }

  return (
    <div>
      <FieldLabel label={label} tooltip={tooltip} />
      <div className="flex flex-wrap gap-1 mb-1">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs"
          >
            {v}
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onChange(values.filter((x) => x !== v))}
            >
              x
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addItem()
            }
          }}
          placeholder={placeholder}
        />
        <button
          className="rounded border border-border px-2 py-1 text-xs hover:bg-accent"
          onClick={addItem}
        >
          Add
        </button>
      </div>
    </div>
  )
}

// --- Tab content components ---

function IdentityTab({ nodeId }: { nodeId: string }) {
  const { data, updateProps } = useAgentUpdate(nodeId)

  return (
    <div className="space-y-4">
      <TextInput
        label="Name"
        tooltip="The display name of this agent"
        value={(data.label as string) ?? ''}
        onChange={(v) => updateProps({ label: v })}
      />
      <MonacoField
        label="Persona"
        tooltip="Multi-line persona description that defines how this agent behaves and communicates"
        value={(data.persona as string) ?? ''}
        onChange={(v) => updateProps({ persona: v })}
      />
      <TextInput
        label="Role"
        tooltip="The functional role this agent fulfils within the case plan"
        value={(data.role as string) ?? ''}
        onChange={(v) => updateProps({ role: v })}
        placeholder="e.g. Analyst, Reviewer, Coordinator"
      />
      <TextInput
        label="Owner"
        tooltip="The person or team responsible for this agent's configuration"
        value={(data.owner as string) ?? ''}
        onChange={(v) => updateProps({ owner: v })}
        placeholder="e.g. team-platform"
      />
    </div>
  )
}

function ModelTab({ nodeId }: { nodeId: string }) {
  const { data, updateProps } = useAgentUpdate(nodeId)

  const modelOptions = [
    { value: '', label: 'Select a model...' },
    { value: 'claude-opus-4-7', label: 'Claude Opus 4.7' },
    { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  ]

  const temperature = (data.temperature as number) ?? 0.7

  return (
    <div className="space-y-4">
      <SelectInput
        label="Model"
        tooltip="The LLM model this agent uses for inference"
        value={(data.model as string) ?? ''}
        onChange={(v) => updateProps({ model: v })}
        options={modelOptions}
      />
      <div>
        <FieldLabel label="Temperature" tooltip="Controls randomness in model output. Lower values produce more focused responses." />
        <div className="flex items-center gap-2">
          <input
            type="range"
            className="flex-1"
            min={0}
            max={2}
            step={0.1}
            value={temperature}
            onChange={(e) => updateProps({ temperature: parseFloat(e.target.value) })}
          />
          <span className="text-xs text-muted-foreground w-8 text-right">{temperature.toFixed(1)}</span>
        </div>
      </div>
      <NumberInput
        label="Max Tokens"
        tooltip="Maximum number of tokens the model may generate per response"
        value={data.maxTokens as number | undefined}
        onChange={(v) => updateProps({ maxTokens: v })}
        min={1}
        step={1}
        placeholder="e.g. 4096"
      />
    </div>
  )
}

function ToolsTab({ nodeId }: { nodeId: string }) {
  const { data, updateProps } = useAgentUpdate(nodeId)
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)

  const wiredTools = useMemo(() => {
    const incomingEdges = edges.filter((e) => e.target === nodeId || e.source === nodeId)
    const connectedNodeIds = new Set<string>()
    for (const e of incomingEdges) {
      if (e.source !== nodeId) connectedNodeIds.add(e.source)
      if (e.target !== nodeId) connectedNodeIds.add(e.target)
    }
    return nodes.filter(
      (n) =>
        connectedNodeIds.has(n.id) &&
        (n.data as Record<string, unknown>).elementType === 'tool',
    )
  }, [nodes, edges, nodeId])

  const toolSettings = (data.toolSettings as Record<string, { enabled: boolean; policy: string }>) ?? {}

  const updateToolSetting = useCallback(
    (toolId: string, key: string, value: unknown) => {
      const current = toolSettings[toolId] ?? { enabled: true, policy: 'auto' }
      const next = { ...toolSettings, [toolId]: { ...current, [key]: value } }
      updateProps({ toolSettings: next })
    },
    [toolSettings, updateProps],
  )

  const policyOptions = [
    { value: 'auto', label: 'Auto' },
    { value: 'confirm_first', label: 'Confirm First' },
    { value: 'supervised', label: 'Supervised' },
  ]

  if (wiredTools.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        No tool nodes wired to this agent. Connect a tool node on the canvas to configure it here.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {wiredTools.map((tool) => {
        const toolData = tool.data as Record<string, unknown>
        const toolLabel = (toolData.label as string) ?? 'Untitled Tool'
        const setting = toolSettings[tool.id] ?? { enabled: true, policy: 'auto' }

        return (
          <div key={tool.id} className="rounded border border-border p-2 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={setting.enabled}
                onChange={(e) => updateToolSetting(tool.id, 'enabled', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">{toolLabel}</span>
            </div>
            <div>
              <FieldLabel label="Invocation Policy" tooltip="Controls when this tool is invoked by the agent" />
              <select
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                value={setting.policy}
                onChange={(e) => updateToolSetting(tool.id, 'policy', e.target.value)}
              >
                {policyOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ContextTab({ nodeId }: { nodeId: string }) {
  const { data, updateProps } = useAgentUpdate(nodeId)

  const threadVisibilityOptions = [
    { value: 'all', label: 'All' },
    { value: 'own', label: 'Own Only' },
    { value: 'none', label: 'None' },
  ]

  const contextScopeOptions = [
    { value: 'full', label: 'Full' },
    { value: 'restricted', label: 'Restricted' },
    { value: 'scoped', label: 'Scoped' },
  ]

  return (
    <div className="space-y-4">
      <MultiSelectTags
        label="Readable Case-File Items"
        tooltip="Case-file items this agent can read during execution"
        values={(data.readableCaseFileItems as string[]) ?? []}
        onChange={(v) => updateProps({ readableCaseFileItems: v })}
        placeholder="Add item name..."
      />
      <MultiSelectTags
        label="Writable Case-File Items"
        tooltip="Case-file items this agent can write to during execution"
        values={(data.writableCaseFileItems as string[]) ?? []}
        onChange={(v) => updateProps({ writableCaseFileItems: v })}
        placeholder="Add item name..."
      />
      <SelectInput
        label="Thread Visibility"
        tooltip="Controls which conversation threads this agent can see"
        value={(data.threadVisibility as string) ?? 'all'}
        onChange={(v) => updateProps({ threadVisibility: v })}
        options={threadVisibilityOptions}
      />
      <SelectInput
        label="Context Scope"
        tooltip="Defines the breadth of context provided to this agent"
        value={(data.contextScope as string) ?? 'full'}
        onChange={(v) => updateProps({ contextScope: v })}
        options={contextScopeOptions}
      />
    </div>
  )
}

function StrategyTab({ nodeId }: { nodeId: string }) {
  const { data, updateProps } = useAgentUpdate(nodeId)

  const strategyOptions = [
    { value: 'react', label: 'ReAct' },
    { value: 'plan_execute', label: 'Plan & Execute' },
    { value: 'reflect', label: 'Reflect' },
    { value: 'debate', label: 'Debate' },
  ]

  return (
    <div className="space-y-4">
      <SelectInput
        label="Reasoning Strategy"
        tooltip="The reasoning framework this agent follows when processing tasks"
        value={(data.reasoningStrategy as string) ?? 'react'}
        onChange={(v) => updateProps({ reasoningStrategy: v })}
        options={strategyOptions}
      />
      <NumberInput
        label="Max Turns"
        tooltip="Maximum number of reasoning turns before the agent must produce a final answer"
        value={data.maxTurns as number | undefined}
        onChange={(v) => updateProps({ maxTurns: v })}
        min={1}
        step={1}
        placeholder="e.g. 10"
      />
      <TextInput
        label="Budget"
        tooltip="Maximum cost budget for this agent's execution (currency value)"
        value={(data.budget as string) ?? ''}
        onChange={(v) => updateProps({ budget: v })}
        placeholder="e.g. 5.00 USD"
      />
    </div>
  )
}

function ConfidenceTab({ nodeId }: { nodeId: string }) {
  const { data, updateProps } = useAgentUpdate(nodeId)

  const params = (data.confidenceParams as { key: string; value: string }[]) ?? []

  const updateParam = useCallback(
    (index: number, field: 'key' | 'value', val: string) => {
      const next = params.map((p, i) => (i === index ? { ...p, [field]: val } : p))
      updateProps({ confidenceParams: next })
    },
    [params, updateProps],
  )

  const addParam = useCallback(() => {
    updateProps({ confidenceParams: [...params, { key: '', value: '' }] })
  }, [params, updateProps])

  const removeParam = useCallback(
    (index: number) => {
      updateProps({ confidenceParams: params.filter((_, i) => i !== index) })
    },
    [params, updateProps],
  )

  return (
    <div className="space-y-3">
      <FieldLabel
        label="Confidence Model Parameters"
        tooltip="Key-value pairs configuring the confidence model. The exact parameters depend on the chosen confidence model."
      />
      {params.map((p, i) => (
        <div key={i} className="flex items-center gap-1">
          <input
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
            value={p.key}
            onChange={(e) => updateParam(i, 'key', e.target.value)}
            placeholder="Key"
          />
          <input
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
            value={p.value}
            onChange={(e) => updateParam(i, 'value', e.target.value)}
            placeholder="Value"
          />
          <button
            className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-accent"
            onClick={() => removeParam(i)}
            aria-label="Remove parameter"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={addParam}
      >
        <Plus className="h-3.5 w-3.5" />
        Add parameter
      </button>
    </div>
  )
}

interface PortEntry {
  id: string
  name: string
  direction: 'input' | 'output'
  portType: string
  schema?: string
}

function PortsTab({ nodeId }: { nodeId: string }) {
  const { data, updateProps } = useAgentUpdate(nodeId)
  const edges = useCanvasStore((s) => s.edges)
  const pushCommand = useCanvasStore((s) => s.pushCommand)

  const ports = (data.customPorts as PortEntry[]) ?? []

  const portTypeOptions = [
    { value: 'data', label: 'Data' },
    { value: 'event', label: 'Event' },
    { value: 'case_file', label: 'Case File' },
    { value: 'escalation', label: 'Escalation' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'any', label: 'Any' },
  ]

  const directionOptions = [
    { value: 'input', label: 'Input' },
    { value: 'output', label: 'Output' },
  ]

  const updatePort = useCallback(
    (index: number, field: keyof PortEntry, val: string) => {
      const next = ports.map((p, i) => (i === index ? { ...p, [field]: val } : p))
      updateProps({ customPorts: next })
    },
    [ports, updateProps],
  )

  const addPort = useCallback(() => {
    const newPort: PortEntry = {
      id: `port-${Date.now()}`,
      name: '',
      direction: 'input',
      portType: 'data',
    }
    updateProps({ customPorts: [...ports, newPort] })
  }, [ports, updateProps])

  const removePort = useCallback(
    (index: number) => {
      const port = ports[index]
      const connectedEdges = edges.filter(
        (e) =>
          (e.source === nodeId && e.sourceHandle === port.id) ||
          (e.target === nodeId && e.targetHandle === port.id),
      )

      if (connectedEdges.length > 0) {
        const confirmed = window.confirm(
          `This port has ${connectedEdges.length} connected wire(s). Removing it will delete those wires. Continue?`,
        )
        if (!confirmed) return

        const wireIds = connectedEdges.map((e) => e.id)
        const removeWires = new RemoveWireCommand(wireIds)
        const updatedPorts = ports.filter((_, i) => i !== index)
        const updatePortsCmd = new UpdateElementPropertiesCommand(
          nodeId,
          { customPorts: updatedPorts },
          { customPorts: ports },
        )
        pushCommand(new BatchCommand([removeWires, updatePortsCmd]))
        return
      }

      updateProps({ customPorts: ports.filter((_, i) => i !== index) })
    },
    [ports, edges, nodeId, pushCommand, updateProps],
  )

  return (
    <div className="space-y-3">
      <FieldLabel
        label="Custom Ports"
        tooltip="Named input and output ports for this agent with types and optional schemas"
      />
      {ports.map((port, i) => (
        <div key={port.id} className="rounded border border-border p-2 space-y-2">
          <div className="flex items-center gap-1">
            <input
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
              value={port.name}
              onChange={(e) => updatePort(i, 'name', e.target.value)}
              placeholder="Port name"
            />
            <button
              className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-accent"
              onClick={() => removePort(i)}
              aria-label="Remove port"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <select
              className="rounded border border-border bg-background px-2 py-1 text-sm"
              value={port.direction}
              onChange={(e) => updatePort(i, 'direction', e.target.value)}
            >
              {directionOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              className="rounded border border-border bg-background px-2 py-1 text-sm"
              value={port.portType}
              onChange={(e) => updatePort(i, 'portType', e.target.value)}
            >
              {portTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <input
            className="w-full rounded border border-border bg-background px-2 py-1 text-xs font-mono"
            value={port.schema ?? ''}
            onChange={(e) => updatePort(i, 'schema', e.target.value)}
            placeholder="Schema (optional JSON)"
          />
        </div>
      ))}
      <button
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={addPort}
      >
        <Plus className="h-3.5 w-3.5" />
        Add port
      </button>
    </div>
  )
}

function LifecycleTab({ nodeId }: { nodeId: string }) {
  const { data, updateProps } = useAgentUpdate(nodeId)

  const decoratorOptions = [
    { key: 'autoComplete', label: 'Auto-Complete' },
    { key: 'manualActivation', label: 'Manual Activation' },
    { key: 'repetition', label: 'Repetition' },
    { key: 'required', label: 'Required' },
  ]

  const decorators = (data.planItemDecorators as Record<string, boolean>) ?? {}

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel
          label="Entry Sentry"
          tooltip="Expression that must evaluate to true for this agent to activate"
        />
        <textarea
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm resize-y min-h-[60px] font-mono"
          value={(data.entrySentry as string) ?? ''}
          onChange={(e) => updateProps({ entrySentry: e.target.value })}
          placeholder="Entry sentry expression"
        />
      </div>
      <div>
        <FieldLabel
          label="Exit Sentry"
          tooltip="Expression that must evaluate to true for this agent to complete"
        />
        <textarea
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm resize-y min-h-[60px] font-mono"
          value={(data.exitSentry as string) ?? ''}
          onChange={(e) => updateProps({ exitSentry: e.target.value })}
          placeholder="Exit sentry expression"
        />
      </div>
      <div>
        <FieldLabel
          label="Plan-Item Decorators"
          tooltip="CMMN plan-item control decorators that affect this agent's lifecycle behaviour"
        />
        <div className="space-y-2">
          {decoratorOptions.map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={decorators[opt.key] ?? false}
                onChange={(e) =>
                  updateProps({
                    planItemDecorators: { ...decorators, [opt.key]: e.target.checked },
                  })
                }
                className="rounded"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function StateTab({ nodeId }: { nodeId: string }) {
  const { data, updateProps } = useAgentUpdate(nodeId)

  const retentionOptions = [
    { value: 'all', label: 'All' },
    { value: 'last_n', label: 'Last N' },
    { value: 'none', label: 'None' },
    { value: 'summary', label: 'Summary' },
  ]

  const retentionMode = (data.turnRetentionMode as string) ?? 'all'
  const retentionCount = data.turnRetentionCount as number | undefined
  const promotionRules = (data.promotionRules as { from: string; to: string; condition: string }[]) ?? []

  const updateRule = useCallback(
    (index: number, field: 'from' | 'to' | 'condition', val: string) => {
      const next = promotionRules.map((r, i) => (i === index ? { ...r, [field]: val } : r))
      updateProps({ promotionRules: next })
    },
    [promotionRules, updateProps],
  )

  const addRule = useCallback(() => {
    updateProps({
      promotionRules: [...promotionRules, { from: '', to: '', condition: '' }],
    })
  }, [promotionRules, updateProps])

  const removeRule = useCallback(
    (index: number) => {
      updateProps({ promotionRules: promotionRules.filter((_, i) => i !== index) })
    },
    [promotionRules, updateProps],
  )

  return (
    <div className="space-y-4">
      <SelectInput
        label="Turn Retention"
        tooltip="Controls how many conversation turns are retained in the agent's working memory"
        value={retentionMode}
        onChange={(v) => updateProps({ turnRetentionMode: v })}
        options={retentionOptions}
      />
      {retentionMode === 'last_n' && (
        <NumberInput
          label="Retain Count"
          tooltip="Number of most recent turns to retain"
          value={retentionCount}
          onChange={(v) => updateProps({ turnRetentionCount: v })}
          min={1}
          step={1}
          placeholder="e.g. 10"
        />
      )}
      <div>
        <FieldLabel
          label="Promotion Rules"
          tooltip="Rules that promote state from one scope to another based on conditions"
        />
        {promotionRules.map((rule, i) => (
          <div key={i} className="flex items-start gap-1 mb-2">
            <div className="flex-1 space-y-1">
              <input
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                value={rule.from}
                onChange={(e) => updateRule(i, 'from', e.target.value)}
                placeholder="From scope"
              />
              <input
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                value={rule.to}
                onChange={(e) => updateRule(i, 'to', e.target.value)}
                placeholder="To scope"
              />
              <input
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm font-mono"
                value={rule.condition}
                onChange={(e) => updateRule(i, 'condition', e.target.value)}
                placeholder="Condition expression"
              />
            </div>
            <button
              className="shrink-0 rounded p-1 mt-1 text-muted-foreground hover:text-destructive hover:bg-accent"
              onClick={() => removeRule(i)}
              aria-label="Remove rule"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={addRule}
        >
          <Plus className="h-3.5 w-3.5" />
          Add rule
        </button>
      </div>
    </div>
  )
}

// --- Main component ---

export function AgentProperties({ node }: { node: Node }) {
  const [activeTab, setActiveTab] = useState<TabName>('Identity')

  return (
    <div className="flex flex-col gap-3">
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="px-0.5">
        {activeTab === 'Identity' && <IdentityTab nodeId={node.id} />}
        {activeTab === 'Model' && <ModelTab nodeId={node.id} />}
        {activeTab === 'Tools' && <ToolsTab nodeId={node.id} />}
        {activeTab === 'Context' && <ContextTab nodeId={node.id} />}
        {activeTab === 'Strategy' && <StrategyTab nodeId={node.id} />}
        {activeTab === 'Confidence' && <ConfidenceTab nodeId={node.id} />}
        {activeTab === 'Ports' && <PortsTab nodeId={node.id} />}
        {activeTab === 'Lifecycle' && <LifecycleTab nodeId={node.id} />}
        {activeTab === 'State' && <StateTab nodeId={node.id} />}
      </div>
    </div>
  )
}
