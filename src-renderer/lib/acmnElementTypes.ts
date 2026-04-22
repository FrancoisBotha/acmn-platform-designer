import type { LucideIcon } from 'lucide-react'
import {
  Target,
  Flag,
  Milestone,
  Package,
  ListChecks,
  GitBranch,
  AlertTriangle,
  Component,
  Layers,
  Server,
  Plug,
  LayoutGrid,
  Box,
  Cable,
  Globe,
  Bot,
  Wrench,
  ShieldAlert,
  ScanSearch,
  ArrowLeftRight,
  UserCheck,
  Cog,
  Briefcase,
  Diamond,
  SquareDashed,
  Mail,
  Webhook,
  FileSearch,
  Clock,
  Database,
  Zap,
} from 'lucide-react'

export type AcmnCategory = 'plan-items' | 'agent-plan-items' | 'cmmn' | 'structure' | 'connectors' | 'domain'

export type PortType = 'data' | 'event' | 'case_file' | 'escalation' | 'feedback' | 'any'

export type PortDirection = 'input' | 'output'

export interface PortDefinition {
  id: string
  direction: PortDirection
  portType: PortType
}

export interface AcmnElementType {
  id: string
  label: string
  category: AcmnCategory
  icon: LucideIcon
  defaultWidth: number
  defaultHeight: number
  defaultColor: string
  connectorSubType?: string
  ports: PortDefinition[]
}

const dataPorts: PortDefinition[] = [
  { id: 'data-in', direction: 'input', portType: 'data' },
  { id: 'data-out', direction: 'output', portType: 'data' },
]

const connectorPorts: PortDefinition[] = [
  { id: 'event-out', direction: 'output', portType: 'event' },
]

const caseFilePorts: PortDefinition[] = [
  { id: 'case-file-in', direction: 'input', portType: 'case_file' },
  { id: 'case-file-out', direction: 'output', portType: 'case_file' },
]

const anyPorts: PortDefinition[] = [
  { id: 'any-in', direction: 'input', portType: 'any' },
  { id: 'any-out', direction: 'output', portType: 'any' },
]

export const acmnElementTypes: AcmnElementType[] = [
  // Plan Items (7)
  { id: 'goal', label: 'Goal', category: 'plan-items', icon: Target, defaultWidth: 200, defaultHeight: 80, defaultColor: '#3b82f6', ports: dataPorts },
  { id: 'objective', label: 'Objective', category: 'plan-items', icon: Flag, defaultWidth: 200, defaultHeight: 80, defaultColor: '#6366f1', ports: dataPorts },
  { id: 'milestone', label: 'Milestone', category: 'plan-items', icon: Milestone, defaultWidth: 200, defaultHeight: 80, defaultColor: '#8b5cf6', ports: dataPorts },
  { id: 'deliverable', label: 'Deliverable', category: 'plan-items', icon: Package, defaultWidth: 200, defaultHeight: 80, defaultColor: '#a855f7', ports: dataPorts },
  { id: 'work-package', label: 'Work Package', category: 'plan-items', icon: ListChecks, defaultWidth: 200, defaultHeight: 80, defaultColor: '#0ea5e9', ports: dataPorts },
  { id: 'decision', label: 'Decision', category: 'plan-items', icon: GitBranch, defaultWidth: 200, defaultHeight: 80, defaultColor: '#14b8a6', ports: dataPorts },
  { id: 'risk', label: 'Risk', category: 'plan-items', icon: AlertTriangle, defaultWidth: 200, defaultHeight: 80, defaultColor: '#f59e0b', ports: dataPorts },

  // Agent Plan Items (7)
  { id: 'agent', label: 'Agent', category: 'agent-plan-items', icon: Bot, defaultWidth: 200, defaultHeight: 80, defaultColor: '#a855f7', ports: dataPorts },
  { id: 'tool', label: 'Tool', category: 'agent-plan-items', icon: Wrench, defaultWidth: 200, defaultHeight: 80, defaultColor: '#22c55e', ports: dataPorts },
  {
    id: 'guardrail', label: 'Guardrail', category: 'agent-plan-items', icon: ShieldAlert, defaultWidth: 200, defaultHeight: 80, defaultColor: '#ef4444',
    ports: [
      { id: 'data-in', direction: 'input', portType: 'data' },
      { id: 'data-out', direction: 'output', portType: 'data' },
      { id: 'escalation-out', direction: 'output', portType: 'escalation' },
    ],
  },
  {
    id: 'evaluator', label: 'Evaluator', category: 'agent-plan-items', icon: ScanSearch, defaultWidth: 200, defaultHeight: 80, defaultColor: '#06b6d4',
    ports: [
      { id: 'data-in', direction: 'input', portType: 'data' },
      { id: 'feedback-out', direction: 'output', portType: 'feedback' },
      { id: 'escalation-out', direction: 'output', portType: 'escalation' },
    ],
  },
  { id: 'handoff', label: 'Handoff', category: 'agent-plan-items', icon: ArrowLeftRight, defaultWidth: 200, defaultHeight: 80, defaultColor: '#ec4899', ports: dataPorts },
  { id: 'human-task', label: 'Human Task', category: 'agent-plan-items', icon: UserCheck, defaultWidth: 200, defaultHeight: 80, defaultColor: '#f97316', ports: dataPorts },
  { id: 'process-task', label: 'Process Task', category: 'agent-plan-items', icon: Cog, defaultWidth: 200, defaultHeight: 80, defaultColor: '#3b82f6', ports: dataPorts },

  // CMMN Structural Elements (6)
  { id: 'case-plan-model', label: 'Case Plan Model', category: 'cmmn', icon: Briefcase, defaultWidth: 400, defaultHeight: 300, defaultColor: '#334155', ports: caseFilePorts },
  { id: 'stage', label: 'Stage', category: 'cmmn', icon: Layers, defaultWidth: 300, defaultHeight: 200, defaultColor: '#f59e0b', ports: caseFilePorts },
  { id: 'cmmn-milestone', label: 'Milestone (CMMN)', category: 'cmmn', icon: Milestone, defaultWidth: 100, defaultHeight: 100, defaultColor: '#f59e0b', ports: anyPorts },
  { id: 'sentry-entry', label: 'Sentry (Entry)', category: 'cmmn', icon: Diamond, defaultWidth: 32, defaultHeight: 32, defaultColor: '#f59e0b', ports: [{ id: 'any-in', direction: 'input', portType: 'any' }] },
  { id: 'sentry-exit', label: 'Sentry (Exit)', category: 'cmmn', icon: Diamond, defaultWidth: 32, defaultHeight: 32, defaultColor: '#f59e0b', ports: [{ id: 'any-out', direction: 'output', portType: 'any' }] },
  { id: 'discretionary-item', label: 'Discretionary Item', category: 'cmmn', icon: SquareDashed, defaultWidth: 200, defaultHeight: 80, defaultColor: '#f59e0b', ports: dataPorts },

  // Structure (6)
  { id: 'component', label: 'Component', category: 'structure', icon: Component, defaultWidth: 240, defaultHeight: 120, defaultColor: '#10b981', ports: anyPorts },
  { id: 'layer', label: 'Layer', category: 'structure', icon: Layers, defaultWidth: 300, defaultHeight: 200, defaultColor: '#06b6d4', ports: anyPorts },
  { id: 'service', label: 'Service', category: 'structure', icon: Server, defaultWidth: 200, defaultHeight: 80, defaultColor: '#22c55e', ports: anyPorts },
  { id: 'interface', label: 'Interface', category: 'structure', icon: Plug, defaultWidth: 200, defaultHeight: 80, defaultColor: '#64748b', ports: anyPorts },
  { id: 'module', label: 'Module', category: 'structure', icon: LayoutGrid, defaultWidth: 240, defaultHeight: 120, defaultColor: '#0d9488', ports: anyPorts },
  { id: 'boundary', label: 'Boundary', category: 'structure', icon: Box, defaultWidth: 320, defaultHeight: 240, defaultColor: '#78716c', ports: anyPorts },

  // Connectors (7 sub-types)
  { id: 'connector-email', label: 'Email Connector', category: 'connectors', icon: Mail, defaultWidth: 200, defaultHeight: 80, defaultColor: '#94a3b8', connectorSubType: 'email', ports: connectorPorts },
  { id: 'connector-webhook', label: 'Webhook Connector', category: 'connectors', icon: Webhook, defaultWidth: 200, defaultHeight: 80, defaultColor: '#94a3b8', connectorSubType: 'webhook', ports: connectorPorts },
  { id: 'connector-file-watch', label: 'File Watch Connector', category: 'connectors', icon: FileSearch, defaultWidth: 200, defaultHeight: 80, defaultColor: '#94a3b8', connectorSubType: 'file-watch', ports: connectorPorts },
  { id: 'connector-schedule', label: 'Schedule Connector', category: 'connectors', icon: Clock, defaultWidth: 200, defaultHeight: 80, defaultColor: '#94a3b8', connectorSubType: 'schedule', ports: connectorPorts },
  { id: 'connector-database', label: 'Database Connector', category: 'connectors', icon: Database, defaultWidth: 200, defaultHeight: 80, defaultColor: '#94a3b8', connectorSubType: 'database', ports: connectorPorts },
  { id: 'connector-event', label: 'Event Connector', category: 'connectors', icon: Zap, defaultWidth: 200, defaultHeight: 80, defaultColor: '#94a3b8', connectorSubType: 'event', ports: connectorPorts },
  { id: 'connector-api', label: 'API Connector', category: 'connectors', icon: Globe, defaultWidth: 200, defaultHeight: 80, defaultColor: '#94a3b8', connectorSubType: 'api', ports: connectorPorts },

  // Domain (1)
  { id: 'domain-context', label: 'Domain Context', category: 'domain', icon: Globe, defaultWidth: 320, defaultHeight: 240, defaultColor: '#e11d48', ports: anyPorts },
]

export const acmnElementTypeMap = new Map(
  acmnElementTypes.map((t) => [t.id, t])
)

export const categoryLabels: Record<AcmnCategory, string> = {
  'plan-items': 'Plan Items',
  'agent-plan-items': 'Agent Plan Items',
  'cmmn': 'CMMN Elements',
  'structure': 'Structure',
  'connectors': 'Connectors',
  'domain': 'Domain',
}

export const categories: AcmnCategory[] = ['plan-items', 'agent-plan-items', 'cmmn', 'structure', 'connectors', 'domain']

export const nodeTypeMap: Record<string, string> = {
  agent: 'agent',
  tool: 'tool',
  guardrail: 'guardrail',
  evaluator: 'evaluator',
  handoff: 'handoff',
  'human-task': 'human-task',
  'process-task': 'process-task',
  'case-plan-model': 'case-plan-model',
  stage: 'stage',
  'cmmn-milestone': 'milestone',
  'sentry-entry': 'sentry-entry',
  'sentry-exit': 'sentry-exit',
  'discretionary-item': 'discretionary-item',
  'connector-email': 'connector',
  'connector-webhook': 'connector',
  'connector-file-watch': 'connector',
  'connector-schedule': 'connector',
  'connector-database': 'connector',
  'connector-event': 'connector',
  'connector-api': 'connector',
}
