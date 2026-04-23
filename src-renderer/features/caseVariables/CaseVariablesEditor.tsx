import { useState, useEffect, useCallback, useRef } from 'react'
import { useCanvasStore } from '@/state/canvasStore'
import { useProjectStore } from '@/state/projectStore'
import type { CaseVariable, AcmnVariableType } from '@/lib/validation'
import { ACMN_VARIABLE_TYPES } from '@/lib/validation'
import {
  AddCaseVariableCommand,
  RemoveCaseVariableCommand,
  ReorderCaseVariableCommand,
  UpdateCaseVariableCommand,
} from './caseVariableCommands'

const CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CHF', 'NZD', 'ZAR'] as const

function defaultForType(type: AcmnVariableType): unknown {
  switch (type) {
    case 'string': return ''
    case 'integer': return 0
    case 'float': return 0.0
    case 'boolean': return false
    case 'date': return ''
    case 'datetime': return ''
    case 'enum': return ''
    case 'currency': return { currency: 'USD', amount: 0 }
  }
}

function newVariable(): CaseVariable {
  return {
    name: '',
    type: 'string',
    default: '',
    required: false,
    label: '',
    readOnly: false,
  }
}

interface RowErrors {
  name?: string
}

interface TypeChangeConfirmation {
  index: number
  variable: CaseVariable
  newType: AcmnVariableType
}

interface DeleteConfirmation {
  index: number
  variable: CaseVariable
  referenceCount: number
}

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

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function countVariableReferences(variableName: string, nodes: { data: Record<string, unknown> }[]): number {
  if (!variableName.trim()) return 0

  const expressionPattern = new RegExp(`\\b${escapeRegExp(variableName)}\\b`)
  const expressionKeys = new Set([
    'entrySentry',
    'exitSentry',
    'visibilityRules',
    'transform',
    'expression',
    'condition',
  ])

  let count = 0

  for (const node of nodes) {
    const data = node.data ?? {}

    const referencedVariables = data.referencedVariables as string[] | undefined
    if (Array.isArray(referencedVariables)) {
      count += referencedVariables.filter((value) => value === variableName).length
    }

    const formFields = data.formFields as Array<{ variableName?: string }> | undefined
    if (Array.isArray(formFields)) {
      count += formFields.filter((field) => field.variableName === variableName).length
    }

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && expressionKeys.has(key) && expressionPattern.test(value)) {
        count += 1
      }
    }
  }

  return count
}

function DefaultValueInput({
  variable,
  onChange,
}: {
  variable: CaseVariable
  onChange: (val: unknown) => void
}) {
  const inputClass = 'w-full rounded border border-border bg-background px-2 py-1 text-sm'

  switch (variable.type) {
    case 'string':
      return (
        <input
          type="text"
          className={inputClass}
          value={String(variable.default ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'integer':
      return (
        <input
          type="number"
          className={inputClass}
          step={1}
          value={Number(variable.default ?? 0)}
          onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        />
      )
    case 'float':
      return (
        <input
          type="number"
          className={inputClass}
          step={0.01}
          value={Number(variable.default ?? 0)}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
      )
    case 'boolean':
      return (
        <input
          type="checkbox"
          checked={Boolean(variable.default)}
          onChange={(e) => onChange(e.target.checked)}
        />
      )
    case 'date':
      return (
        <input
          type="date"
          className={inputClass}
          value={String(variable.default ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'datetime':
      return (
        <input
          type="datetime-local"
          className={inputClass}
          value={String(variable.default ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'enum': {
      const options = variable.enumValues ?? []
      return (
        <select
          className={inputClass}
          value={String(variable.default ?? '')}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">-- select --</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )
    }
    case 'currency': {
      const val = (variable.default ?? { currency: 'USD', amount: 0 }) as { currency: string; amount: number }
      return (
        <div className="flex gap-1">
          <select
            className="w-20 rounded border border-border bg-background px-1 py-1 text-sm"
            value={val.currency ?? 'USD'}
            onChange={(e) => onChange({ ...val, currency: e.target.value })}
          >
            {CURRENCY_CODES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
            step={0.01}
            value={val.amount ?? 0}
            onChange={(e) => onChange({ ...val, amount: parseFloat(e.target.value) || 0 })}
          />
        </div>
      )
    }
    default:
      return null
  }
}

interface CaseVariablesEditorProps {
  onClose: () => void
}

export function CaseVariablesEditor({ onClose }: CaseVariablesEditorProps) {
  const caseVariables = useCanvasStore((s) => s.caseVariables)
  const pushCommand = useCanvasStore((s) => s.pushCommand)
  const undo = useCanvasStore((s) => s.undo)
  const redo = useCanvasStore((s) => s.redo)
  const nodes = useCanvasStore((s) => s.nodes)
  const undoStackLength = useCanvasStore((s) => s.undoStack.length)
  const setDirty = useProjectStore((s) => s.setDirty)

  const [rowErrors, setRowErrors] = useState<Map<number, RowErrors>>(new Map())
  const [typeChangeConfirm, setTypeChangeConfirm] = useState<TypeChangeConfirmation | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmation | null>(null)
  const saveRef = useRef<HTMLButtonElement>(null)
  const initialUndoStackLengthRef = useRef(undoStackLength)

  const validate = useCallback((vars: CaseVariable[]): Map<number, RowErrors> => {
    const errors = new Map<number, RowErrors>()
    const seen = new Map<string, number>()
    for (let i = 0; i < vars.length; i++) {
      const v = vars[i]
      const rowErr: RowErrors = {}
      if (!v.name.trim()) {
        rowErr.name = 'Name is required'
      } else if (seen.has(v.name)) {
        rowErr.name = `Duplicate variable name: ${v.name}`
        const firstIdx = seen.get(v.name)!
        const firstErr = errors.get(firstIdx) ?? {}
        firstErr.name = `Duplicate variable name: ${v.name}`
        errors.set(firstIdx, firstErr)
      }
      if (v.name.trim()) seen.set(v.name, i)
      if (Object.keys(rowErr).length > 0) errors.set(i, rowErr)
    }
    return errors
  }, [])

  useEffect(() => {
    setRowErrors(validate(caseVariables))
  }, [caseVariables, validate])

  const hasErrors = rowErrors.size > 0

  const pushVariableCommand = useCallback((command: AddCaseVariableCommand | RemoveCaseVariableCommand | ReorderCaseVariableCommand | UpdateCaseVariableCommand) => {
    pushCommand(command)
    setDirty(true)
  }, [pushCommand, setDirty])

  const handleAdd = useCallback(() => {
    pushVariableCommand(new AddCaseVariableCommand(newVariable(), caseVariables.length))
  }, [caseVariables.length, pushVariableCommand])

  const handleUpdateVariable = useCallback((index: number, updater: (variable: CaseVariable) => CaseVariable) => {
    const current = caseVariables[index]
    if (!current) return

    const next = updater(cloneCaseVariable(current))
    if (JSON.stringify(current) === JSON.stringify(next)) return

    pushVariableCommand(
      new UpdateCaseVariableCommand(index, cloneCaseVariable(current), next),
    )
  }, [caseVariables, pushVariableCommand])

  const handleTypeChange = useCallback((index: number, newType: AcmnVariableType) => {
    const variable = caseVariables[index]
    if (!variable) return
    if (variable.type === newType) return

    const refCount = countVariableReferences(variable.name, nodes as { data: Record<string, unknown> }[])
    if (refCount > 0 && variable.name.trim()) {
      setTypeChangeConfirm({ index, variable, newType })
      return
    }
    handleUpdateVariable(index, (current) => {
      current.type = newType
      current.default = defaultForType(newType)
      if (newType === 'enum') {
        current.enumValues = current.enumValues ?? []
      } else {
        delete current.enumValues
      }
      return current
    })
  }, [caseVariables, nodes, handleUpdateVariable])

  const confirmTypeChange = useCallback(() => {
    if (!typeChangeConfirm) return
    handleUpdateVariable(typeChangeConfirm.index, (current) => {
      current.type = typeChangeConfirm.newType
      current.default = defaultForType(typeChangeConfirm.newType)
      if (typeChangeConfirm.newType === 'enum') {
        current.enumValues = current.enumValues ?? []
      } else {
        delete current.enumValues
      }
      return current
    })
    setTypeChangeConfirm(null)
  }, [typeChangeConfirm, handleUpdateVariable])

  const handleDelete = useCallback((index: number) => {
    const variable = caseVariables[index]
    if (!variable) return

    const refCount = countVariableReferences(variable.name, nodes as { data: Record<string, unknown> }[])
    if (refCount > 0) {
      setDeleteConfirm({ index, variable, referenceCount: refCount })
      return
    }
    pushVariableCommand(new RemoveCaseVariableCommand(index))
  }, [caseVariables, nodes, pushVariableCommand])

  const confirmDelete = useCallback(() => {
    if (!deleteConfirm) return
    pushVariableCommand(new RemoveCaseVariableCommand(deleteConfirm.index))
    setDeleteConfirm(null)
  }, [deleteConfirm, pushVariableCommand])

  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return
    pushVariableCommand(new ReorderCaseVariableCommand(index, index - 1))
  }, [pushVariableCommand])

  const handleMoveDown = useCallback((index: number) => {
    if (index >= caseVariables.length - 1) return
    pushVariableCommand(new ReorderCaseVariableCommand(index, index + 1))
  }, [caseVariables.length, pushVariableCommand])

  const handleSave = useCallback(() => {
    if (hasErrors) return
    onClose()
  }, [hasErrors, onClose])

  const handleEnumValuesChange = useCallback((index: number, text: string) => {
    const values = text.split('\n').map((s) => s.trim()).filter(Boolean)
    handleUpdateVariable(index, (current) => {
      current.enumValues = values.length > 0 ? values : undefined
      if (!current.enumValues?.includes(String(current.default ?? ''))) {
        current.default = current.enumValues?.[0] ?? ''
      }
      return current
    })
  }, [handleUpdateVariable])

  const handleCancel = useCallback(() => {
    if (undoStackLength > initialUndoStackLengthRef.current) {
      const undoCount = undoStackLength - initialUndoStackLengthRef.current
      for (let i = 0; i < undoCount; i++) {
        undo()
      }
    }
    onClose()
  }, [onClose, undo, undoStackLength])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (typeChangeConfirm) {
          setTypeChangeConfirm(null)
        } else if (deleteConfirm) {
          setDeleteConfirm(null)
        } else {
          handleCancel()
        }
        return
      }
      const mod = e.ctrlKey || e.metaKey
      if (mod && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        e.stopPropagation()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
        return
      }
      if (mod && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault()
        e.stopPropagation()
        redo()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleCancel, typeChangeConfirm, deleteConfirm, undo, redo])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-label="Case Variables">
      <div className="w-full max-w-[800px] rounded-lg border border-border bg-card shadow-lg flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Case Variables</h2>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                <th className="pb-2 pr-2">Name</th>
                <th className="pb-2 pr-2">Type</th>
                <th className="pb-2 pr-2">Default</th>
                <th className="pb-2 pr-2 text-center">Required</th>
                <th className="pb-2 pr-2">Label</th>
                <th className="pb-2 pr-2 text-center">Read only</th>
                <th className="pb-2 pr-2">Enum values</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {caseVariables.map((v, i) => {
                const errors = rowErrors.get(i)
                return (
                  <tr
                    key={i}
                    className={`border-b border-border ${errors ? 'bg-destructive/10' : ''}`}
                  >
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        className={`w-full rounded border px-2 py-1 text-sm bg-background ${errors?.name ? 'border-destructive' : 'border-border'}`}
                        value={v.name}
                        placeholder="variableName"
                        onChange={(e) => handleUpdateVariable(i, (current) => ({ ...current, name: e.target.value }))}
                      />
                      {errors?.name && (
                        <p className="text-xs text-destructive mt-0.5">{errors.name}</p>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                        value={v.type}
                        onChange={(e) => handleTypeChange(i, e.target.value as AcmnVariableType)}
                      >
                        {ACMN_VARIABLE_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <DefaultValueInput
                        variable={v}
                        onChange={(val) => handleUpdateVariable(i, (current) => ({ ...current, default: val }))}
                      />
                    </td>
                    <td className="py-2 pr-2 text-center">
                      <input
                        type="checkbox"
                        checked={v.required}
                        onChange={(e) => handleUpdateVariable(i, (current) => ({ ...current, required: e.target.checked }))}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                        value={v.label}
                        placeholder="Display label"
                        onChange={(e) => handleUpdateVariable(i, (current) => ({ ...current, label: e.target.value }))}
                      />
                    </td>
                    <td className="py-2 pr-2 text-center">
                      <input
                        type="checkbox"
                        checked={v.readOnly}
                        onChange={(e) => handleUpdateVariable(i, (current) => ({ ...current, readOnly: e.target.checked }))}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      {v.type === 'enum' && (
                        <textarea
                          className="w-full rounded border border-border bg-background px-2 py-1 text-sm resize-y min-h-[40px]"
                          value={(v.enumValues ?? []).join('\n')}
                          placeholder="One value per line"
                          onChange={(e) => handleEnumValuesChange(i, e.target.value)}
                        />
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <button
                          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          title="Move up"
                          onClick={() => handleMoveUp(i)}
                          disabled={i === 0}
                        >
                          &#9650;
                        </button>
                        <button
                          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          title="Move down"
                          onClick={() => handleMoveDown(i)}
                          disabled={i === caseVariables.length - 1}
                        >
                          &#9660;
                        </button>
                        <button
                          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          title="Delete"
                          onClick={() => handleDelete(i)}
                        >
                          &#128465;
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <button
            className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
            onClick={handleAdd}
          >
            + Add variable
          </button>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button
            onClick={handleCancel}
            className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            ref={saveRef}
            onClick={handleSave}
            disabled={hasErrors}
            className="rounded-md bg-[hsl(245,80%,65%)] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[hsl(245,80%,55%)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>

      {typeChangeConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold">Confirm type change</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              This may invalidate sentry expressions that reference &quot;{typeChangeConfirm.variable.name}&quot;. Continue?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTypeChangeConfirm(null)}
                className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmTypeChange}
                className="rounded-md bg-[hsl(245,80%,65%)] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[hsl(245,80%,55%)]"
              >
                Change type
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold">Variable in use</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              &quot;{deleteConfirm.variable.name}&quot; is used in {deleteConfirm.referenceCount} place{deleteConfirm.referenceCount !== 1 ? 's' : ''}. Deleting it may cause errors. Continue?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                Delete anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
