import { useCallback } from 'react'
import type { Edge } from '@xyflow/react'
import { useCanvasStore } from '@/state/canvasStore'
import { UpdateWireCommand } from '@/state/commands'
import { FieldLabel } from './HelpTooltip'

const wireTypeOptions = [
  { value: 'data', label: 'Data' },
  { value: 'confidence-gated', label: 'Confidence-Gated' },
  { value: 'escalation', label: 'Escalation' },
  { value: 'event', label: 'Event' },
  { value: 'case-file', label: 'Case File' },
] as const

const bufferingOptions = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'batched', label: 'Batched' },
  { value: 'coalesced', label: 'Coalesced' },
] as const

export function WireProperties({ edge }: { edge: Edge }) {
  const pushCommand = useCanvasStore((s) => s.pushCommand)

  const wireType = (edge.data?.wireType as string) ?? edge.type ?? 'data'
  const buffering = (edge.data?.buffering as string) ?? 'immediate'
  const transform = (edge.data?.transform as string) ?? ''
  const confidenceThreshold = (edge.data?.confidenceThreshold as number) ?? 0.5

  const updateProp = useCallback(
    (props: Record<string, unknown>) => {
      pushCommand(new UpdateWireCommand(edge.id, props))
    },
    [edge.id, pushCommand],
  )

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel label="Wire Type" tooltip="The kind of data or signal this wire carries between nodes" />
        <select
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={wireType}
          onChange={(e) => updateProp({ wireType: e.target.value })}
        >
          {wireTypeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel label="Buffering Strategy" tooltip="How messages are buffered before delivery (immediate, batched, or coalesced)" />
        <select
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={buffering}
          onChange={(e) => updateProp({ buffering: e.target.value })}
        >
          {bufferingOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel label="Transform" tooltip="Optional expression applied to data as it passes through this wire" />
        <textarea
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm resize-y min-h-[60px]"
          value={transform}
          placeholder="Optional expression"
          onChange={(e) => updateProp({ transform: e.target.value })}
        />
      </div>

      {wireType === 'confidence-gated' && (
        <div>
          <FieldLabel label="Confidence Threshold" tooltip="Messages are only forwarded when the source's confidence score meets or exceeds this threshold (0-1)" />
          <input
            type="number"
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
            value={confidenceThreshold}
            min={0}
            max={1}
            step={0.05}
            onChange={(e) => updateProp({ confidenceThreshold: parseFloat(e.target.value) })}
          />
        </div>
      )}
    </div>
  )
}
