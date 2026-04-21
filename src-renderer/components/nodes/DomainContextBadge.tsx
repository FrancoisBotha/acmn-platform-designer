import { memo } from 'react'

function DomainContextBadge() {
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 -top-9 pointer-events-none select-none z-10"
    >
      <div className="flex items-center gap-1.5 rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1 shadow-sm whitespace-nowrap">
        <span className="text-[10px]">🔗</span>
        <span className="text-[10px] font-medium text-rose-700">
          Insurance Claims v3.2
        </span>
      </div>
    </div>
  )
}

export default memo(DomainContextBadge)
