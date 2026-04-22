import { useCallback } from 'react'
import type { Node } from '@xyflow/react'
import { useCanvasStore } from '@/state/canvasStore'
import { UpdateElementPropertiesCommand } from '@/state/commands'
import { FieldLabel } from './HelpTooltip'

const cognitiveModeOptions = [
  { value: 'gather', label: 'Gather' },
  { value: 'analyse', label: 'Analyse' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'decide', label: 'Decide' },
] as const

const decoratorOptions = [
  { value: 'autoComplete', label: 'Auto Complete' },
  { value: 'manualActivation', label: 'Manual Activation' },
  { value: 'repetition', label: 'Repetition' },
  { value: 'required', label: 'Required' },
] as const

export function StageProperties({ node }: { node: Node }) {
  const pushCommand = useCanvasStore((s) => s.pushCommand)

  const data = node.data as Record<string, unknown>
  const stageName = (data.label as string) ?? ''
  const cognitiveMode = (data.cognitiveMode as string) ?? 'gather'
  const entrySentry = (data.entrySentry as string) ?? ''
  const exitSentry = (data.exitSentry as string) ?? ''
  const decorators = (data.decorators as string[]) ?? []

  const updateProp = useCallback(
    (props: Record<string, unknown>) => {
      pushCommand(new UpdateElementPropertiesCommand(node.id, props, {}))
    },
    [node.id, pushCommand],
  )

  const toggleDecorator = useCallback(
    (value: string, checked: boolean) => {
      const current = (node.data as Record<string, unknown>).decorators as string[] ?? []
      const next = checked
        ? [...current, value]
        : current.filter((d: string) => d !== value)
      updateProp({ decorators: next })
    },
    [node.data, updateProp],
  )

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel label="Stage Name" tooltip="Display name for this stage in the case plan" />
        <input
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={stageName}
          onChange={(e) => updateProp({ label: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel label="Cognitive Mode" tooltip="The type of cognitive work performed within this stage" />
        <select
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={cognitiveMode}
          onChange={(e) => updateProp({ cognitiveMode: e.target.value })}
        >
          {cognitiveModeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel label="Entry Sentry" tooltip="Expression that must evaluate to true for this stage to activate" />
        <textarea
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm resize-y min-h-[60px] font-mono"
          value={entrySentry}
          placeholder="Expression (editor placeholder)"
          onChange={(e) => updateProp({ entrySentry: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel label="Exit Sentry" tooltip="Expression that must evaluate to true for this stage to complete" />
        <textarea
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm resize-y min-h-[60px] font-mono"
          value={exitSentry}
          placeholder="Expression (editor placeholder)"
          onChange={(e) => updateProp({ exitSentry: e.target.value })}
        />
      </div>

      <fieldset>
        <FieldLabel label="Decorators" tooltip="CMMN plan-item decorators that control this stage's lifecycle behaviour" />
        <div className="space-y-1.5">
          {decoratorOptions.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-border"
                checked={decorators.includes(opt.value)}
                onChange={(e) => toggleDecorator(opt.value, e.target.checked)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
