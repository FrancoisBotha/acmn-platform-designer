import type { PortType, PortDirection } from './acmnElementTypes'

export interface PortInfo {
  portType: PortType
  direction: PortDirection
}

export interface ConnectionEndpoint {
  nodeId: string
  handleId: string
}

export type PortRegistryLookup = (nodeId: string, handleId: string) => PortInfo | undefined

export function canConnect(
  source: ConnectionEndpoint,
  target: ConnectionEndpoint,
  lookupPort: PortRegistryLookup,
): boolean {
  const sourcePort = lookupPort(source.nodeId, source.handleId)
  const targetPort = lookupPort(target.nodeId, target.handleId)

  if (!sourcePort || !targetPort) return false

  if (sourcePort.direction !== 'output' || targetPort.direction !== 'input') return false

  if (sourcePort.portType === 'any' || targetPort.portType === 'any') return true

  return sourcePort.portType === targetPort.portType
}
