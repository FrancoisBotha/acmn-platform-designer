import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { ShieldAlert } from 'lucide-react'
import BasePlanItemNode from './BasePlanItemNode'

function GuardrailNode(props: NodeProps) {
  return (
    <BasePlanItemNode
      nodeProps={props}
      icon={ShieldAlert}
      colorClasses={{
        border: 'border-red-500',
        bg: 'bg-red-50',
        iconText: 'text-red-600',
      }}
    />
  )
}

export default memo(GuardrailNode)
