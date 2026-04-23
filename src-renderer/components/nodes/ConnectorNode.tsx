import { memo } from 'react'
import { Position, type NodeProps } from '@xyflow/react'
import {
  Mail,
  Webhook,
  FileSearch,
  Clock,
  Database,
  Zap,
  Globe,
  Cable,
  type LucideIcon,
} from 'lucide-react'
import AcmnHandle from '@/components/AcmnHandle'

const subTypeIcons: Record<string, LucideIcon> = {
  email: Mail,
  webhook: Webhook,
  'file-watch': FileSearch,
  schedule: Clock,
  database: Database,
  event: Zap,
  api: Globe,
}

function ConnectorNode({ data }: NodeProps) {
  const label = (data.label as string) ?? 'Connector'
  const subType = (data.connectorSubType as string) ?? ''
  const Icon = subTypeIcons[subType] ?? Cable

  return (
    <div className="rounded-lg border-2 border-slate-400 bg-slate-50 px-3 py-2 shadow-sm min-w-[120px]">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-slate-600" />
        <span className="text-xs font-medium truncate text-slate-900">{label}</span>
      </div>
      <AcmnHandle type="source" position={Position.Right} id="event-out" />
    </div>
  )
}

export default memo(ConnectorNode)
