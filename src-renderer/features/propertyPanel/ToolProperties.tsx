import { useCallback } from 'react'
import type { Node } from '@xyflow/react'
import { useCanvasStore } from '@/state/canvasStore'
import { UpdateElementPropertiesCommand } from '@/state/commands'
import { MonacoField } from './MonacoField'

const invocationPolicyOptions = [
  { value: 'auto', label: 'Auto' },
  { value: 'confirm_first', label: 'Confirm First' },
  { value: 'supervised', label: 'Supervised' },
] as const

export function ToolProperties({ node }: { node: Node }) {
  const pushCommand = useCanvasStore((s) => s.pushCommand)
  const data = node.data as Record<string, unknown>

  const toolId = String(data.toolId ?? node.id)
  const name = String(data.label ?? '')
  const description = String(data.description ?? '')
  const inputSchema = String(data.inputSchema ?? '{}')
  const outputSchema = String(data.outputSchema ?? '{}')
  const invocationPolicy = String(data.invocationPolicy ?? 'auto')

  const updateProp = useCallback(
    (props: Record<string, unknown>) => {
      pushCommand(new UpdateElementPropertiesCommand(node.id, props, {}))
    },
    [node.id, pushCommand],
  )

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1">Tool ID</label>
        <input
          className="w-full rounded border border-border bg-muted px-2 py-1 text-xs font-mono"
          value={toolId}
          readOnly
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Name</label>
        <input
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={name}
          onChange={(e) => updateProp({ label: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Description</label>
        <textarea
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm resize-y min-h-[60px]"
          value={description}
          placeholder="Describe what this tool does"
          onChange={(e) => updateProp({ description: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Input Schema</label>
        <MonacoField
          value={inputSchema}
          onChange={(v) => updateProp({ inputSchema: v })}
          language="json"
          label="Input Schema"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Output Schema</label>
        <MonacoField
          value={outputSchema}
          onChange={(v) => updateProp({ outputSchema: v })}
          language="json"
          label="Output Schema"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Invocation Policy</label>
        <select
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={invocationPolicy}
          onChange={(e) => updateProp({ invocationPolicy: e.target.value })}
        >
          {invocationPolicyOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
