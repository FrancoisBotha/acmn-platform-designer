import {
  acmnElementTypes,
  categories,
  categoryLabels,
  type AcmnCategory,
} from '@/lib/acmnElementTypes'

function PaletteEntry({ id, label, icon: Icon }: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/acmn-element-type', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable={true}
      onDragStart={onDragStart}
      className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-xs cursor-grab hover:bg-accent active:cursor-grabbing"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </div>
  )
}

function PaletteSection({ category }: { category: AcmnCategory }) {
  const entries = acmnElementTypes.filter((t) => t.category === category)
  return (
    <div className="mb-4">
      <h3 className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {categoryLabels[category]}
      </h3>
      <div className="flex flex-col gap-1">
        {entries.map((entry) => (
          <PaletteEntry key={entry.id} id={entry.id} label={entry.label} icon={entry.icon} />
        ))}
      </div>
    </div>
  )
}

export default function Palette() {
  return (
    <aside className="w-60 shrink-0 border-r border-border bg-muted/40 p-4 overflow-y-auto">
      <h2 className="mb-3 text-sm font-semibold tracking-tight">Palette</h2>
      {categories.map((cat) => (
        <PaletteSection key={cat} category={cat} />
      ))}
    </aside>
  )
}
