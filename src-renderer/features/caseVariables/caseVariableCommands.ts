import { produce } from 'immer'
import type { CanvasData, CanvasCommand } from '@/state/commands'
import type { CaseVariable } from '@/lib/validation'

function cloneCaseVariable(variable: CaseVariable): CaseVariable {
  return {
    ...variable,
    default:
      variable.default && typeof variable.default === 'object'
        ? { ...(variable.default as Record<string, unknown>) }
        : variable.default,
    enumValues: variable.enumValues ? [...variable.enumValues] : undefined,
  }
}

export class AddCaseVariableCommand implements CanvasCommand {
  readonly type = 'addCaseVariable'
  constructor(
    private variable: CaseVariable,
    private index?: number,
  ) {}

  apply(data: CanvasData): CanvasData {
    return produce(data, (draft) => {
      const insertAt = this.index ?? draft.caseVariables.length
      draft.caseVariables.splice(insertAt, 0, cloneCaseVariable(this.variable))
    })
  }

  undo(data: CanvasData): CanvasData {
    return produce(data, (draft) => {
      const removeAt = this.index ?? draft.caseVariables.length - 1
      if (removeAt >= 0 && removeAt < draft.caseVariables.length) {
        draft.caseVariables.splice(removeAt, 1)
      }
    })
  }
}

export class RemoveCaseVariableCommand implements CanvasCommand {
  readonly type = 'removeCaseVariable'
  private removedVariable: CaseVariable | null = null

  constructor(private index: number) {}

  apply(data: CanvasData): CanvasData {
    return produce(data, (draft) => {
      if (this.index >= 0 && this.index < draft.caseVariables.length) {
        this.removedVariable = cloneCaseVariable(data.caseVariables[this.index])
        draft.caseVariables.splice(this.index, 1)
      }
    })
  }

  undo(data: CanvasData): CanvasData {
    if (!this.removedVariable) return data
    return produce(data, (draft) => {
      draft.caseVariables.splice(this.index, 0, cloneCaseVariable(this.removedVariable))
    })
  }
}

export class UpdateCaseVariableCommand implements CanvasCommand {
  readonly type = 'updateCaseVariable'

  constructor(
    private index: number,
    private oldVariable: CaseVariable,
    private newVariable: CaseVariable,
  ) {}

  apply(data: CanvasData): CanvasData {
    return produce(data, (draft) => {
      if (this.index >= 0 && this.index < draft.caseVariables.length) {
        draft.caseVariables[this.index] = cloneCaseVariable(this.newVariable)
      }
    })
  }

  undo(data: CanvasData): CanvasData {
    return produce(data, (draft) => {
      if (this.index >= 0 && this.index < draft.caseVariables.length) {
        draft.caseVariables[this.index] = cloneCaseVariable(this.oldVariable)
      }
    })
  }
}

export class SetCaseVariablesCommand implements CanvasCommand {
  readonly type = 'setCaseVariables'

  constructor(
    private oldVariables: CaseVariable[],
    private newVariables: CaseVariable[],
  ) {}

  apply(data: CanvasData): CanvasData {
    return produce(data, (draft) => {
      draft.caseVariables = this.newVariables.map(cloneCaseVariable)
    })
  }

  undo(data: CanvasData): CanvasData {
    return produce(data, (draft) => {
      draft.caseVariables = this.oldVariables.map(cloneCaseVariable)
    })
  }
}

export class ReorderCaseVariableCommand implements CanvasCommand {
  readonly type = 'reorderCaseVariable'

  constructor(
    private fromIndex: number,
    private toIndex: number,
  ) {}

  apply(data: CanvasData): CanvasData {
    return produce(data, (draft) => {
      const [item] = draft.caseVariables.splice(this.fromIndex, 1)
      if (item) draft.caseVariables.splice(this.toIndex, 0, item)
    })
  }

  undo(data: CanvasData): CanvasData {
    return produce(data, (draft) => {
      const [item] = draft.caseVariables.splice(this.toIndex, 1)
      if (item) draft.caseVariables.splice(this.fromIndex, 0, item)
    })
  }
}
