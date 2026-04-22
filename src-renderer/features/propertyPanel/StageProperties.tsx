import type { Node } from '@xyflow/react'
import { FormProvider, Controller } from 'react-hook-form'
import { stageSchema } from '@/lib/validation'
import { useValidatedPropertyForm } from '@/hooks/useValidatedPropertyForm'
import {
  ValidatedTextInput,
  ValidatedSelectInput,
  ValidatedTextarea,
  FieldLabel,
} from './ValidatedFields'

const cognitiveModeOptions = [
  { value: 'gather', label: 'Gather' },
  { value: 'analyse', label: 'Analyse' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'decide', label: 'Decide' },
] as const

const decoratorKeys = ['autoComplete', 'manualActivation', 'repetition', 'required'] as const
const decoratorLabels: Record<string, string> = {
  autoComplete: 'Auto Complete',
  manualActivation: 'Manual Activation',
  repetition: 'Repetition',
  required: 'Required',
}

export function StageProperties({ node }: { node: Node }) {
  const { form } = useValidatedPropertyForm(stageSchema, node.id)

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        <ValidatedTextInput name="label" label="Stage Name" tooltip="Display name for this stage in the case plan" />

        <ValidatedSelectInput
          name="cognitiveMode"
          label="Cognitive Mode"
          tooltip="The type of cognitive work performed within this stage"
          options={cognitiveModeOptions}
        />

        <ValidatedTextarea
          name="entrySentry"
          label="Entry Sentry"
          tooltip="Expression that must evaluate to true for this stage to activate"
          placeholder="Expression (editor placeholder)"
          className="font-mono"
        />

        <ValidatedTextarea
          name="exitSentry"
          label="Exit Sentry"
          tooltip="Expression that must evaluate to true for this stage to complete"
          placeholder="Expression (editor placeholder)"
          className="font-mono"
        />

        <Controller
          name="planItemDecorators"
          render={({ field }) => {
            const value = (field.value ?? {}) as Record<string, boolean | undefined>
            return (
              <fieldset>
                <FieldLabel label="Decorators" tooltip="CMMN plan-item decorators that control this stage's lifecycle behaviour" />
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
