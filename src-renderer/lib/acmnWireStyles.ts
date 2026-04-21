export type AcmnWireType = 'data' | 'confidence-gated' | 'escalation' | 'event' | 'case-file'

export interface AcmnWireStyle {
  wireType: AcmnWireType
  label: string
  color: string
  strokeWidth: number
  strokeDasharray?: string
  animated: boolean
  markerEnd?: boolean
}

export const acmnWireStyles: Record<AcmnWireType, AcmnWireStyle> = {
  data: {
    wireType: 'data',
    label: 'Data',
    color: '#3b82f6',
    strokeWidth: 2,
    animated: false,
    markerEnd: true,
  },
  'confidence-gated': {
    wireType: 'confidence-gated',
    label: 'Confidence-Gated',
    color: '#f59e0b',
    strokeWidth: 2,
    strokeDasharray: '8 4',
    animated: false,
    markerEnd: true,
  },
  escalation: {
    wireType: 'escalation',
    label: 'Escalation',
    color: '#ef4444',
    strokeWidth: 3,
    animated: true,
    markerEnd: true,
  },
  event: {
    wireType: 'event',
    label: 'Event',
    color: '#22c55e',
    strokeWidth: 2,
    strokeDasharray: '3 3',
    animated: false,
    markerEnd: true,
  },
  'case-file': {
    wireType: 'case-file',
    label: 'Case File',
    color: '#64748b',
    strokeWidth: 2,
    strokeDasharray: '12 4 3 4',
    animated: false,
    markerEnd: true,
  },
}
