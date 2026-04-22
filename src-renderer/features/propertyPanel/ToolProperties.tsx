import type { Node } from '@xyflow/react'
import { FormProvider, Controller } from 'react-hook-form'
import { toolSchema } from '@/lib/validation'
import { useValidatedPropertyForm } from '@/hooks/useValidatedPropertyForm'
import { MonacoField } from './MonacoField'
import {
  FieldLabel,
  FieldError,
  ValidatedTextInput,
  ValidatedSelectInput,
  ValidatedTextarea,
} from './ValidatedFields'

const invocationPolicyOptions = [
  { value: 'auto', label: 'Auto' },
  { value: 'confirm_first', label: 'Confirm First' },
  { value: 'supervised', label: 'Supervised' },
] as const

export function ToolProperties({ node }: { node: Node }) {
  const { form } = useValidatedPropertyForm(toolSchema, node.id)

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        <div>
          <FieldLabel label="Tool ID" tooltip="Unique identifier for this tool within the case plan model" />
          <input
            className="w-full rounded border border-border bg-muted px-2 py-1 text-xs font-mono"
            value={node.id}
            readOnly
          />
        </div>

        <ValidatedTextInput name="label" label="Name" tooltip="Display name for this tool as shown on the canvas and in agent tool lists" />

        <ValidatedTextarea
          name="description"
          label="Description"
          tooltip="A brief explanation of what this tool does and when it should be invoked"
          placeholder="Describe what this tool does"
        />

        <Controller
          name="inputSchema"
          render={({ field, fieldState }) => (
            <div>
              <FieldLabel label="Input Schema" tooltip="JSON schema defining the expected input parameters for this tool" />
              <MonacoField
                value={field.value ?? '{}'}
                onChange={field.onChange}
                language="json"
                label="Input Schema"
              />
              <FieldError message={fieldState.error?.message} />
            </div>
          )}
        />

        <Controller
          name="outputSchema"
          render={({ field, fieldState }) => (
            <div>
              <FieldLabel label="Output Schema" tooltip="JSON schema defining the structure of this tool's output" />
              <MonacoField
                value={field.value ?? '{}'}
                onChange={field.onChange}
                language="json"
                label="Output Schema"
              />
              <FieldError message={fieldState.error?.message} />
            </div>
          )}
        />

        <ValidatedSelectInput
          name="invocationPolicy"
          label="Invocation Policy"
          tooltip="Controls whether the tool runs automatically or requires human confirmation"
          options={invocationPolicyOptions}
        />
      </div>

    </FormProvider>
  )
}
