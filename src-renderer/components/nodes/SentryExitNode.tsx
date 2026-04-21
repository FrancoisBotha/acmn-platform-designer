import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

function SentryExitNode({ data }: NodeProps) {
  const label = (data.label as string) ?? ''

  return (
    <div className="relative flex flex-col items-center" style={{ width: 32, height: 32 }}>
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground !w-1.5 !h-1.5" />
      <svg width="32" height="32" viewBox="0 0 32 32" className="absolute inset-0">
        <polygon
          points="16,2 30,16 16,30 2,16"
          fill="#fef3c7"
          stroke="#f59e0b"
          strokeWidth="2"
        />
      </svg>
      {label && (
        <span className="relative z-10 mt-8 text-[8px] font-medium text-amber-700 whitespace-nowrap">
          {label}
        </span>
      )}
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground !w-1.5 !h-1.5" />
    </div>
  )
}

export default memo(SentryExitNode)
