import type { AcmnWireType } from '@/lib/acmnWireStyles'

export interface AcmnNodeData {
  id: string
  elementType: string
  label: string
  position: { x: number; y: number }
  parentId?: string
  connectorSubType?: string
  properties: Record<string, unknown>
}

export interface AcmnEdgeData {
  id: string
  source: string
  target: string
  wireType: AcmnWireType
  label?: string
}

export interface AcmnDocument {
  id: string
  name: string
  version: number
  nodes: AcmnNodeData[]
  edges: AcmnEdgeData[]
  createdAt: string
  updatedAt: string
}

export interface BackendContract {
  // File persistence
  saveDocument(doc: AcmnDocument): Promise<{ filePath: string }>
  loadDocument(filePath: string): Promise<AcmnDocument>
  listRecentDocuments(): Promise<{ filePath: string; name: string; updatedAt: string }[]>

  // File dialogs
  showSaveDialog(defaultName: string): Promise<string | null>
  showOpenDialog(): Promise<string | null>

  // Export
  exportPng(doc: AcmnDocument, filePath: string): Promise<void>
  exportSvg(doc: AcmnDocument, filePath: string): Promise<void>

  // Application lifecycle
  getAppVersion(): Promise<string>
  onBeforeQuit(callback: () => Promise<boolean>): void
}
