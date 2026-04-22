import { useCallback } from 'react'
import type { Node } from '@xyflow/react'
import { Plus, Trash2 } from 'lucide-react'
import { useCanvasStore } from '@/state/canvasStore'
import { UpdateElementPropertiesCommand } from '@/state/commands'

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

interface Criterion {
  name: string
  weight: number
  threshold: number
}

function parseCriteria(raw: unknown): Criterion[] {
  if (Array.isArray(raw)) return raw as Criterion[]
  return []
}

export function EvaluatorProperties({ node }: { node: Node }) {
  const pushCommand = useCanvasStore((s) => s.pushCommand)
  const data = node.data as Record<string, unknown>

  const evaluatorType = String(data.evaluatorType ?? 'llm_judge')
  const criteria = parseCriteria(data.criteria)
  const maxRetries = Number(data.maxRetries ?? 3)
  const onExhaustedPolicy = String(data.onExhaustedPolicy ?? 'fail')
  const feedbackPortLabel = String(data.feedbackPortLabel ?? 'feedback')
  const escalationPortLabel = String(data.escalationPortLabel ?? 'escalation')

  const updateProp = useCallback(
    (props: Record<string, unknown>) => {
      pushCommand(new UpdateElementPropertiesCommand(node.id, props, {}))
    },
    [node.id, pushCommand],
  )

  const addCriterion = useCallback(() => {
    const next = [...criteria, { name: '', weight: 1, threshold: 0.5 }]
    updateProp({ criteria: next })
  }, [criteria, updateProp])

  const removeCriterion = useCallback(
    (index: number) => {
      const next = criteria.filter((_, i) => i !== index)
      updateProp({ criteria: next })
    },
    [criteria, updateProp],
  )

  const updateCriterion = useCallback(
    (index: number, field: keyof Criterion, value: string | number) => {
      const next = criteria.map((c, i) => (i === index ? { ...c, [field]: value } : c))
      updateProp({ criteria: next })
    },
    [criteria, updateProp],
  )

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1">Evaluator Type</label>
        <select
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={evaluatorType}
          onChange={(e) => updateProp({ evaluatorType: e.target.value })}
        >
          {evaluatorTypeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium">Criteria</label>
          <button
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs hover:bg-accent text-muted-foreground"
            onClick={addCriterion}
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>
        {criteria.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">No criteria defined. Click Add to create one.</p>
        ) : (
          <div className="space-y-2">
            {criteria.map((c, i) => (
              <div key={i} className="rounded border border-border bg-muted/30 p-2 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
                    placeholder="Criterion name"
                    value={c.name}
                    onChange={(e) => updateCriterion(i, 'name', e.target.value)}
                  />
                  <button
                    className="flex items-center justify-center w-6 h-6 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                    onClick={() => removeCriterion(i)}
                    aria-label="Remove criterion"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-muted-foreground mb-0.5">Weight</label>
                    <input
                      type="number"
                      className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                      value={c.weight}
                      min={0}
                      step={0.1}
                      onChange={(e) => updateCriterion(i, 'weight', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-muted-foreground mb-0.5">Threshold</label>
                    <input
                      type="number"
                      className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                      value={c.threshold}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(e) => updateCriterion(i, 'threshold', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Max Retries</label>
        <input
          type="number"
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={maxRetries}
          min={0}
          max={10}
          onChange={(e) => updateProp({ maxRetries: parseInt(e.target.value, 10) || 0 })}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">On Exhausted Policy</label>
        <select
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={onExhaustedPolicy}
          onChange={(e) => updateProp({ onExhaustedPolicy: e.target.value })}
        >
          {onExhaustedPolicyOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Port Configuration</label>
        <div className="space-y-2 rounded border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <label className="text-xs text-muted-foreground shrink-0 w-16">Feedback</label>
            <input
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
              value={feedbackPortLabel}
              onChange={(e) => updateProp({ feedbackPortLabel: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <label className="text-xs text-muted-foreground shrink-0 w-16">Escalation</label>
            <input
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
              value={escalationPortLabel}
              onChange={(e) => updateProp({ escalationPortLabel: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
