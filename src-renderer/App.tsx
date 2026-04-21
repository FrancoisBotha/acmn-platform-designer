import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <aside className="w-60 shrink-0 border-r border-border bg-muted/40 p-4">
        <h2 className="mb-3 text-sm font-semibold tracking-tight">Palette</h2>
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-xs">Components</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xs text-muted-foreground">
              Drag nodes onto the canvas
            </p>
          </CardContent>
        </Card>
      </aside>

      <main className="flex-1 relative">
        <ReactFlow>
          <Background variant={BackgroundVariant.Dots} />
          <Controls />
          <MiniMap position="bottom-right" />
        </ReactFlow>
      </main>

      <aside className="w-72 shrink-0 border-l border-border bg-muted/40 p-4">
        <h2 className="mb-3 text-sm font-semibold tracking-tight">
          Properties
        </h2>
        <p className="text-xs text-muted-foreground">
          Select a node to view its properties
        </p>
      </aside>
    </div>
  )
}
