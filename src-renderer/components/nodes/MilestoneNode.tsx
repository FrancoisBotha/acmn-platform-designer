import { memo } from 'react'
import { Position, type NodeProps } from '@xyflow/react'
import { Milestone } from 'lucide-react'
import AcmnHandle from '@/components/AcmnHandle'

function MilestoneNode({ data }: NodeProps) {
  const label = (data.label as string) ?? 'Milestone'

  return (
    <div className="relative flex flex-col items-center" style={{ width: 100, height: 100 }}>
      <AcmnHandle type="target" position={Position.Left} id="any-in" style={{ top: '50%' }} />
      <svg width="100" height="100" viewBox="0 0 100 100" className="absolute inset-0">
        <polygon
          points="50,4 96,50 50,96 4,50"
          fill="#fffbeb"
          stroke="#f59e0b"
          strokeWidth="2.5"
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-1">
        <Milestone className="h-4 w-4 text-amber-600" />
        <span className="text-[10px] font-semibold text-amber-800 text-center leading-tight max-w-[60px] truncate">
          {label}
        </span>
      </div>
      <AcmnHandle type="source" position={Position.Right} id="any-out" style={{ top: '50%' }} />
    </div>
  )
}

export default memo(MilestoneNode)
