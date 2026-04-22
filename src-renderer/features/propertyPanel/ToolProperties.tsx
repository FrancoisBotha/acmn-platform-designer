import { useCallback } from 'react'
import type { Node } from '@xyflow/react'
import { useCanvasStore } from '@/state/canvasStore'
import { UpdateElementPropertiesCommand } from '@/state/commands'
import { MonacoField } from './MonacoField'
import { FieldLabel } from './HelpTooltip'

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
        <FieldLabel label="Tool ID" tooltip="Unique identifier for this tool within the case plan model" />
        <input
          className="w-full rounded border border-border bg-muted px-2 py-1 text-xs font-mono"
          value={toolId}
          readOnly
        />
      </div>

      <div>
        <FieldLabel label="Name" tooltip="Display name for this tool as shown on the canvas and in agent tool lists" />
        <input
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={name}
          onChange={(e) => updateProp({ label: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel label="Description" tooltip="A brief explanation of what this tool does and when it should be invoked" />
        <textarea
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm resize-y min-h-[60px]"
          value={description}
          placeholder="Describe what this tool does"
          onChange={(e) => updateProp({ description: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel label="Input Schema" tooltip="JSON schema defining the expected input parameters for this tool" />
        <MonacoField
          value={inputSchema}
          onChange={(v) => updateProp({ inputSchema: v })}
          language="json"
          label="Input Schema"
        />
      </div>

      <div>
        <FieldLabel label="Output Schema" tooltip="JSON schema defining the structure of this tool's output" />
        <MonacoField
          value={outputSchema}
          onChange={(v) => updateProp({ outputSchema: v })}
          language="json"
          label="Output Schema"
        />
      </div>

      <div>
        <FieldLabel label="Invocation Policy" tooltip="Controls whether the tool runs automatically or requires human confirmation" />
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
