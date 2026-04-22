import type { Node } from '@xyflow/react'
import { FormProvider, Controller } from 'react-hook-form'
import { guardrailSchema } from '@/lib/validation'
import { useValidatedPropertyForm } from '@/hooks/useValidatedPropertyForm'
import { MonacoField } from './MonacoField'
import {
  FieldLabel,
  FieldError,
  ValidatedTextInput,
  ValidatedSelectInput,
} from './ValidatedFields'

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
  const { form } = useValidatedPropertyForm(guardrailSchema, node.id)

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        <ValidatedSelectInput
          name="guardrailType"
          label="Guardrail Type"
          tooltip="The category of safety check this guardrail performs"
          options={guardrailTypeOptions}
        />

        <Controller
          name="ruleDefinition"
          render={({ field, fieldState }) => (
            <div>
              <FieldLabel label="Rule Definition / Prompt" tooltip="The rule expression or prompt that defines what this guardrail checks" />
              <MonacoField
                value={field.value ?? ''}
                onChange={field.onChange}
                language="plaintext"
                label="Rule Definition / Prompt"
              />
              <FieldError message={fieldState.error?.message} />
            </div>
          )}
        />

        <ValidatedSelectInput
          name="violationAction"
          label="Violation Action"
          tooltip="What happens when this guardrail detects a violation"
          options={violationActionOptions}
        />

        <div>
          <FieldLabel label="Port Configuration" tooltip="Labels for the pass and fail output ports of this guardrail" />
          <div className="space-y-2 rounded border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <Controller
                name="passPortLabel"
                render={({ field, fieldState }) => (
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground shrink-0 w-12">Pass</label>
                      <input
                        className={`flex-1 rounded border ${fieldState.error ? 'border-red-500' : 'border-border'} bg-background px-2 py-1 text-sm`}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </div>
                    <FieldError message={fieldState.error?.message} />
                  </div>
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <Controller
                name="failPortLabel"
                render={({ field, fieldState }) => (
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground shrink-0 w-12">Fail</label>
                      <input
                        className={`flex-1 rounded border ${fieldState.error ? 'border-red-500' : 'border-border'} bg-background px-2 py-1 text-sm`}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </div>
                    <FieldError message={fieldState.error?.message} />
                  </div>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  )
}
