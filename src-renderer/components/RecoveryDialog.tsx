import { useCallback, useEffect, useRef, useState } from 'react'
import type { RecoveryOption, RecoveryChoice } from '@/types/acmn'

interface RecoveryDialogProps {
  options: RecoveryOption[]
  onComplete: () => void
}

function formatMtime(iso: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  return date.toLocaleString()
}

function basename(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || filePath
}

function backupLabel(bakPath: string): string {
  const name = basename(bakPath)
  const match = name.match(/\.bak\.(\d+)$/)
  return match ? `Backup ${match[1]}` : name
}

function allOptionsAgree(options: RecoveryOption[]): boolean {
  if (options.length <= 1) return true
  const hasLastSaved = (o: RecoveryOption) => o.lastSavedPath !== ''
  const hasBackups = (o: RecoveryOption) => o.backupPaths.length > 0
  const first = options[0]
  return options.every(
    (o) =>
      hasLastSaved(o) === hasLastSaved(first) &&
      hasBackups(o) === hasBackups(first) &&
      o.backupPaths.length === first.backupPaths.length,
  )
}

export function RecoveryDialog({ options, onComplete }: RecoveryDialogProps) {
  const [showBackupPicker, setShowBackupPicker] = useState(false)
  const [perFileMode, setPerFileMode] = useState(false)
  const [perFileChoices, setPerFileChoices] = useState<Map<string, RecoveryChoice>>(new Map())
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const restoreRef = useRef<HTMLButtonElement>(null)

  const isMultiFile = options.length > 1
  const consolidated = !isMultiFile || allOptionsAgree(options)

  useEffect(() => {
    if (!showBackupPicker && !perFileMode) {
      restoreRef.current?.focus()
    }
  }, [showBackupPicker, perFileMode])

  const applyChoices = useCallback(
    async (choices: RecoveryChoice[]) => {
      setApplying(true)
      setError(null)
      try {
        for (const choice of choices) {
          await window.acmn.project.applyRecovery(choice)
        }
        onComplete()
      } catch {
        setError('Recovery failed. Please try again or choose a different option.')
        setApplying(false)
      }
    },
    [onComplete],
  )

  const handleRestoreUnsaved = useCallback(() => {
    const choices: RecoveryChoice[] = options.map((o) => ({
      filePath: o.filePath,
      choice: 'use-tmp',
    }))
    applyChoices(choices)
  }, [options, applyChoices])

  const handleOpenLastSaved = useCallback(() => {
    const choices: RecoveryChoice[] = options.map((o) => ({
      filePath: o.filePath,
      choice: 'use-last-saved',
    }))
    applyChoices(choices)
  }, [options, applyChoices])

  const handleOpenBackup = useCallback(
    (backupIndex: number) => {
      const choices: RecoveryChoice[] = options.map((o) => ({
        filePath: o.filePath,
        choice: 'use-backup' as const,
        backupIndex,
      }))
      applyChoices(choices)
    },
    [options, applyChoices],
  )

  const handlePerFileSubmit = useCallback(() => {
    if (perFileChoices.size !== options.length) return
    applyChoices(Array.from(perFileChoices.values()))
  }, [perFileChoices, options, applyChoices])

  const setPerFileChoice = useCallback((filePath: string, choice: RecoveryChoice) => {
    setPerFileChoices((prev) => {
      const next = new Map(prev)
      next.set(filePath, choice)
      return next
    })
  }, [])

  if (perFileMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
          <h2 className="mb-2 text-lg font-semibold">Recover files individually</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Files have different recovery options available. Choose for each file below.
          </p>

          {error && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive-foreground">
              {error}
            </div>
          )}

          <div className="mb-4 max-h-80 space-y-3 overflow-y-auto">
            {options.map((opt) => (
              <PerFileRow
                key={opt.filePath}
                option={opt}
                selected={perFileChoices.get(opt.filePath) ?? null}
                onSelect={(choice) => setPerFileChoice(opt.filePath, choice)}
              />
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handlePerFileSubmit}
              disabled={applying || perFileChoices.size !== options.length}
              className="rounded-md bg-[hsl(245,80%,65%)] px-4 py-1.5 text-sm text-white transition-colors hover:bg-[hsl(245,80%,55%)] disabled:opacity-50"
            >
              {applying ? 'Applying...' : 'Apply choices'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showBackupPicker) {
    const refOption = options[0]
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
          <h2 className="mb-2 text-lg font-semibold">Choose a backup</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Select which backup to restore from:
          </p>

          {error && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive-foreground">
              {error}
            </div>
          )}

          <div className="mb-4 space-y-2">
            {refOption.backupPaths.map((bakPath, idx) => (
              <button
                key={bakPath}
                onClick={() => handleOpenBackup(idx)}
                disabled={applying}
                className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary disabled:opacity-50"
              >
                <span className="font-medium">{backupLabel(bakPath)}</span>
                <span className="text-xs text-muted-foreground">
                  {formatMtime(refOption.backupMtimes[idx])}
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowBackupPicker(false)}
              disabled={applying}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const hasLastSaved = options.every((o) => o.lastSavedPath !== '')
  const hasBackups = options.some((o) => o.backupPaths.length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold">Unsaved changes detected from last session</h2>
        <p className="mb-1 text-sm text-muted-foreground">
          {isMultiFile
            ? `${options.length} files have unsaved changes. Choose how to proceed:`
            : 'Choose how to recover your work:'}
        </p>

        {isMultiFile && !consolidated && (
          <p className="mb-1 text-xs text-muted-foreground">
            Files have different recovery options.
          </p>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive-foreground">
            {error}
          </div>
        )}

        <div className="mb-2 mt-4 space-y-2">
          <button
            ref={restoreRef}
            onClick={handleRestoreUnsaved}
            disabled={applying}
            className="flex w-full flex-col items-start rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:bg-secondary disabled:opacity-50"
          >
            <span className="text-sm font-medium">Restore unsaved changes</span>
            <span className="text-xs text-muted-foreground">
              Use the recovered data from the interrupted session
            </span>
          </button>

          {hasLastSaved && (
            <button
              onClick={handleOpenLastSaved}
              disabled={applying}
              className="flex w-full flex-col items-start rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:bg-secondary disabled:opacity-50"
            >
              <span className="text-sm font-medium">Open last saved version</span>
              <span className="text-xs text-muted-foreground">
                Discard unsaved changes and open the last successful save
              </span>
            </button>
          )}

          {hasBackups && consolidated && (
            <button
              onClick={() => setShowBackupPicker(true)}
              disabled={applying}
              className="flex w-full flex-col items-start rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:bg-secondary disabled:opacity-50"
            >
              <span className="text-sm font-medium">Open a backup</span>
              <span className="text-xs text-muted-foreground">
                Browse available backup versions
              </span>
            </button>
          )}

          {isMultiFile && !consolidated && (
            <button
              onClick={() => setPerFileMode(true)}
              disabled={applying}
              className="flex w-full flex-col items-start rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:bg-secondary disabled:opacity-50"
            >
              <span className="text-sm font-medium">Choose per file</span>
              <span className="text-xs text-muted-foreground">
                Different options are available for each file — choose individually
              </span>
            </button>
          )}
        </div>

        {applying && (
          <p className="mt-3 text-center text-xs text-muted-foreground">Applying recovery...</p>
        )}
      </div>
    </div>
  )
}

interface PerFileRowProps {
  option: RecoveryOption
  selected: RecoveryChoice | null
  onSelect: (choice: RecoveryChoice) => void
}

function PerFileRow({ option, selected, onSelect }: PerFileRowProps) {
  const [showBackups, setShowBackups] = useState(false)
  const hasLastSaved = option.lastSavedPath !== ''
  const hasBackups = option.backupPaths.length > 0

  return (
    <div className="rounded-md border border-border p-3">
      <p className="mb-2 truncate text-sm font-medium" title={option.filePath}>
        {basename(option.filePath)}
      </p>
      <div className="space-y-1">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name={`recovery-${option.filePath}`}
            checked={selected?.choice === 'use-tmp'}
            onChange={() =>
              onSelect({ filePath: option.filePath, choice: 'use-tmp' })
            }
            className="accent-[hsl(245,80%,65%)]"
          />
          Restore unsaved changes
        </label>

        {hasLastSaved && (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name={`recovery-${option.filePath}`}
              checked={selected?.choice === 'use-last-saved'}
              onChange={() =>
                onSelect({ filePath: option.filePath, choice: 'use-last-saved' })
              }
              className="accent-[hsl(245,80%,65%)]"
            />
            Open last saved version
          </label>
        )}

        {hasBackups && !showBackups && (
          <button
            onClick={() => setShowBackups(true)}
            className="text-sm text-[hsl(245,80%,65%)] hover:underline"
          >
            Open a backup...
          </button>
        )}

        {hasBackups && showBackups && (
          <div className="ml-4 space-y-1">
            {option.backupPaths.map((bakPath, idx) => (
              <label
                key={bakPath}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name={`recovery-${option.filePath}`}
                  checked={
                    selected?.choice === 'use-backup' && selected?.backupIndex === idx
                  }
                  onChange={() =>
                    onSelect({
                      filePath: option.filePath,
                      choice: 'use-backup',
                      backupIndex: idx,
                    })
                  }
                  className="accent-[hsl(245,80%,65%)]"
                />
                <span>{backupLabel(bakPath)}</span>
                <span className="text-xs text-muted-foreground">
                  {formatMtime(option.backupMtimes[idx])}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
