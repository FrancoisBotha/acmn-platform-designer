import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react'
import { acmnWireStyles, type AcmnWireType } from '@/lib/acmnWireStyles'

type AcmnWireEdgeData = {
  wireType: AcmnWireType
}

type AcmnWireEdge = Edge<AcmnWireEdgeData, 'acmn-wire'>

function AcmnWireEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<AcmnWireEdge>) {
  const wireType = data?.wireType ?? 'data'
  const style = acmnWireStyles[wireType]

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const markerId = `acmn-marker-${wireType}`

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
        >
          <path d="M2,2 L10,6 L2,10" fill="none" stroke={style.color} strokeWidth="1.5" />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: style.color,
          strokeWidth: style.strokeWidth,
          strokeDasharray: style.strokeDasharray,
        }}
        markerEnd={style.markerEnd ? `url(#${markerId})` : undefined}
        className={style.animated ? 'react-flow__edge-path animated' : undefined}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="rounded bg-background px-1.5 py-0.5 text-[10px] font-medium border border-border"
        >
          <span style={{ color: style.color }}>{style.label}</span>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default memo(AcmnWireEdge)
