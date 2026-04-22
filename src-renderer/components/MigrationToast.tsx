import { useEffect, useState } from 'react'
import type { MigrationToastInfo } from '@/state/projectStore'

interface MigrationToastProps {
  info: MigrationToastInfo
  onDismiss: () => void
}

const AUTO_DISMISS_MS = 6000

export function MigrationToast({ info, onDismiss }: MigrationToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 max-w-sm rounded-lg border border-border bg-card p-4 shadow-lg transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <p className="text-sm">
        Project migrated from format v{info.fromVersion} to v{info.toVersion}. A backup was saved to{' '}
        <span className="font-mono text-xs">{info.backupPath}</span>.
      </p>
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(onDismiss, 300)
        }}
        className="mt-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        Dismiss
      </button>
    </div>
  )
}
