import { memo } from 'react'
import { getBezierPath, type EdgeProps, type Edge } from '@xyflow/react'

const COLOR = '#64748b'
const MARKER_ID = 'acmn-marker-case-file'
const GAP = 3

type CaseFileEdgeType = Edge<Record<string, unknown>, 'case-file'>

function CaseFileEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps<CaseFileEdgeType>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const sw = selected ? 2 : 1.5

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
      <path
        id={`${id}-outer`}
        d={edgePath}
        fill="none"
        stroke={COLOR}
        strokeWidth={sw}
        style={{ transform: `translateY(-${GAP}px)` }}
        className="react-flow__edge-path"
      />
      <path
        id={`${id}-inner`}
        d={edgePath}
        fill="none"
        stroke={COLOR}
        strokeWidth={sw}
        style={{ transform: `translateY(${GAP}px)` }}
        className="react-flow__edge-path"
        markerEnd={`url(#${MARKER_ID})`}
      />
      {/* Invisible wide hit-area for selection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        className="react-flow__edge-interaction"
      />
    </>
  )
}

export default memo(CaseFileEdge)
