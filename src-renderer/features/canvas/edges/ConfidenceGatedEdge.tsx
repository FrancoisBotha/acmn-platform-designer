import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react'

const COLOR = '#f59e0b'
const MARKER_ID = 'acmn-marker-confidence-gated'

type ConfidenceGatedEdgeType = Edge<Record<string, unknown>, 'confidence-gated'>

function ConfidenceGatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps<ConfidenceGatedEdgeType>) {
  const [edgePath, labelX, labelY] = getBezierPath({
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
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <polygon
              points="8,1 15,8 8,15 1,8"
              fill={COLOR}
              stroke="#fff"
              strokeWidth="1"
            />
          </svg>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default memo(ConfidenceGatedEdge)
