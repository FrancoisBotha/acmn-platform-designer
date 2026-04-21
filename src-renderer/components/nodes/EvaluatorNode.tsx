import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { ScanSearch } from 'lucide-react'
import BasePlanItemNode from './BasePlanItemNode'

function EvaluatorNode(props: NodeProps) {
  return (
    <BasePlanItemNode
      nodeProps={props}
      icon={ScanSearch}
      colorClasses={{
        border: 'border-cyan-500',
        bg: 'bg-cyan-50',
        iconText: 'text-cyan-600',
      }}
    />
  )
}

export default memo(EvaluatorNode)
