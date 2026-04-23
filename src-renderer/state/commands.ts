import { enablePatches, produceWithPatches, applyPatches, produce, type Patch } from 'immer'
import type { Node, Edge } from '@xyflow/react'
import type { CaseVariable } from '@/lib/validation'

enablePatches()

export interface CanvasData {
  nodes: Node[]
  edges: Edge[]
  caseVariables: CaseVariable[]
}

export interface CanvasCommand {
  readonly type: string
  apply(data: CanvasData): CanvasData
  undo(data: CanvasData): CanvasData
}

abstract class PatchCommand implements CanvasCommand {
  abstract readonly type: string
  private patches: Patch[] = []
  private inversePatches: Patch[] = []
  private applied = false

  protected abstract recipe(draft: CanvasData): void

  apply(data: CanvasData): CanvasData {
    if (!this.applied) {
      const [next, patches, inversePatches] = produceWithPatches(data, (draft) => this.recipe(draft))
      this.patches = patches
      this.inversePatches = inversePatches
      this.applied = true
      return next
    }
    return applyPatches(data, this.patches)
  }

  undo(data: CanvasData): CanvasData {
    return applyPatches(data, this.inversePatches)
  }
}

export class AddElementCommand extends PatchCommand {
  readonly type = 'addElement'
  constructor(private node: Node) {
    super()
  }

  protected recipe(draft: CanvasData) {
    draft.nodes.push(this.node as Node)
  }
}

export class RemoveElementCommand extends PatchCommand {
  readonly type = 'removeElement'
  constructor(
    private nodeIds: string[],
    private edgeIds: string[] = [],
  ) {
    super()
  }

  protected recipe(draft: CanvasData) {
    const nodeIdSet = new Set(this.nodeIds)
    const edgeIdSet = new Set(this.edgeIds)
    draft.edges = draft.edges.filter(
      (e) => !edgeIdSet.has(e.id) && !nodeIdSet.has(e.source) && !nodeIdSet.has(e.target),
    )
    draft.nodes = draft.nodes.filter((n) => !nodeIdSet.has(n.id))
  }
}

export interface MoveEntry {
  id: string
  from: { x: number; y: number }
  to: { x: number; y: number }
}

export class MoveElementCommand implements CanvasCommand {
  readonly type = 'moveElement'
  constructor(private moves: MoveEntry[]) {}

  apply(data: CanvasData): CanvasData {
    return produce(data, (draft) => {
      for (const m of this.moves) {
        const node = draft.nodes.find((n) => n.id === m.id)
        if (node) {
          node.position = { x: m.to.x, y: m.to.y }
        }
      }
    })
  }

  undo(data: CanvasData): CanvasData {
    return produce(data, (draft) => {
      for (const m of this.moves) {
        const node = draft.nodes.find((n) => n.id === m.id)
        if (node) {
          node.position = { x: m.from.x, y: m.from.y }
        }
      }
    })
  }
}

export class UpdateElementPropertiesCommand extends PatchCommand {
  readonly type = 'updateElementProperties'
  constructor(
    private nodeId: string,
    private newProps: Record<string, unknown>,
    private oldProps: Record<string, unknown>,
  ) {
    super()
  }

  protected recipe(draft: CanvasData) {
    const node = draft.nodes.find((n) => n.id === this.nodeId)
    if (node) {
      Object.assign(node.data, this.newProps)
    }
  }
}

export class AddWireCommand extends PatchCommand {
  readonly type = 'addWire'
  constructor(private edge: Edge) {
    super()
  }

  protected recipe(draft: CanvasData) {
    draft.edges.push(this.edge as Edge)
  }
}

export class RemoveWireCommand extends PatchCommand {
  readonly type = 'removeWire'
  constructor(private edgeIds: string[]) {
    super()
  }

  protected recipe(draft: CanvasData) {
    const idSet = new Set(this.edgeIds)
    draft.edges = draft.edges.filter((e) => !idSet.has(e.id))
  }
}

export class UpdateWireCommand extends PatchCommand {
  readonly type = 'updateWire'
  constructor(
    private edgeId: string,
    private newProps: Record<string, unknown>,
  ) {
    super()
  }

  protected recipe(draft: CanvasData) {
    const edge = draft.edges.find((e) => e.id === this.edgeId)
    if (edge) {
      if (!edge.data) edge.data = {}
      Object.assign(edge.data, this.newProps)
      if (this.newProps.wireType) {
        edge.type = this.newProps.wireType as string
      }
    }
  }
}

export class BatchCommand implements CanvasCommand {
  readonly type = 'batch'
  constructor(private commands: CanvasCommand[]) {}

  apply(data: CanvasData): CanvasData {
    let current = data
    for (const cmd of this.commands) {
      current = cmd.apply(current)
    }
    return current
  }

  undo(data: CanvasData): CanvasData {
    let current = data
    for (let i = this.commands.length - 1; i >= 0; i--) {
      current = this.commands[i].undo(current)
    }
    return current
  }
}

export class PasteElementsCommand extends PatchCommand {
  readonly type = 'pasteElements'
  constructor(
    private pastedNodes: Node[],
    private pastedEdges: Edge[],
  ) {
    super()
  }

  protected recipe(draft: CanvasData) {
    for (const n of this.pastedNodes) {
      draft.nodes.push(n as Node)
    }
    for (const e of this.pastedEdges) {
      draft.edges.push(e as Edge)
    }
  }
}
