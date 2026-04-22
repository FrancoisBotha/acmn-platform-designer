import { useCallback } from 'react'
import type { Node } from '@xyflow/react'
import { Plus, Trash2 } from 'lucide-react'
import { FormProvider, Controller, useFormContext, useFieldArray } from 'react-hook-form'
import { evaluatorSchema } from '@/lib/validation'
import { useValidatedPropertyForm } from '@/hooks/useValidatedPropertyForm'
import {
  FieldLabel,
  FieldError,
  ValidatedSelectInput,
  ValidatedNumberInput,
  ValidatedTextInput,
} from './ValidatedFields'

const evaluatorTypeOptions = [
  { value: 'llm_judge', label: 'LLM Judge' },
  { value: 'rubric', label: 'Rubric' },
  { value: 'exact_match', label: 'Exact Match' },
  { value: 'semantic_similarity', label: 'Semantic Similarity' },
  { value: 'custom', label: 'Custom' },
] as const

const onExhaustedPolicyOptions = [
  { value: 'fail', label: 'Fail' },
  { value: 'pass_last', label: 'Pass Last Result' },
  { value: 'escalate', label: 'Escalate' },
] as const

function CriteriaSection() {
  const { control, formState: { errors } } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name: 'criteria' })

  const addCriterion = useCallback(() => {
    append({ name: '', weight: 1, threshold: 0.5 })
  }, [append])

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <FieldLabel label="Criteria" tooltip="Evaluation criteria with individual weights and pass/fail thresholds" />
        <button
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs hover:bg-accent text-muted-foreground"
          onClick={addCriterion}
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">
          No criteria defined. Click Add to create one.
        </p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, i) => {
            const criteriaErrors = errors.criteria as
              | { [index: number]: { name?: { message?: string }; weight?: { message?: string }; threshold?: { message?: string } } }
              | undefined

            return (
              <div key={field.id} className="rounded border border-border bg-muted/30 p-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Controller
                    name={`criteria.${i}.name`}
                    control={control}
                    render={({ field: f, fieldState }) => (
                      <div className="flex-1">
                        <input
                          className={`w-full rounded border ${fieldState.error ? 'border-red-500' : 'border-border'} bg-background px-2 py-1 text-sm`}
                          placeholder="Criterion name"
                          value={f.value ?? ''}
                          onChange={f.onChange}
                          onBlur={f.onBlur}
                        />
                        <FieldError message={fieldState.error?.message} />
                      </div>
                    )}
                  />
                  <button
                    className="flex items-center justify-center w-6 h-6 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(i)}
                    aria-label="Remove criterion"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-muted-foreground mb-0.5">Weight</label>
                    <Controller
                      name={`criteria.${i}.weight`}
                      control={control}
                      render={({ field: f, fieldState }) => (
                        <>
                          <input
                            type="number"
                            className={`w-full rounded border ${fieldState.error ? 'border-red-500' : 'border-border'} bg-background px-2 py-1 text-sm`}
                            value={f.value ?? ''}
                            min={0}
                            step={0.1}
                            onChange={(e) => f.onChange(parseFloat(e.target.value) || 0)}
                            onBlur={f.onBlur}
                          />
                          <FieldError message={fieldState.error?.message} />
                        </>
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-muted-foreground mb-0.5">Threshold</label>
                    <Controller
                      name={`criteria.${i}.threshold`}
                      control={control}
                      render={({ field: f, fieldState }) => (
                        <>
                          <input
                            type="number"
                            className={`w-full rounded border ${fieldState.error ? 'border-red-500' : 'border-border'} bg-background px-2 py-1 text-sm`}
                            value={f.value ?? ''}
                            min={0}
                            max={1}
                            step={0.05}
                            onChange={(e) => f.onChange(parseFloat(e.target.value) || 0)}
                            onBlur={f.onBlur}
                          />
                          <FieldError message={fieldState.error?.message} />
                        </>
                      )}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function EvaluatorProperties({ node }: { node: Node }) {
  const { form } = useValidatedPropertyForm(evaluatorSchema, node.id)

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        <ValidatedSelectInput
          name="evaluatorType"
          label="Evaluator Type"
          tooltip="The evaluation method used to assess agent output quality"
          options={evaluatorTypeOptions}
        />

        <CriteriaSection />

        <ValidatedNumberInput
          name="maxRetries"
          label="Max Retries"
          tooltip="Maximum number of retry attempts before the on-exhausted policy takes effect"
          min={0}
          max={10}
        />

        <ValidatedSelectInput
          name="onExhaustedPolicy"
          label="On Exhausted Policy"
          tooltip="What happens when all retries are exhausted without a passing evaluation"
          options={onExhaustedPolicyOptions}
        />

        <div>
          <FieldLabel label="Port Configuration" tooltip="Labels for the feedback and escalation output ports" />
          <div className="space-y-2 rounded border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <Controller
                name="feedbackPortLabel"
                render={({ field, fieldState }) => (
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground shrink-0 w-16">Feedback</label>
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
                name="escalationPortLabel"
                render={({ field, fieldState }) => (
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground shrink-0 w-16">Escalation</label>
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
