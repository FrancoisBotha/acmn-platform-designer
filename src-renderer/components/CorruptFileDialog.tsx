import { useCallback, useEffect, useState } from 'react'
import { BackupPicker } from './BackupPicker'

interface CorruptFileDialogProps {
  fileName: string
  filePath: string
  errorMessage: string
  projectPath: string
  onOpenBackup: (backupPath: string) => void
  onCancel: () => void
}

export function CorruptFileDialog({
  fileName,
  filePath,
  errorMessage,
  projectPath,
  onOpenBackup,
  onCancel,
}: CorruptFileDialogProps) {
  const [showBackupPicker, setShowBackupPicker] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  const handleReportBug = useCallback(async () => {
    const text = `File: ${filePath}\nError: ${errorMessage}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard may be unavailable
    }
  }, [filePath, errorMessage])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div role="dialog" className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold">File Could Not Be Read</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          The file <span className="font-mono font-medium text-foreground">{fileName}</span> could not be read.
        </p>
        <p className="mb-6 truncate text-xs text-muted-foreground" title={errorMessage}>
          {errorMessage}
        </p>

        {showBackupPicker ? (
          <BackupPicker
            filePath={filePath}
            onSelect={(backupPath) => onOpenBackup(backupPath)}
            onCancel={() => setShowBackupPicker(false)}
          />
        ) : (
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowBackupPicker(true)}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
            >
              Open a backup
            </button>
            <button
              onClick={handleReportBug}
              className="rounded-md bg-[hsl(245,80%,65%)] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[hsl(245,80%,55%)]"
            >
              {copied ? 'Copied!' : 'Report bug'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
