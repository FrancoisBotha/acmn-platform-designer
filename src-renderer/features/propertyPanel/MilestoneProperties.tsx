import type { Node } from '@xyflow/react'
import { FormProvider } from 'react-hook-form'
import { milestoneSchema } from '@/lib/validation'
import { useValidatedPropertyForm } from '@/hooks/useValidatedPropertyForm'
import {
  ValidatedTextInput,
  ValidatedSelectInput,
  ValidatedTextarea,
} from './ValidatedFields'

const criteriaTypeOptions = [
  { value: 'expression', label: 'Expression' },
  { value: 'manual', label: 'Manual' },
  { value: 'event', label: 'Event' },
] as const

export function MilestoneProperties({ node }: { node: Node }) {
  const { form } = useValidatedPropertyForm(milestoneSchema, node.id)

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        <ValidatedTextInput name="label" label="Milestone Name" tooltip="Display name for this milestone in the case plan" />

        <ValidatedSelectInput
          name="criteriaType"
          label="Criteria Type"
          tooltip="How this milestone's completion is determined (expression, manual, or event)"
          options={criteriaTypeOptions}
        />

        <ValidatedTextarea
          name="criteriaExpression"
          label="Criteria Expression"
          tooltip="The expression evaluated to determine whether this milestone is achieved"
          placeholder="Expression (editor placeholder)"
          className="font-mono"
        />

        <ValidatedTextarea
          name="revocationCondition"
          label="Revocation Condition"
          tooltip="Expression that, when true, revokes this milestone's achieved status"
          placeholder="Condition under which this milestone is revoked"
          className="font-mono"
        />
      </div>
    </FormProvider>
  )
}
