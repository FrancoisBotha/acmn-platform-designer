import { Handle, useConnection, useNodeId, type HandleProps } from '@xyflow/react'
import { canConnect } from '@/state/canvasStore'

export default function AcmnHandle(props: HandleProps) {
  const nodeId = useNodeId()
  const connection = useConnection()

  let validityClass = ''
  if (
    connection.inProgress &&
    props.type === 'target' &&
    nodeId &&
    props.id &&
    connection.fromHandle.nodeId !== nodeId
  ) {
    const valid = canConnect(
      { nodeId: connection.fromHandle.nodeId, handleId: connection.fromHandle.id ?? '' },
      { nodeId, handleId: props.id },
    )
    validityClass = valid ? 'acmn-handle-valid' : 'acmn-handle-invalid'
  }

  return (
    <Handle
      {...props}
      className={`acmn-handle ${validityClass} ${props.className ?? ''}`}
    />
  )
}
