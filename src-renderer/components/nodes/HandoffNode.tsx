import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ArrowLeftRight } from 'lucide-react'
import BasePlanItemNode from './BasePlanItemNode'

function HandoffNode(props: NodeProps) {
  return (
    <BasePlanItemNode
      nodeProps={props}
      icon={ArrowLeftRight}
      colorClasses={{
        border: 'border-pink-500',
        bg: 'bg-pink-50',
        iconText: 'text-pink-600',
      }}
      handles={
        <>
          <Handle type="source" position={Position.Right} id="source-right" className="!bg-muted-foreground" />
          <Handle type="source" position={Position.Bottom} id="source-bottom" className="!bg-muted-foreground" />
        </>
      }
    />
  )
}

export default memo(HandoffNode)
