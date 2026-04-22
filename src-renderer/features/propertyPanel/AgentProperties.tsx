import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import type { Node } from '@xyflow/react'
import { Plus, Trash2 } from 'lucide-react'
import { FormProvider, Controller, useFormContext, useFieldArray } from 'react-hook-form'
import { useCanvasStore } from '@/state/canvasStore'
import { UpdateElementPropertiesCommand, RemoveWireCommand, BatchCommand } from '@/state/commands'
import { agentSchema } from '@/lib/validation'
import { useValidatedPropertyForm } from '@/hooks/useValidatedPropertyForm'
import {
  FieldLabel,
  FieldError,
  ValidatedTextInput,
  ValidatedNumberInput,
  ValidatedSelectInput,
  ValidatedSlider,
  ValidatedTextarea,
} from './ValidatedFields'

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

// --- Monaco wrapper with expand-to-modal ---

function MonacoField({
  name,
  label,
  tooltip,
  language,
}: {
  name: string
  label: string
  tooltip?: string
  language?: string
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => {
        const value = (field.value as string) ?? ''
        const onChange = (v: string) => field.onChange(v)

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
                  className={`w-full rounded border ${fieldState.error ? 'border-red-500' : 'border-border'} bg-background px-2 py-1 text-sm resize-y font-mono`}
                  style={{ minHeight: '4lh', maxHeight: '12lh' }}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                />
              }
            >
              <div
                className={`rounded border ${fieldState.error ? 'border-red-500' : 'border-border'} overflow-hidden`}
                style={{ minHeight: 80, maxHeight: 240 }}
              >
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
            <FieldError message={fieldState.error?.message} />

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
                    <Suspense
                      fallback={
                        <div className="p-4 text-sm text-muted-foreground">Loading editor...</div>
                      }
                    >
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
      }}
    />
  )
}

// --- Multi-select for string lists ---

function MultiSelectTags({
  name,
  label,
  tooltip,
  placeholder,
}: {
  name: string
  label: string
  tooltip?: string
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => {
        const values: string[] = field.value ?? []

        const addItem = () => {
          const trimmed = input.trim()
          if (trimmed && !values.includes(trimmed)) {
            field.onChange([...values, trimmed])
            setInput('')
          }
        }

        return (
          <div>
            <FieldLabel label={label} tooltip={tooltip} />
            <div className="flex flex-wrap gap-1 mb-1">
              {values.map((v: string) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs"
                >
                  {v}
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => field.onChange(values.filter((x: string) => x !== v))}
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
            <FieldError message={fieldState.error?.message} />
          </div>
        )
      }}
    />
  )
}

// --- Tab content components ---

function IdentityTab() {
  return (
    <div className="space-y-4">
      <ValidatedTextInput
        name="label"
        label="Name"
        tooltip="The display name of this agent"
      />
      <MonacoField
        name="persona"
        label="Persona"
        tooltip="Multi-line persona description that defines how this agent behaves and communicates"
      />
      <ValidatedTextInput
        name="role"
        label="Role"
        tooltip="The functional role this agent fulfils within the case plan"
        placeholder="e.g. Analyst, Reviewer, Coordinator"
      />
      <ValidatedTextInput
        name="owner"
        label="Owner"
        tooltip="The person or team responsible for this agent's configuration"
        placeholder="e.g. team-platform"
      />
    </div>
  )
}

function ModelTab() {
  const modelOptions = [
    { value: '', label: 'Select a model...' },
    { value: 'claude-opus-4-7', label: 'Claude Opus 4.7' },
    { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  ] as const

  return (
    <div className="space-y-4">
      <ValidatedSelectInput
        name="model"
        label="Model"
        tooltip="The LLM model this agent uses for inference"
        options={modelOptions}
      />
      <ValidatedSlider
        name="temperature"
        label="Temperature"
        tooltip="Controls randomness in model output. Lower values produce more focused responses."
        min={0}
        max={2}
        step={0.1}
      />
      <ValidatedNumberInput
        name="maxTokens"
        label="Max Tokens"
        tooltip="Maximum number of tokens the model may generate per response"
        min={1}
        step={1}
        placeholder="e.g. 4096"
      />
    </div>
  )
}

function ToolsTab({ nodeId }: { nodeId: string }) {
  const { getValues, setValue } = useFormContext()
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

  const toolSettings =
    (getValues('toolSettings') as Record<string, { enabled: boolean; policy: string }>) ?? {}

  const updateToolSetting = useCallback(
    (toolId: string, key: string, value: unknown) => {
      const current = getValues('toolSettings') ?? {}
      const entry = current[toolId] ?? { enabled: true, policy: 'auto' }
      setValue(
        'toolSettings',
        { ...current, [toolId]: { ...entry, [key]: value } },
        { shouldDirty: true },
      )
    },
    [getValues, setValue],
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
              <FieldLabel
                label="Invocation Policy"
                tooltip="Controls when this tool is invoked by the agent"
              />
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

function ContextTab() {
  const threadVisibilityOptions = [
    { value: 'all', label: 'All' },
    { value: 'own', label: 'Own Only' },
    { value: 'none', label: 'None' },
  ] as const

  const contextScopeOptions = [
    { value: 'full', label: 'Full' },
    { value: 'restricted', label: 'Restricted' },
    { value: 'scoped', label: 'Scoped' },
  ] as const

  return (
    <div className="space-y-4">
      <MultiSelectTags
        name="readableCaseFileItems"
        label="Readable Case-File Items"
        tooltip="Case-file items this agent can read during execution"
        placeholder="Add item name..."
      />
      <MultiSelectTags
        name="writableCaseFileItems"
        label="Writable Case-File Items"
        tooltip="Case-file items this agent can write to during execution"
        placeholder="Add item name..."
      />
      <ValidatedSelectInput
        name="threadVisibility"
        label="Thread Visibility"
        tooltip="Controls which conversation threads this agent can see"
        options={threadVisibilityOptions}
      />
      <ValidatedSelectInput
        name="contextScope"
        label="Context Scope"
        tooltip="Defines the breadth of context provided to this agent"
        options={contextScopeOptions}
      />
    </div>
  )
}

function StrategyTab() {
  const strategyOptions = [
    { value: 'react', label: 'ReAct' },
    { value: 'plan_execute', label: 'Plan & Execute' },
    { value: 'reflect', label: 'Reflect' },
    { value: 'debate', label: 'Debate' },
  ] as const

  return (
    <div className="space-y-4">
      <ValidatedSelectInput
        name="reasoningStrategy"
        label="Reasoning Strategy"
        tooltip="The reasoning framework this agent follows when processing tasks"
        options={strategyOptions}
      />
      <ValidatedNumberInput
        name="maxTurns"
        label="Max Turns"
        tooltip="Maximum number of reasoning turns before the agent must produce a final answer"
        min={1}
        step={1}
        placeholder="e.g. 10"
      />
      <ValidatedTextInput
        name="budget"
        label="Budget"
        tooltip="Maximum cost budget for this agent's execution (currency value)"
        placeholder="e.g. 5.00 USD"
      />
    </div>
  )
}

function ConfidenceTab() {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'confidenceParams',
  })

  return (
    <div className="space-y-3">
      <FieldLabel
        label="Confidence Model Parameters"
        tooltip="Key-value pairs configuring the confidence model. The exact parameters depend on the chosen confidence model."
      />
      {fields.map((field, i) => (
        <div key={field.id} className="flex items-center gap-1">
          <Controller
            name={`confidenceParams.${i}.key`}
            control={control}
            render={({ field: f, fieldState }) => (
              <input
                className={`flex-1 rounded border ${fieldState.error ? 'border-red-500' : 'border-border'} bg-background px-2 py-1 text-sm`}
                value={f.value ?? ''}
                onChange={f.onChange}
                onBlur={f.onBlur}
                placeholder="Key"
              />
            )}
          />
          <Controller
            name={`confidenceParams.${i}.value`}
            control={control}
            render={({ field: f, fieldState }) => (
              <input
                className={`flex-1 rounded border ${fieldState.error ? 'border-red-500' : 'border-border'} bg-background px-2 py-1 text-sm`}
                value={f.value ?? ''}
                onChange={f.onChange}
                onBlur={f.onBlur}
                placeholder="Value"
              />
            )}
          />
          <button
            className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-accent"
            onClick={() => remove(i)}
            aria-label="Remove parameter"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => append({ key: '', value: '' })}
      >
        <Plus className="h-3.5 w-3.5" />
        Add parameter
      </button>
    </div>
  )
}

function PortsTab({ nodeId, commitNow }: { nodeId: string; commitNow: () => void }) {
  const { control, getValues, formState: { errors } } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name: 'customPorts' })
  const edges = useCanvasStore((s) => s.edges)
  const pushCommand = useCanvasStore((s) => s.pushCommand)

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

  const removePort = useCallback(
    (index: number) => {
      const port = fields[index]
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

        commitNow()
        const wireIds = connectedEdges.map((e) => e.id)
        const currentPorts = getValues('customPorts') ?? []
        const updatedPorts = currentPorts.filter((_: unknown, i: number) => i !== index)
        pushCommand(
          new BatchCommand([
            new RemoveWireCommand(wireIds),
            new UpdateElementPropertiesCommand(
              nodeId,
              { customPorts: updatedPorts },
              { customPorts: currentPorts },
            ),
          ]),
        )
        return
      }

      remove(index)
    },
    [fields, edges, nodeId, pushCommand, commitNow, getValues, remove],
  )

  const portsErrors = errors.customPorts as
    | { [index: number]: { name?: { message?: string } } }
    | undefined

  return (
    <div className="space-y-3">
      <FieldLabel
        label="Custom Ports"
        tooltip="Named input and output ports for this agent with types and optional schemas"
      />
      {fields.map((port, i) => (
        <div key={port.id} className="rounded border border-border p-2 space-y-2">
          <div className="flex items-center gap-1">
            <Controller
              name={`customPorts.${i}.name`}
              control={control}
              render={({ field: f, fieldState }) => (
                <div className="flex-1">
                  <input
                    className={`w-full rounded border ${fieldState.error ? 'border-red-500' : 'border-border'} bg-background px-2 py-1 text-sm`}
                    value={f.value ?? ''}
                    onChange={f.onChange}
                    onBlur={f.onBlur}
                    placeholder="Port name"
                  />
                  <FieldError message={fieldState.error?.message} />
                </div>
              )}
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
            <Controller
              name={`customPorts.${i}.direction`}
              control={control}
              render={({ field: f }) => (
                <select
                  className="rounded border border-border bg-background px-2 py-1 text-sm"
                  value={f.value ?? 'input'}
                  onChange={f.onChange}
                >
                  {directionOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            />
            <Controller
              name={`customPorts.${i}.portType`}
              control={control}
              render={({ field: f }) => (
                <select
                  className="rounded border border-border bg-background px-2 py-1 text-sm"
                  value={f.value ?? 'data'}
                  onChange={f.onChange}
                >
                  {portTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
          <Controller
            name={`customPorts.${i}.schema`}
            control={control}
            render={({ field: f }) => (
              <input
                className="w-full rounded border border-border bg-background px-2 py-1 text-xs font-mono"
                value={f.value ?? ''}
                onChange={f.onChange}
                placeholder="Schema (optional JSON)"
              />
            )}
          />
        </div>
      ))}
      <button
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={() =>
          append({
            id: `port-${Date.now()}`,
            name: '',
            direction: 'input',
            portType: 'data',
          })
        }
      >
        <Plus className="h-3.5 w-3.5" />
        Add port
      </button>
    </div>
  )
}

function LifecycleTab() {
  const { control, getValues, setValue } = useFormContext()
  const decorators = (getValues('planItemDecorators') as Record<string, boolean>) ?? {}

  const decoratorOptions = [
    { key: 'autoComplete', label: 'Auto-Complete' },
    { key: 'manualActivation', label: 'Manual Activation' },
    { key: 'repetition', label: 'Repetition' },
    { key: 'required', label: 'Required' },
  ]

  return (
    <div className="space-y-4">
      <ValidatedTextarea
        name="entrySentry"
        label="Entry Sentry"
        tooltip="Expression that must evaluate to true for this agent to activate"
        placeholder="Entry sentry expression"
        className="font-mono"
      />
      <ValidatedTextarea
        name="exitSentry"
        label="Exit Sentry"
        tooltip="Expression that must evaluate to true for this agent to complete"
        placeholder="Exit sentry expression"
        className="font-mono"
      />
      <div>
        <FieldLabel
          label="Plan-Item Decorators"
          tooltip="CMMN plan-item control decorators that affect this agent's lifecycle behaviour"
        />
        <div className="space-y-2">
          {decoratorOptions.map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 text-sm">
              <Controller
                name={`planItemDecorators.${opt.key}`}
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value ?? false}
                    onChange={field.onChange}
                    className="rounded"
                  />
                )}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function StateTab() {
  const { control, watch } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'promotionRules',
  })

  const retentionMode = watch('turnRetentionMode') ?? 'all'

  const retentionOptions = [
    { value: 'all', label: 'All' },
    { value: 'last_n', label: 'Last N' },
    { value: 'none', label: 'None' },
    { value: 'summary', label: 'Summary' },
  ] as const

  return (
    <div className="space-y-4">
      <ValidatedSelectInput
        name="turnRetentionMode"
        label="Turn Retention"
        tooltip="Controls how many conversation turns are retained in the agent's working memory"
        options={retentionOptions}
      />
      {retentionMode === 'last_n' && (
        <ValidatedNumberInput
          name="turnRetentionCount"
          label="Retain Count"
          tooltip="Number of most recent turns to retain"
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
        {fields.map((field, i) => (
          <div key={field.id} className="flex items-start gap-1 mb-2">
            <div className="flex-1 space-y-1">
              <Controller
                name={`promotionRules.${i}.from`}
                control={control}
                render={({ field: f }) => (
                  <input
                    className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                    value={f.value ?? ''}
                    onChange={f.onChange}
                    placeholder="From scope"
                  />
                )}
              />
              <Controller
                name={`promotionRules.${i}.to`}
                control={control}
                render={({ field: f }) => (
                  <input
                    className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                    value={f.value ?? ''}
                    onChange={f.onChange}
                    placeholder="To scope"
                  />
                )}
              />
              <Controller
                name={`promotionRules.${i}.condition`}
                control={control}
                render={({ field: f }) => (
                  <input
                    className="w-full rounded border border-border bg-background px-2 py-1 text-sm font-mono"
                    value={f.value ?? ''}
                    onChange={f.onChange}
                    placeholder="Condition expression"
                  />
                )}
              />
            </div>
            <button
              className="shrink-0 rounded p-1 mt-1 text-muted-foreground hover:text-destructive hover:bg-accent"
              onClick={() => remove(i)}
              aria-label="Remove rule"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => append({ from: '', to: '', condition: '' })}
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
  const { form, commitNow } = useValidatedPropertyForm(agentSchema, node.id)

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-3">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="px-0.5">
          {activeTab === 'Identity' && <IdentityTab />}
          {activeTab === 'Model' && <ModelTab />}
          {activeTab === 'Tools' && <ToolsTab nodeId={node.id} />}
          {activeTab === 'Context' && <ContextTab />}
          {activeTab === 'Strategy' && <StrategyTab />}
          {activeTab === 'Confidence' && <ConfidenceTab />}
          {activeTab === 'Ports' && <PortsTab nodeId={node.id} commitNow={commitNow} />}
          {activeTab === 'Lifecycle' && <LifecycleTab />}
          {activeTab === 'State' && <StateTab />}
        </div>
      </div>
    </FormProvider>
  )
}
