import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { caseVariableSchema, caseVariablesArraySchema, ACMN_VARIABLE_TYPES } from './validation'

function makeVar(overrides: Record<string, unknown> = {}) {
  return {
    name: 'testVar',
    type: 'string',
    required: false,
    label: 'Test Variable',
    readOnly: false,
    ...overrides,
  }
}

describe('caseVariableSchema', () => {
  describe('all eight ACMN variable types round-trip', () => {
    for (const varType of ACMN_VARIABLE_TYPES) {
      it(`accepts type "${varType}"`, () => {
        const input = makeVar({
          type: varType,
          ...(varType === 'enum' ? { enumValues: ['a', 'b'] } : {}),
        })
        const result = caseVariableSchema.safeParse(input)
        assert.ok(result.success, `Expected type "${varType}" to be accepted`)
        assert.equal(result.data.type, varType)
      })
    }
  })

  it('rejects an unknown type', () => {
    const result = caseVariableSchema.safeParse(makeVar({ type: 'unknown' }))
    assert.ok(!result.success)
  })

  it('rejects enum without enumValues', () => {
    const result = caseVariableSchema.safeParse(makeVar({ type: 'enum' }))
    assert.ok(!result.success)
    const enumIssue = result.error.issues.find((i) => i.path.includes('enumValues'))
    assert.ok(enumIssue, 'Expected an issue on enumValues path')
  })

  it('rejects enum with empty enumValues', () => {
    const result = caseVariableSchema.safeParse(makeVar({ type: 'enum', enumValues: [] }))
    assert.ok(!result.success)
  })

  it('accepts enum with enumValues', () => {
    const result = caseVariableSchema.safeParse(
      makeVar({ type: 'enum', enumValues: ['a', 'b', 'c'] })
    )
    assert.ok(result.success)
  })

  it('accepts a variable with a default value', () => {
    const result = caseVariableSchema.safeParse(makeVar({ default: 'hello' }))
    assert.ok(result.success)
    assert.equal(result.data.default, 'hello')
  })

  it('rejects a variable with empty name', () => {
    const result = caseVariableSchema.safeParse(makeVar({ name: '' }))
    assert.ok(!result.success)
  })
})

describe('caseVariablesArraySchema', () => {
  it('accepts an array of unique variables', () => {
    const input = [
      makeVar({ name: 'var1', type: 'string' }),
      makeVar({ name: 'var2', type: 'integer' }),
    ]
    const result = caseVariablesArraySchema.safeParse(input)
    assert.ok(result.success)
  })

  it('rejects duplicate variable names', () => {
    const input = [
      makeVar({ name: 'duplicate', type: 'string' }),
      makeVar({ name: 'duplicate', type: 'integer' }),
    ]
    const result = caseVariablesArraySchema.safeParse(input)
    assert.ok(!result.success)
    const dupIssue = result.error.issues.find((i) =>
      i.message.includes('Duplicate variable name')
    )
    assert.ok(dupIssue, 'Expected a duplicate name issue')
  })

  it('accepts an empty array', () => {
    const result = caseVariablesArraySchema.safeParse([])
    assert.ok(result.success)
  })
})
