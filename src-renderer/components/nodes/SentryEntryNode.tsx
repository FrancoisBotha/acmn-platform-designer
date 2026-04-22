import { memo } from 'react'
import { Position, type NodeProps } from '@xyflow/react'
import AcmnHandle from '@/components/AcmnHandle'

function SentryEntryNode({ data }: NodeProps) {
  const label = (data.label as string) ?? ''

  return (
    <div className="relative flex flex-col items-center" style={{ width: 32, height: 32 }}>
      <AcmnHandle type="target" position={Position.Left} id="any-in" className="!w-1.5 !h-1.5" />
      <svg width="32" height="32" viewBox="0 0 32 32" className="absolute inset-0">
        <polygon
          points="16,2 30,16 16,30 2,16"
          fill="#ffffff"
          stroke="#f59e0b"
          strokeWidth="2"
        />
      </svg>
      {label && (
        <span className="relative z-10 mt-8 text-[8px] font-medium text-amber-700 whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  )
}

export default memo(SentryEntryNode)
