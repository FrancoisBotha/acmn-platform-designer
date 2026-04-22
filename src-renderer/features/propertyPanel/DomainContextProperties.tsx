import { useState } from 'react'
import type { Node } from '@xyflow/react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { FormProvider } from 'react-hook-form'
import { domainContextSchema } from '@/lib/validation'
import { useValidatedPropertyForm } from '@/hooks/useValidatedPropertyForm'
import { ValidatedTextInput, ValidatedSelectInput } from './ValidatedFields'

const bindingModeOptions = [
  { value: 'reference', label: 'Reference' },
  { value: 'copy', label: 'Copy' },
] as const

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

function extractStringList(data: unknown): string[] {
  if (Array.isArray(data)) return data as string[]
  if (data && typeof data === 'object') return Object.keys(data as Record<string, unknown>)
  return []
}

export function DomainContextProperties({ node }: { node: Node }) {
  const { form } = useValidatedPropertyForm(domainContextSchema, node.id)
  const [pickerOpen, setPickerOpen] = useState(false)

  const nodeData = node.data as Record<string, unknown>
  const vocabulary = extractStringList(nodeData.vocabulary)
  const schemas = extractStringList(nodeData.schemas)
  const rules = extractStringList(nodeData.rules)
  const decisionTables = extractStringList(nodeData.decisionTables)

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        <ValidatedTextInput
          name="label"
          label="Domain Name"
          tooltip="The name of the domain context bound to this element"
          readOnly
        />

        <ValidatedTextInput
          name="version"
          label="Version"
          tooltip="The version of the domain context definition"
          readOnly
        />

        <ValidatedSelectInput
          name="bindingMode"
          label="Binding Mode"
          tooltip="Whether this domain context is linked by reference or copied into the model"
          options={bindingModeOptions}
        />

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
    </FormProvider>
  )
}
