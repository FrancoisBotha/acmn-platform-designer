import { z } from 'zod'

export const ACMN_VARIABLE_TYPES = [
  'string',
  'integer',
  'float',
  'boolean',
  'date',
  'datetime',
  'enum',
  'currency',
] as const

export type AcmnVariableType = (typeof ACMN_VARIABLE_TYPES)[number]

export const caseVariableSchema = z
  .object({
    name: z.string().min(1),
    type: z.enum(ACMN_VARIABLE_TYPES),
    default: z.unknown().optional(),
    required: z.boolean(),
    label: z.string(),
    readOnly: z.boolean(),
    enumValues: z.array(z.string().min(1)).min(1).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === 'enum' && (!val.enumValues || val.enumValues.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'enumValues is required when type is enum',
        path: ['enumValues'],
      })
    }
  })

export type CaseVariable = z.infer<typeof caseVariableSchema>

export const caseVariablesArraySchema = z
  .array(caseVariableSchema)
  .superRefine((variables, ctx) => {
    const seen = new Set<string>()
    for (let i = 0; i < variables.length; i++) {
      const name = variables[i].name
      if (seen.has(name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate variable name: ${name}`,
          path: [i, 'name'],
        })
      }
      seen.add(name)
    }
  })

// --- Element-type schemas (one per ACMN element type) ---

const portEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  direction: z.enum(['input', 'output']),
  portType: z.string(),
  schema: z.string().optional(),
})

const confidenceParamSchema = z.object({
  key: z.string(),
  value: z.string(),
})

const promotionRuleSchema = z.object({
  from: z.string(),
  to: z.string(),
  condition: z.string(),
})

const planItemDecoratorsSchema = z.object({
  autoComplete: z.boolean().optional(),
  manualActivation: z.boolean().optional(),
  repetition: z.boolean().optional(),
  required: z.boolean().optional(),
})

const criterionSchema = z.object({
  name: z.string().min(1, 'Criterion name is required'),
  weight: z.number().min(0, 'Weight cannot be negative'),
  threshold: z.number().min(0, 'Threshold cannot be negative').max(1, 'Threshold cannot exceed 1'),
})

export const agentSchema = z.object({
  label: z.string().min(1, 'Name is required'),
  persona: z.string().optional(),
  role: z.string().optional(),
  owner: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0, 'Temperature cannot be negative').max(2, 'Temperature cannot exceed 2').optional(),
  maxTokens: z.number().int('Max tokens must be a whole number').min(1, 'Max tokens must be a positive integer').optional(),
  readableCaseFileItems: z.array(z.string()).optional(),
  writableCaseFileItems: z.array(z.string()).optional(),
  threadVisibility: z.enum(['all', 'own', 'none']).optional(),
  contextScope: z.enum(['full', 'restricted', 'scoped']).optional(),
  reasoningStrategy: z.enum(['react', 'plan_execute', 'reflect', 'debate']).optional(),
  maxTurns: z.number().int('Max turns must be a whole number').min(1, 'Max turns must be at least 1').optional(),
  budget: z.string().optional(),
  confidenceParams: z.array(confidenceParamSchema).optional(),
  customPorts: z
    .array(portEntrySchema)
    .superRefine((ports, ctx) => {
      const seen = new Set<string>()
      for (let i = 0; i < ports.length; i++) {
        const name = ports[i].name
        if (name && seen.has(name)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Port name "${name}" is already used by another port`,
            path: [i, 'name'],
          })
        }
        if (name) seen.add(name)
      }
    })
    .optional(),
  entrySentry: z.string().optional(),
  exitSentry: z.string().optional(),
  planItemDecorators: planItemDecoratorsSchema.optional(),
  turnRetentionMode: z.enum(['all', 'last_n', 'none', 'summary']).optional(),
  turnRetentionCount: z.number().int().min(1, 'Retain count must be at least 1').optional(),
  promotionRules: z.array(promotionRuleSchema).optional(),
  toolSettings: z
    .record(z.object({ enabled: z.boolean(), policy: z.string() }))
    .optional(),
})

export type AgentFormValues = z.infer<typeof agentSchema>

export const toolSchema = z.object({
  label: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  inputSchema: z.string().optional(),
  outputSchema: z.string().optional(),
  invocationPolicy: z.enum(['auto', 'confirm_first', 'supervised']).optional(),
})

export type ToolFormValues = z.infer<typeof toolSchema>

export const guardrailSchema = z.object({
  guardrailType: z.enum(['content_filter', 'schema_validation', 'policy_check', 'rate_limit', 'custom']),
  ruleDefinition: z.string().optional(),
  violationAction: z.enum(['block', 'warn', 'escalate', 'log']),
  passPortLabel: z.string().min(1, 'Pass port label is required'),
  failPortLabel: z.string().min(1, 'Fail port label is required'),
})

export type GuardrailFormValues = z.infer<typeof guardrailSchema>

export const evaluatorSchema = z.object({
  evaluatorType: z.enum(['llm_judge', 'rubric', 'exact_match', 'semantic_similarity', 'custom']),
  criteria: z.array(criterionSchema).optional(),
  maxRetries: z.number().int('Max retries must be a whole number').min(0, 'Max retries cannot be negative').max(10, 'Max retries cannot exceed 10').optional(),
  onExhaustedPolicy: z.enum(['fail', 'pass_last', 'escalate']),
  feedbackPortLabel: z.string().min(1, 'Feedback port label is required'),
  escalationPortLabel: z.string().min(1, 'Escalation port label is required'),
})

export type EvaluatorFormValues = z.infer<typeof evaluatorSchema>

export const connectorSchema = z.object({
  connectorType: z.enum(['email', 'webhook', 'file-watch', 'schedule', 'database', 'event', 'api']),
  label: z.string().min(1, 'Name is required'),
  config: z.record(z.unknown()).optional(),
  filterRules: z.string().optional(),
  fieldMapping: z.string().optional(),
  targetCpm: z.string().optional(),
  dailySignalLimit: z.number().int().min(0, 'Signal limit cannot be negative').optional(),
  active: z.boolean().optional(),
})

export type ConnectorFormValues = z.infer<typeof connectorSchema>

export const stageSchema = z.object({
  label: z.string().min(1, 'Stage name is required'),
  cognitiveMode: z.enum(['gather', 'analyse', 'draft', 'review', 'decide']).optional(),
  entrySentry: z.string().optional(),
  exitSentry: z.string().optional(),
  planItemDecorators: planItemDecoratorsSchema.optional(),
})

export type StageFormValues = z.infer<typeof stageSchema>

export const milestoneSchema = z.object({
  label: z.string().min(1, 'Milestone name is required'),
  criteriaType: z.enum(['expression', 'manual', 'event']).optional(),
  criteriaExpression: z.string().optional(),
  revocationCondition: z.string().optional(),
})

export type MilestoneFormValues = z.infer<typeof milestoneSchema>

export const humanTaskSchema = z.object({
  label: z.string().min(1, 'Task name is required'),
  assigneeRole: z.string().optional(),
  referencedVariables: z.array(z.string()).optional(),
  visibilityRules: z.string().optional(),
  planItemDecorators: planItemDecoratorsSchema.optional(),
})

export type HumanTaskFormValues = z.infer<typeof humanTaskSchema>

export const domainContextSchema = z.object({
  label: z.string().min(1, 'Domain name is required'),
  version: z.string().optional(),
  bindingMode: z.enum(['reference', 'copy']).optional(),
})

export type DomainContextFormValues = z.infer<typeof domainContextSchema>

export const cpmSchema = z.object({
  name: z.string().min(1, 'Case plan name is required'),
  version: z.string().optional(),
  description: z.string().optional(),
  domainBinding: z.string().optional(),
})

export type CpmFormValues = z.infer<typeof cpmSchema>
