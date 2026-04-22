import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { PortInfo, ConnectionEndpoint, PortRegistryLookup } from './portCompatibility'
import { canConnect } from './portCompatibility'
import type { PortType } from './acmnElementTypes'

function makeLookup(ports: Record<string, PortInfo>): PortRegistryLookup {
  return (nodeId: string, handleId: string) => ports[`${nodeId}:${handleId}`]
}

function src(nodeId: string, handleId: string): ConnectionEndpoint {
  return { nodeId, handleId }
}

function tgt(nodeId: string, handleId: string): ConnectionEndpoint {
  return { nodeId, handleId }
}

describe('canConnect', () => {
  describe('same-type pairs (permitted)', () => {
    const sameTypes: PortType[] = ['data', 'event', 'case_file', 'escalation', 'feedback']
    for (const portType of sameTypes) {
      it(`allows ${portType} output → ${portType} input`, () => {
        const lookup = makeLookup({
          'n1:out': { portType, direction: 'output' },
          'n2:in': { portType, direction: 'input' },
        })
        assert.equal(canConnect(src('n1', 'out'), tgt('n2', 'in'), lookup), true)
      })
    }
  })

  describe('any-type wildcard (permitted)', () => {
    const types: PortType[] = ['data', 'event', 'case_file', 'escalation', 'feedback', 'any']
    for (const portType of types) {
      it(`allows any output → ${portType} input`, () => {
        const lookup = makeLookup({
          'n1:out': { portType: 'any', direction: 'output' },
          'n2:in': { portType, direction: 'input' },
        })
        assert.equal(canConnect(src('n1', 'out'), tgt('n2', 'in'), lookup), true)
      })

      it(`allows ${portType} output → any input`, () => {
        const lookup = makeLookup({
          'n1:out': { portType, direction: 'output' },
          'n2:in': { portType: 'any', direction: 'input' },
        })
        assert.equal(canConnect(src('n1', 'out'), tgt('n2', 'in'), lookup), true)
      })
    }
  })

  describe('escalation → any input (specific scenario from matrix)', () => {
    it('allows escalation output → any input', () => {
      const lookup = makeLookup({
        'guardrail1:esc-out': { portType: 'escalation', direction: 'output' },
        'handler1:any-in': { portType: 'any', direction: 'input' },
      })
      assert.equal(canConnect(src('guardrail1', 'esc-out'), tgt('handler1', 'any-in'), lookup), true)
    })
  })

  describe('feedback → data input (specific scenario from matrix)', () => {
    it('allows feedback output → data input via any wildcard on target', () => {
      const lookup = makeLookup({
        'eval1:fb-out': { portType: 'feedback', direction: 'output' },
        'agent1:any-in': { portType: 'any', direction: 'input' },
      })
      assert.equal(canConnect(src('eval1', 'fb-out'), tgt('agent1', 'any-in'), lookup), true)
    })

    it('rejects feedback output → data input (mismatched concrete types)', () => {
      const lookup = makeLookup({
        'eval1:fb-out': { portType: 'feedback', direction: 'output' },
        'agent1:data-in': { portType: 'data', direction: 'input' },
      })
      assert.equal(canConnect(src('eval1', 'fb-out'), tgt('agent1', 'data-in'), lookup), false)
    })
  })

  describe('mismatched types (rejected)', () => {
    const mismatches: [PortType, PortType][] = [
      ['data', 'event'],
      ['data', 'case_file'],
      ['data', 'escalation'],
      ['event', 'case_file'],
      ['event', 'escalation'],
      ['event', 'feedback'],
      ['case_file', 'escalation'],
      ['case_file', 'feedback'],
      ['escalation', 'feedback'],
    ]
    for (const [a, b] of mismatches) {
      it(`rejects ${a} output → ${b} input`, () => {
        const lookup = makeLookup({
          'n1:out': { portType: a, direction: 'output' },
          'n2:in': { portType: b, direction: 'input' },
        })
        assert.equal(canConnect(src('n1', 'out'), tgt('n2', 'in'), lookup), false)
      })
    }
  })

  describe('direction enforcement', () => {
    it('rejects output → output', () => {
      const lookup = makeLookup({
        'n1:out': { portType: 'data', direction: 'output' },
        'n2:out': { portType: 'data', direction: 'output' },
      })
      assert.equal(canConnect(src('n1', 'out'), tgt('n2', 'out'), lookup), false)
    })

    it('rejects input → input', () => {
      const lookup = makeLookup({
        'n1:in': { portType: 'data', direction: 'input' },
        'n2:in': { portType: 'data', direction: 'input' },
      })
      assert.equal(canConnect(src('n1', 'in'), tgt('n2', 'in'), lookup), false)
    })

    it('rejects input → output (reversed direction)', () => {
      const lookup = makeLookup({
        'n1:in': { portType: 'data', direction: 'input' },
        'n2:out': { portType: 'data', direction: 'output' },
      })
      assert.equal(canConnect(src('n1', 'in'), tgt('n2', 'out'), lookup), false)
    })
  })

  describe('unknown ports', () => {
    it('rejects when source port not found', () => {
      const lookup = makeLookup({
        'n2:in': { portType: 'data', direction: 'input' },
      })
      assert.equal(canConnect(src('n1', 'out'), tgt('n2', 'in'), lookup), false)
    })

    it('rejects when target port not found', () => {
      const lookup = makeLookup({
        'n1:out': { portType: 'data', direction: 'output' },
      })
      assert.equal(canConnect(src('n1', 'out'), tgt('n2', 'in'), lookup), false)
    })
  })
})
