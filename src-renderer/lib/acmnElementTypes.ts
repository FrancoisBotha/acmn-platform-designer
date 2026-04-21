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
} from 'lucide-react'

export type AcmnCategory = 'plan-items' | 'agent-plan-items' | 'cmmn' | 'structure' | 'connectors' | 'domain'

export interface AcmnElementType {
  id: string
  label: string
  category: AcmnCategory
  icon: LucideIcon
  defaultWidth: number
  defaultHeight: number
  defaultColor: string
}

export const acmnElementTypes: AcmnElementType[] = [
  // Plan Items (7)
  { id: 'goal', label: 'Goal', category: 'plan-items', icon: Target, defaultWidth: 200, defaultHeight: 80, defaultColor: '#3b82f6' },
  { id: 'objective', label: 'Objective', category: 'plan-items', icon: Flag, defaultWidth: 200, defaultHeight: 80, defaultColor: '#6366f1' },
  { id: 'milestone', label: 'Milestone', category: 'plan-items', icon: Milestone, defaultWidth: 200, defaultHeight: 80, defaultColor: '#8b5cf6' },
  { id: 'deliverable', label: 'Deliverable', category: 'plan-items', icon: Package, defaultWidth: 200, defaultHeight: 80, defaultColor: '#a855f7' },
  { id: 'work-package', label: 'Work Package', category: 'plan-items', icon: ListChecks, defaultWidth: 200, defaultHeight: 80, defaultColor: '#0ea5e9' },
  { id: 'decision', label: 'Decision', category: 'plan-items', icon: GitBranch, defaultWidth: 200, defaultHeight: 80, defaultColor: '#14b8a6' },
  { id: 'risk', label: 'Risk', category: 'plan-items', icon: AlertTriangle, defaultWidth: 200, defaultHeight: 80, defaultColor: '#f59e0b' },

  // Agent Plan Items (7)
  { id: 'agent', label: 'Agent', category: 'agent-plan-items', icon: Bot, defaultWidth: 200, defaultHeight: 80, defaultColor: '#a855f7' },
  { id: 'tool', label: 'Tool', category: 'agent-plan-items', icon: Wrench, defaultWidth: 200, defaultHeight: 80, defaultColor: '#22c55e' },
  { id: 'guardrail', label: 'Guardrail', category: 'agent-plan-items', icon: ShieldAlert, defaultWidth: 200, defaultHeight: 80, defaultColor: '#ef4444' },
  { id: 'evaluator', label: 'Evaluator', category: 'agent-plan-items', icon: ScanSearch, defaultWidth: 200, defaultHeight: 80, defaultColor: '#06b6d4' },
  { id: 'handoff', label: 'Handoff', category: 'agent-plan-items', icon: ArrowLeftRight, defaultWidth: 200, defaultHeight: 80, defaultColor: '#ec4899' },
  { id: 'human-task', label: 'Human Task', category: 'agent-plan-items', icon: UserCheck, defaultWidth: 200, defaultHeight: 80, defaultColor: '#f97316' },
  { id: 'process-task', label: 'Process Task', category: 'agent-plan-items', icon: Cog, defaultWidth: 200, defaultHeight: 80, defaultColor: '#3b82f6' },

  // CMMN Structural Elements (6)
  { id: 'case-plan-model', label: 'Case Plan Model', category: 'cmmn', icon: Briefcase, defaultWidth: 400, defaultHeight: 300, defaultColor: '#334155' },
  { id: 'stage', label: 'Stage', category: 'cmmn', icon: Layers, defaultWidth: 300, defaultHeight: 200, defaultColor: '#f59e0b' },
  { id: 'cmmn-milestone', label: 'Milestone (CMMN)', category: 'cmmn', icon: Milestone, defaultWidth: 100, defaultHeight: 100, defaultColor: '#f59e0b' },
  { id: 'sentry-entry', label: 'Sentry (Entry)', category: 'cmmn', icon: Diamond, defaultWidth: 32, defaultHeight: 32, defaultColor: '#f59e0b' },
  { id: 'sentry-exit', label: 'Sentry (Exit)', category: 'cmmn', icon: Diamond, defaultWidth: 32, defaultHeight: 32, defaultColor: '#f59e0b' },
  { id: 'discretionary-item', label: 'Discretionary Item', category: 'cmmn', icon: SquareDashed, defaultWidth: 200, defaultHeight: 80, defaultColor: '#f59e0b' },

  // Structure (6)
  { id: 'component', label: 'Component', category: 'structure', icon: Component, defaultWidth: 240, defaultHeight: 120, defaultColor: '#10b981' },
  { id: 'layer', label: 'Layer', category: 'structure', icon: Layers, defaultWidth: 300, defaultHeight: 200, defaultColor: '#06b6d4' },
  { id: 'service', label: 'Service', category: 'structure', icon: Server, defaultWidth: 200, defaultHeight: 80, defaultColor: '#22c55e' },
  { id: 'interface', label: 'Interface', category: 'structure', icon: Plug, defaultWidth: 200, defaultHeight: 80, defaultColor: '#64748b' },
  { id: 'module', label: 'Module', category: 'structure', icon: LayoutGrid, defaultWidth: 240, defaultHeight: 120, defaultColor: '#0d9488' },
  { id: 'boundary', label: 'Boundary', category: 'structure', icon: Box, defaultWidth: 320, defaultHeight: 240, defaultColor: '#78716c' },

  // Connectors (1)
  { id: 'connector', label: 'Connector', category: 'connectors', icon: Cable, defaultWidth: 200, defaultHeight: 80, defaultColor: '#94a3b8' },

  // Domain (1)
  { id: 'domain-context', label: 'Domain Context', category: 'domain', icon: Globe, defaultWidth: 320, defaultHeight: 240, defaultColor: '#e11d48' },
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
}
