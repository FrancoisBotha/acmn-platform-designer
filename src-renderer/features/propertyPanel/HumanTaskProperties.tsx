import { useCallback } from 'react'
import type { Node } from '@xyflow/react'
import { useCanvasStore } from '@/state/canvasStore'
import { UpdateElementPropertiesCommand } from '@/state/commands'

const decoratorOptions = [
  { value: 'autoComplete', label: 'Auto Complete' },
  { value: 'manualActivation', label: 'Manual Activation' },
  { value: 'repetition', label: 'Repetition' },
  { value: 'required', label: 'Required' },
] as const

export function HumanTaskProperties({ node }: { node: Node }) {
  const pushCommand = useCanvasStore((s) => s.pushCommand)
  const allNodes = useCanvasStore((s) => s.nodes)

  const data = node.data as Record<string, unknown>
  const taskName = (data.label as string) ?? ''
  const assignee = (data.assignee as string) ?? ''
  const referencedVariables = (data.referencedVariables as string[]) ?? []
  const visibilityRules = (data.visibilityRules as string) ?? ''
  const decorators = (data.decorators as string[]) ?? []

  const cpmNode = allNodes.find(
    (n) =>
      ((n.data as Record<string, unknown>).elementType as string) === 'case-plan-model' ||
      n.type === 'case-plan-model',
  )
  const cpmData = cpmNode?.data as Record<string, unknown> | undefined
  const availableVariables = (cpmData?.caseVariables as Array<{ name: string }>) ?? []

  const updateProp = useCallback(
    (props: Record<string, unknown>) => {
      pushCommand(new UpdateElementPropertiesCommand(node.id, props, {}))
    },
    [node.id, pushCommand],
  )

  const toggleVariable = useCallback(
    (varName: string, checked: boolean) => {
      const current = (node.data as Record<string, unknown>).referencedVariables as string[] ?? []
      const next = checked
        ? [...current, varName]
        : current.filter((v: string) => v !== varName)
      updateProp({ referencedVariables: next })
    },
    [node.data, updateProp],
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
        <label className="block text-xs font-medium mb-1">Task Name</label>
        <input
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={taskName}
          onChange={(e) => updateProp({ label: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Assignee / Role</label>
        <input
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={assignee}
          placeholder="e.g. claims-adjuster, supervisor"
          onChange={(e) => updateProp({ assignee: e.target.value })}
        />
      </div>

      <fieldset>
        <legend className="block text-xs font-medium mb-1">
          Referenced Case Variables
        </legend>
        {availableVariables.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No case variables defined. Add variables to the Case Plan Model to reference them here.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
            {availableVariables.map((v) => (
              <label key={v.name} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  checked={referencedVariables.includes(v.name)}
                  onChange={(e) => toggleVariable(v.name, e.target.checked)}
                />
                {v.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div>
        <label className="block text-xs font-medium mb-1">Conditional Visibility Rules</label>
        <textarea
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm resize-y min-h-[60px] font-mono"
          value={visibilityRules}
          placeholder="Visibility condition expression"
          onChange={(e) => updateProp({ visibilityRules: e.target.value })}
        />
      </div>

      <fieldset>
        <legend className="block text-xs font-medium mb-1">Decorators</legend>
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
