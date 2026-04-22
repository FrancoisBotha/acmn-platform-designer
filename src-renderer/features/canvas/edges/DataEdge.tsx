import { memo } from 'react'
import { BaseEdge, getBezierPath, type EdgeProps, type Edge } from '@xyflow/react'

const COLOR = '#3b82f6'
const MARKER_ID = 'acmn-marker-data'

type DataEdgeType = Edge<Record<string, unknown>, 'data'>

function DataEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps<DataEdgeType>) {
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
        }}
        markerEnd={`url(#${MARKER_ID})`}
      />
    </>
  )
}

export default memo(DataEdge)
