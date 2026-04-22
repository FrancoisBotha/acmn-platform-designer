import { useId, useState, useRef, useEffect, useCallback } from 'react'

interface HelpTooltipProps {
  text: string
}

export function HelpTooltip({ text }: HelpTooltipProps) {
  const id = useId()
  const tooltipId = `tooltip-${id}`
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const show = useCallback(() => {
    clearTimeout(timeoutRef.current)
    setVisible(true)
  }, [])

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(false), 150)
  }, [])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-muted-foreground/40 bg-muted text-[10px] font-medium leading-none text-muted-foreground cursor-help hover:border-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        aria-describedby={visible ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
      >
        &#9432;
      </button>
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 z-50 max-w-[220px] rounded bg-popover border border-border px-2 py-1 text-xs text-popover-foreground shadow-md pointer-events-none"
        >
          {text}
        </span>
      )}
    </span>
  )
}

export function FieldLabel({ label, tooltip }: { label: string; tooltip?: string }) {
  return (
    <label className="flex items-center gap-1 text-xs font-medium mb-1">
      {label}
      {tooltip && <HelpTooltip text={tooltip} />}
    </label>
  )
}
