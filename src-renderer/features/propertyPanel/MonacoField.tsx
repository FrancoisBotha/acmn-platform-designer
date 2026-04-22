import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, X } from 'lucide-react'

const Editor = lazy(() => import('@monaco-editor/react'))

const MIN_LINES = 4
const MAX_LINES = 12
const LINE_HEIGHT = 19

interface MonacoFieldProps {
  value: string
  onChange: (value: string) => void
  language?: string
  placeholder?: string
  label?: string
}

function MonacoModal({
  value,
  onChange,
  onClose,
  language,
  label,
}: {
  value: string
  onChange: (v: string) => void
  onClose: () => void
  language: string
  label?: string
}) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose()
      }}
    >
      <div className="flex flex-col w-[80vw] h-[70vh] rounded-lg border border-border bg-background shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40">
          <span className="text-sm font-medium">{label ?? 'Editor'}</span>
          <button
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-accent"
            onClick={onClose}
            aria-label="Close editor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <Suspense fallback={<div className="p-4 text-xs text-muted-foreground">Loading editor...</div>}>
            <Editor
              height="100%"
              language={language}
              value={value}
              onChange={(v) => onChange(v ?? '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          </Suspense>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function MonacoField({ value, onChange, language = 'json', placeholder, label }: MonacoFieldProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const lineCount = Math.max(MIN_LINES, Math.min(MAX_LINES, (value || '').split('\n').length + 1))
  const height = lineCount * LINE_HEIGHT + 10

  const handleChange = useCallback(
    (v: string | undefined) => {
      onChange(v ?? '')
    },
    [onChange],
  )

  return (
    <div>
      <div className="relative rounded border border-border overflow-hidden">
        <Suspense fallback={<div className="p-2 text-xs text-muted-foreground" style={{ height }}>Loading editor...</div>}>
          <Editor
            height={height}
            language={language}
            value={value}
            onChange={handleChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 12,
              lineNumbers: 'off',
              wordWrap: 'on',
              automaticLayout: true,
              placeholder,
            }}
          />
        </Suspense>
        <button
          className="absolute top-1 right-1 flex items-center justify-center w-6 h-6 rounded bg-muted/80 hover:bg-accent text-muted-foreground z-10"
          onClick={() => setModalOpen(true)}
          aria-label="Expand editor"
          title="Expand"
        >
          <Maximize2 className="h-3 w-3" />
        </button>
      </div>
      {modalOpen && (
        <MonacoModal
          value={value}
          onChange={onChange}
          onClose={() => setModalOpen(false)}
          language={language}
          label={label}
        />
      )}
    </div>
  )
}
