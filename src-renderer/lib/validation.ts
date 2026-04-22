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
