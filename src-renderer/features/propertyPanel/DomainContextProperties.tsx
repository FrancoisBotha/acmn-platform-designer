import { useCallback, useMemo, useState } from 'react'
import type { Node } from '@xyflow/react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useCanvasStore } from '@/state/canvasStore'
import { UpdateElementPropertiesCommand } from '@/state/commands'
import { FieldLabel } from './HelpTooltip'

function getData(node: Node): Record<string, unknown> {
  return node.data as Record<string, unknown>
}

function useDomainContextUpdate(nodeId: string) {
  const pushCommand = useCanvasStore((s) => s.pushCommand)
  const nodes = useCanvasStore((s) => s.nodes)

  const currentData = useMemo(() => {
    const node = nodes.find((n) => n.id === nodeId)
    return node ? getData(node) : {}
  }, [nodes, nodeId])

  const updateProps = useCallback(
    (props: Record<string, unknown>) => {
      const oldProps: Record<string, unknown> = {}
      for (const key of Object.keys(props)) {
        oldProps[key] = currentData[key]
      }
      pushCommand(new UpdateElementPropertiesCommand(nodeId, props, oldProps))
    },
    [nodeId, pushCommand, currentData],
  )

  return { data: currentData, updateProps }
}

function CollapsibleSection({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-border rounded">
      <button
        type="button"
        className="flex w-full items-center gap-1.5 px-2 py-1.5 text-xs font-medium hover:bg-accent/50"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="flex-1 text-left">{title}</span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {count}
        </span>
      </button>
      {open && <div className="border-t border-border px-2 py-2">{children}</div>}
    </div>
  )
}

function SummaryList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground italic">None defined</p>
  }
  return (
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={item} className="text-xs text-foreground truncate">
          {item}
        </li>
      ))}
    </ul>
  )
}

function LibraryPickerDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[400px] rounded-lg border border-border bg-background p-6 shadow-lg">
        <h3 className="text-sm font-semibold mb-2">Domain Context Library</h3>
        <p className="text-xs text-muted-foreground mb-4">
          The domain context library picker will be available in a future release
          (epic_DOMAIN_CONTEXT_07).
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function DomainContextProperties({ node }: { node: Node }) {
  const { data } = useDomainContextUpdate(node.id)
  const [pickerOpen, setPickerOpen] = useState(false)

  const domainName = String(data.domainName ?? data.label ?? 'Unnamed Domain')
  const domainVersion = String(data.domainVersion ?? '1.0.0')
  const bindingMode = String(data.bindingMode ?? 'reference') as 'reference' | 'copy'

  const vocabulary = Array.isArray(data.vocabulary)
    ? (data.vocabulary as string[])
    : data.vocabulary && typeof data.vocabulary === 'object'
      ? Object.keys(data.vocabulary as Record<string, unknown>)
      : []

  const schemas = Array.isArray(data.schemas)
    ? (data.schemas as string[])
    : data.schemas && typeof data.schemas === 'object'
      ? Object.keys(data.schemas as Record<string, unknown>)
      : []

  const rules = Array.isArray(data.rules)
    ? (data.rules as string[])
    : data.rules && typeof data.rules === 'object'
      ? Object.keys(data.rules as Record<string, unknown>)
      : []

  const decisionTables = Array.isArray(data.decisionTables)
    ? (data.decisionTables as string[])
    : data.decisionTables && typeof data.decisionTables === 'object'
      ? Object.keys(data.decisionTables as Record<string, unknown>)
      : []

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel label="Domain Name" tooltip="The name of the domain context bound to this element" />
        <input
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={domainName}
          readOnly
        />
      </div>

      <div>
        <FieldLabel label="Version" tooltip="The version of the domain context definition" />
        <input
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={domainVersion}
          readOnly
        />
      </div>

      <div>
        <FieldLabel label="Binding Mode" tooltip="Whether this domain context is linked by reference or copied into the model" />
        <div className="flex items-center gap-2">
          <input
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
            value={bindingMode}
            readOnly
          />
        </div>
      </div>

      <div>
        <button
          type="button"
          className="w-full rounded border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent/50"
          onClick={() => setPickerOpen(true)}
        >
          Change&hellip;
        </button>
      </div>

      <div className="pt-2 border-t border-border">
        <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
          Domain Summary
        </h3>
        <div className="space-y-2">
          <CollapsibleSection title="Vocabulary" count={vocabulary.length}>
            <SummaryList items={vocabulary} />
          </CollapsibleSection>

          <CollapsibleSection title="Schemas" count={schemas.length}>
            <SummaryList items={schemas} />
          </CollapsibleSection>

          <CollapsibleSection title="Rules" count={rules.length}>
            <SummaryList items={rules} />
          </CollapsibleSection>

          <CollapsibleSection title="Decision Tables" count={decisionTables.length}>
            <SummaryList items={decisionTables} />
          </CollapsibleSection>
        </div>
      </div>

      <LibraryPickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  )
}
