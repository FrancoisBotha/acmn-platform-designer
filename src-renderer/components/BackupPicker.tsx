import { useEffect, useState } from 'react'
import type { BackupEntry } from '@/contracts/backend'

interface BackupPickerProps {
  filePath: string
  onSelect: (backupPath: string) => void
  onCancel: () => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString()
}

export function BackupPicker({ filePath, onSelect, onCancel }: BackupPickerProps) {
  const [backups, setBackups] = useState<BackupEntry[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    window.acmn.project
      .listBackups(filePath)
      .then(setBackups)
      .catch(() => setLoadError('Could not list backup files.'))
  }, [filePath])

  if (loadError) {
    return (
      <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3">
        <p className="text-sm text-destructive-foreground">{loadError}</p>
        <button
          onClick={onCancel}
          className="mt-2 rounded-md border border-border px-3 py-1 text-xs transition-colors hover:bg-secondary"
        >
          Back
        </button>
      </div>
    )
  }

  if (backups === null) {
    return (
      <div className="mt-4 text-sm text-muted-foreground">Loading backups…</div>
    )
  }

  if (backups.length === 0) {
    return (
      <div className="mt-4 rounded-md border border-border bg-secondary/50 p-3">
        <p className="text-sm text-muted-foreground">No backup files found.</p>
        <button
          onClick={onCancel}
          className="mt-2 rounded-md border border-border px-3 py-1 text-xs transition-colors hover:bg-secondary"
        >
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <h3 className="mb-2 text-sm font-medium">Select a backup to restore</h3>
      <ul className="space-y-1">
        {backups.map((b) => (
          <li key={b.path}>
            <button
              onClick={() => onSelect(b.path)}
              className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
            >
              <span className="font-medium">{b.label}</span>
              <span className="text-xs text-muted-foreground">{formatDate(b.modifiedAt)}</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={onCancel}
        className="mt-2 rounded-md border border-border px-3 py-1 text-xs transition-colors hover:bg-secondary"
      >
        Back
      </button>
    </div>
  )
}
