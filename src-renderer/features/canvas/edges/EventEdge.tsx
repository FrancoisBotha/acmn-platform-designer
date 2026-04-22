import { memo } from 'react'
import { BaseEdge, getBezierPath, type EdgeProps, type Edge } from '@xyflow/react'

const COLOR = '#22c55e'
const MARKER_ID = 'acmn-marker-event'

type EventEdgeType = Edge<Record<string, unknown>, 'event'>

function EventEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps<EventEdgeType>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <>
      <defs>
        <marker
          id={MARKER_ID}
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
        >
          <path d="M2,2 L10,6 L2,10" fill="none" stroke={COLOR} strokeWidth="1.5" />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: COLOR,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: '3 3',
        }}
        markerEnd={`url(#${MARKER_ID})`}
      />
    </>
  )
}

export default memo(EventEdge)
