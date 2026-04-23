import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { Node, Edge } from '@xyflow/react'
import type { CanvasData } from './commands'
import {
  AddWireCommand,
  RemoveWireCommand,
  UpdateWireCommand,
  BatchCommand,
  AddElementCommand,
  RemoveElementCommand,
} from './commands'

function makeNode(id: string): Node {
  return { id, position: { x: 0, y: 0 }, data: {} }
}

function makeEdge(id: string, source: string, target: string, data?: Record<string, unknown>): Edge {
  return { id, source, target, type: 'acmn-wire', data }
}

function makeData(nodes: Node[] = [], edges: Edge[] = []): CanvasData {
  return { nodes, edges, caseVariables: [] }
}

describe('AddWireCommand', () => {
  it('apply adds edge, undo removes it, redo adds it back', () => {
    const edge = makeEdge('e1', 'n1', 'n2', { wireType: 'data' })
    const cmd = new AddWireCommand(edge)

    const initial = makeData([makeNode('n1'), makeNode('n2')])
    assert.equal(initial.edges.length, 0)

    const afterAdd = cmd.apply(initial)
    assert.equal(afterAdd.edges.length, 1)
    assert.equal(afterAdd.edges[0].id, 'e1')
    assert.equal(afterAdd.edges[0].source, 'n1')
    assert.equal(afterAdd.edges[0].target, 'n2')
    assert.deepEqual(afterAdd.edges[0].data, { wireType: 'data' })

    const afterUndo = cmd.undo(afterAdd)
    assert.equal(afterUndo.edges.length, 0)

    const afterRedo = cmd.apply(afterUndo)
    assert.equal(afterRedo.edges.length, 1)
    assert.equal(afterRedo.edges[0].id, 'e1')
  })
})

describe('RemoveWireCommand', () => {
  it('apply removes edge, undo restores it with identical id, endpoints, type, and properties', () => {
    const edge = makeEdge('e1', 'n1', 'n2', { wireType: 'escalation', buffering: 'batched' })
    const initial = makeData(
      [makeNode('n1'), makeNode('n2')],
      [edge],
    )

    const cmd = new RemoveWireCommand(['e1'])

    const afterRemove = cmd.apply(initial)
    assert.equal(afterRemove.edges.length, 0)

    const afterUndo = cmd.undo(afterRemove)
    assert.equal(afterUndo.edges.length, 1)
    assert.equal(afterUndo.edges[0].id, 'e1')
    assert.equal(afterUndo.edges[0].source, 'n1')
    assert.equal(afterUndo.edges[0].target, 'n2')
    assert.equal(afterUndo.edges[0].type, 'acmn-wire')
    assert.deepEqual(afterUndo.edges[0].data, { wireType: 'escalation', buffering: 'batched' })
  })

  it('redo removes the wire again after undo', () => {
    const edge = makeEdge('e1', 'n1', 'n2')
    const initial = makeData([makeNode('n1'), makeNode('n2')], [edge])
    const cmd = new RemoveWireCommand(['e1'])

    const afterRemove = cmd.apply(initial)
    const afterUndo = cmd.undo(afterRemove)
    assert.equal(afterUndo.edges.length, 1)

    const afterRedo = cmd.apply(afterUndo)
    assert.equal(afterRedo.edges.length, 0)
  })
})

describe('UpdateWireCommand', () => {
  it('apply updates wire properties, undo restores original', () => {
    const edge = makeEdge('e1', 'n1', 'n2', { wireType: 'data', buffering: 'immediate' })
    const initial = makeData([makeNode('n1'), makeNode('n2')], [edge])

    const cmd = new UpdateWireCommand('e1', {
      wireType: 'confidence-gated',
      confidenceThreshold: 0.85,
    })

    const afterUpdate = cmd.apply(initial)
    assert.equal(afterUpdate.edges[0].data?.wireType, 'confidence-gated')
    assert.equal(afterUpdate.edges[0].data?.confidenceThreshold, 0.85)
    assert.equal(afterUpdate.edges[0].data?.buffering, 'immediate')

    const afterUndo = cmd.undo(afterUpdate)
    assert.equal(afterUndo.edges[0].data?.wireType, 'data')
    assert.equal(afterUndo.edges[0].data?.buffering, 'immediate')
    assert.equal(afterUndo.edges[0].data?.confidenceThreshold, undefined)
  })

  it('initializes edge data when none exists', () => {
    const edge = makeEdge('e1', 'n1', 'n2')
    const initial = makeData([makeNode('n1'), makeNode('n2')], [edge])

    const cmd = new UpdateWireCommand('e1', { wireType: 'event' })

    const afterUpdate = cmd.apply(initial)
    assert.equal(afterUpdate.edges[0].data?.wireType, 'event')

    const afterUndo = cmd.undo(afterUpdate)
    assert.equal(afterUndo.edges[0].data, undefined)
  })
})

describe('cascade-delete via BatchCommand', () => {
  it('undo restores both node and its connected wires', () => {
    const n1 = makeNode('n1')
    const n2 = makeNode('n2')
    const n3 = makeNode('n3')
    const e1 = makeEdge('e1', 'n1', 'n2', { wireType: 'data' })
    const e2 = makeEdge('e2', 'n2', 'n3', { wireType: 'event' })
    const e3 = makeEdge('e3', 'n1', 'n3', { wireType: 'escalation' })
    const initial = makeData([n1, n2, n3], [e1, e2, e3])

    const cascadedEdgeIds = ['e1', 'e2']
    const batch = new BatchCommand([
      new RemoveWireCommand(cascadedEdgeIds),
      new RemoveElementCommand(['n2']),
    ])

    const afterDelete = batch.apply(initial)
    assert.equal(afterDelete.nodes.length, 2)
    assert.ok(!afterDelete.nodes.find((n) => n.id === 'n2'))
    assert.equal(afterDelete.edges.length, 1)
    assert.equal(afterDelete.edges[0].id, 'e3')

    const afterUndo = batch.undo(afterDelete)
    assert.equal(afterUndo.nodes.length, 3)
    assert.ok(afterUndo.nodes.find((n) => n.id === 'n2'))
    assert.equal(afterUndo.edges.length, 3)
    assert.ok(afterUndo.edges.find((e) => e.id === 'e1'))
    assert.ok(afterUndo.edges.find((e) => e.id === 'e2'))
    assert.ok(afterUndo.edges.find((e) => e.id === 'e3'))

    const restored1 = afterUndo.edges.find((e) => e.id === 'e1')!
    assert.equal(restored1.source, 'n1')
    assert.equal(restored1.target, 'n2')
    assert.deepEqual(restored1.data, { wireType: 'data' })

    const restored2 = afterUndo.edges.find((e) => e.id === 'e2')!
    assert.equal(restored2.source, 'n2')
    assert.equal(restored2.target, 'n3')
    assert.deepEqual(restored2.data, { wireType: 'event' })
  })

  it('redo after undo removes node and wires again', () => {
    const n1 = makeNode('n1')
    const n2 = makeNode('n2')
    const e1 = makeEdge('e1', 'n1', 'n2')
    const initial = makeData([n1, n2], [e1])

    const batch = new BatchCommand([
      new RemoveWireCommand(['e1']),
      new RemoveElementCommand(['n2']),
    ])

    const afterDelete = batch.apply(initial)
    const afterUndo = batch.undo(afterDelete)
    const afterRedo = batch.apply(afterUndo)

    assert.equal(afterRedo.nodes.length, 1)
    assert.equal(afterRedo.edges.length, 0)
  })
})
