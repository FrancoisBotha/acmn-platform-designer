import type { Node } from '@xyflow/react'
import { FormProvider, Controller } from 'react-hook-form'
import { humanTaskSchema } from '@/lib/validation'
import { useValidatedPropertyForm } from '@/hooks/useValidatedPropertyForm'
import { useCanvasStore } from '@/state/canvasStore'
import {
  ValidatedTextInput,
  ValidatedTextarea,
  FieldLabel,
} from './ValidatedFields'

const decoratorKeys = ['autoComplete', 'manualActivation', 'repetition', 'required'] as const
const decoratorLabels: Record<string, string> = {
  autoComplete: 'Auto Complete',
  manualActivation: 'Manual Activation',
  repetition: 'Repetition',
  required: 'Required',
}

export function HumanTaskProperties({ node }: { node: Node }) {
  const { form } = useValidatedPropertyForm(humanTaskSchema, node.id)
  const allNodes = useCanvasStore((s) => s.nodes)

  const cpmNode = allNodes.find(
    (n) =>
      ((n.data as Record<string, unknown>).elementType as string) === 'case-plan-model' ||
      n.type === 'case-plan-model',
  )
  const cpmData = cpmNode?.data as Record<string, unknown> | undefined
  const availableVariables = (cpmData?.caseVariables as Array<{ name: string }>) ?? []

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        <ValidatedTextInput name="label" label="Task Name" tooltip="Display name for this human task in the case plan" />

        <ValidatedTextInput
          name="assigneeRole"
          label="Assignee / Role"
          tooltip="The person or role responsible for completing this task"
          placeholder="e.g. claims-adjuster, supervisor"
        />

        <Controller
          name="referencedVariables"
          render={({ field }) => {
            const value = (field.value ?? []) as string[]
            return (
              <fieldset>
                <FieldLabel label="Referenced Case Variables" tooltip="Case variables included in the generated form for this task" />
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
                          checked={value.includes(v.name)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...value, v.name]
                              : value.filter((n: string) => n !== v.name)
                            field.onChange(next)
                          }}
                        />
                        {v.name}
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
            )
          }}
        />

        <ValidatedTextarea
          name="visibilityRules"
          label="Conditional Visibility Rules"
          tooltip="Expression controlling when this task is visible to assignees"
          placeholder="Visibility condition expression"
          className="font-mono"
        />

        <Controller
          name="planItemDecorators"
          render={({ field }) => {
            const value = (field.value ?? {}) as Record<string, boolean | undefined>
            return (
              <fieldset>
                <FieldLabel label="Decorators" tooltip="CMMN plan-item decorators that control this task's lifecycle behaviour" />
                <div className="space-y-1.5">
                  {decoratorKeys.map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={!!value[key]}
                        onChange={(e) => {
                          field.onChange({ ...value, [key]: e.target.checked })
                        }}
                      />
                      {decoratorLabels[key]}
                    </label>
                  ))}
                </div>
              </fieldset>
            )
          }}
        />
      </div>
    </FormProvider>
  )
}
