import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Briefcase } from 'lucide-react'
import DomainContextBadge from './DomainContextBadge'

function CasePlanModelNode({ data }: NodeProps) {
  const label = (data.label as string) ?? 'Case Plan Model'

  return (
    <div className="relative rounded-lg border-2 border-slate-700 bg-slate-50 shadow-md min-w-[400px] min-h-[300px]">
      <DomainContextBadge />
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
      <div className="flex items-center gap-2 rounded-t-md bg-slate-700 px-3 py-1.5 w-fit rounded-br-lg">
        <Briefcase className="h-4 w-4 shrink-0 text-white" />
        <span className="text-xs font-semibold text-white">{label}</span>
      </div>
      <div className="p-4" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
    </div>
  )
}

export default memo(CasePlanModelNode)
