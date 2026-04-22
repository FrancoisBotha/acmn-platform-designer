import { useCallback } from 'react'
import type { Node } from '@xyflow/react'
import { useCanvasStore } from '@/state/canvasStore'
import { UpdateElementPropertiesCommand } from '@/state/commands'

const criteriaTypeOptions = [
  { value: 'expression', label: 'Expression' },
  { value: 'manual', label: 'Manual' },
  { value: 'event', label: 'Event' },
] as const

export function MilestoneProperties({ node }: { node: Node }) {
  const pushCommand = useCanvasStore((s) => s.pushCommand)

  const data = node.data as Record<string, unknown>
  const milestoneName = (data.label as string) ?? ''
  const criteriaType = (data.criteriaType as string) ?? 'expression'
  const criteriaExpression = (data.criteriaExpression as string) ?? ''
  const revocationCondition = (data.revocationCondition as string) ?? ''

  const updateProp = useCallback(
    (props: Record<string, unknown>) => {
      pushCommand(new UpdateElementPropertiesCommand(node.id, props, {}))
    },
    [node.id, pushCommand],
  )

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1">Milestone Name</label>
        <input
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={milestoneName}
          onChange={(e) => updateProp({ label: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Criteria Type</label>
        <select
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={criteriaType}
          onChange={(e) => updateProp({ criteriaType: e.target.value })}
        >
          {criteriaTypeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Criteria Expression</label>
        <textarea
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm resize-y min-h-[60px] font-mono"
          value={criteriaExpression}
          placeholder="Expression (editor placeholder)"
          onChange={(e) => updateProp({ criteriaExpression: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Revocation Condition</label>
        <textarea
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm resize-y min-h-[60px] font-mono"
          value={revocationCondition}
          placeholder="Condition under which this milestone is revoked"
          onChange={(e) => updateProp({ revocationCondition: e.target.value })}
        />
      </div>
    </div>
  )
}
