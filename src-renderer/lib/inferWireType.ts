import type { PortType } from './acmnElementTypes'
import type { AcmnWireType } from './acmnWireStyles'

export interface WireEndpoint {
  portType: PortType
  elementType: string
  hasConfidenceThreshold?: boolean
}

export function inferWireType(source: WireEndpoint, target: WireEndpoint): AcmnWireType {
  if (source.hasConfidenceThreshold) return 'confidence-gated'

  if (source.portType === 'escalation') return 'escalation'

  if (source.portType === 'event') return 'event'

  if (source.portType === 'feedback') return 'data'

  if (source.portType === 'case_file' || target.portType === 'case_file') return 'case-file'

  return 'data'
}
