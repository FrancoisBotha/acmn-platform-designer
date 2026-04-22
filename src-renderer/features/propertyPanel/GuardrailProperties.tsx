import { useCallback } from 'react'
import type { Node } from '@xyflow/react'
import { useCanvasStore } from '@/state/canvasStore'
import { UpdateElementPropertiesCommand } from '@/state/commands'
import { MonacoField } from './MonacoField'
import { FieldLabel } from './HelpTooltip'

const guardrailTypeOptions = [
  { value: 'content_filter', label: 'Content Filter' },
  { value: 'schema_validation', label: 'Schema Validation' },
  { value: 'policy_check', label: 'Policy Check' },
  { value: 'rate_limit', label: 'Rate Limit' },
  { value: 'custom', label: 'Custom' },
] as const

const violationActionOptions = [
  { value: 'block', label: 'Block' },
  { value: 'warn', label: 'Warn' },
  { value: 'escalate', label: 'Escalate' },
  { value: 'log', label: 'Log Only' },
] as const

export function GuardrailProperties({ node }: { node: Node }) {
  const pushCommand = useCanvasStore((s) => s.pushCommand)
  const data = node.data as Record<string, unknown>

  const guardrailType = String(data.guardrailType ?? 'content_filter')
  const ruleDefinition = String(data.ruleDefinition ?? '')
  const violationAction = String(data.violationAction ?? 'block')
  const passPortLabel = String(data.passPortLabel ?? 'pass')
  const failPortLabel = String(data.failPortLabel ?? 'fail')

  const updateProp = useCallback(
    (props: Record<string, unknown>) => {
      pushCommand(new UpdateElementPropertiesCommand(node.id, props, {}))
    },
    [node.id, pushCommand],
  )

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel label="Guardrail Type" tooltip="The category of safety check this guardrail performs" />
        <select
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={guardrailType}
          onChange={(e) => updateProp({ guardrailType: e.target.value })}
        >
          {guardrailTypeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel label="Rule Definition / Prompt" tooltip="The rule expression or prompt that defines what this guardrail checks" />
        <MonacoField
          value={ruleDefinition}
          onChange={(v) => updateProp({ ruleDefinition: v })}
          language="plaintext"
          label="Rule Definition / Prompt"
        />
      </div>

      <div>
        <FieldLabel label="Violation Action" tooltip="What happens when this guardrail detects a violation" />
        <select
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={violationAction}
          onChange={(e) => updateProp({ violationAction: e.target.value })}
        >
          {violationActionOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel label="Port Configuration" tooltip="Labels for the pass and fail output ports of this guardrail" />
        <div className="space-y-2 rounded border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <label className="text-xs text-muted-foreground shrink-0 w-12">Pass</label>
            <input
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
              value={passPortLabel}
              onChange={(e) => updateProp({ passPortLabel: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <label className="text-xs text-muted-foreground shrink-0 w-12">Fail</label>
            <input
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
              value={failPortLabel}
              onChange={(e) => updateProp({ failPortLabel: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
