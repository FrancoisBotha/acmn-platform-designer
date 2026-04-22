import { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, Plus } from 'lucide-react'
import { useProjectStore } from '@/state/projectStore'

const SESSION_KEY = 'project-tree-collapsed'

function getInitialCollapsed(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'true'
  } catch {
    return false
  }
}

function cpmNameFromFile(file: string): string {
  const parts = file.split('/')
  const filename = parts[parts.length - 1]
  return filename.replace(/\.json$/, '').replace(/-/g, ' ')
}

function dcNameFromFile(file: string): string {
  const parts = file.split('/')
  const filename = parts[parts.length - 1]
  return filename.replace(/\.json$/, '').replace(/-/g, ' ')
}

export function ProjectTree() {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)

  const project = useProjectStore((s) => s.currentProject)
  const activeCpmId = useProjectStore((s) => s.activeCpmId)
  const setActiveCpm = useProjectStore((s) => s.setActiveCpm)
  const createCpm = useProjectStore((s) => s.createCpm)

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        sessionStorage.setItem(SESSION_KEY, String(next))
      } catch {
        // sessionStorage may be unavailable
      }
      return next
    })
  }, [])

  const handleNewCpm = useCallback(() => {
    if (!project) return
    const existing = project.casePlanModels.length
    let name = 'Untitled CPM'
    if (existing > 0) {
      name = `Untitled CPM ${existing + 1}`
    }
    createCpm(name)
  }, [project, createCpm])

  const handleCpmClick = useCallback(
    (id: string) => {
      setActiveCpm(id)
    },
    [setActiveCpm],
  )

  const handleDomainContextClick = useCallback((_id: string) => {
    // No-op in this epic; wiring owned by epic_DOMAIN_CONTEXT_07
  }, [])

  const handleTestScenarioClick = useCallback((_id: string) => {
    // No-op in this epic; wiring owned by epic_TEST_MODE_AND_SIMULATOR_10
  }, [])

  if (!project) return null

  if (collapsed) {
    return (
      <aside className="shrink-0 border-r border-border bg-muted/40">
        <button
          onClick={toggleCollapse}
          className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
          title="Expand project tree"
        >
          <ChevronRight size={16} />
        </button>
      </aside>
    )
  }

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-muted/40 overflow-y-auto">
      <div className="flex h-10 items-center justify-between border-b border-border px-3">
        <span className="text-xs font-semibold tracking-tight uppercase">Project</span>
        <button
          onClick={toggleCollapse}
          className="text-muted-foreground hover:text-foreground"
          title="Collapse project tree"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="p-3">
        <section className="mb-4">
          <h3 className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Case Plan Models
          </h3>
          <ul className="flex flex-col gap-0.5">
            {project.casePlanModels.map((cpm) => (
              <li key={cpm.id}>
                <button
                  onClick={() => handleCpmClick(cpm.id)}
                  className={`w-full text-left rounded-md px-2 py-1 text-xs transition-colors ${
                    cpm.id === activeCpmId
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-foreground hover:bg-accent/50'
                  }`}
                >
                  {cpmNameFromFile(cpm.file)}
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={handleNewCpm}
            className="mt-2 flex w-full items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            <Plus size={12} />
            <span>New CPM</span>
          </button>
        </section>

        <section className="mb-4">
          <h3 className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Domain Contexts
          </h3>
          <ul className="flex flex-col gap-0.5">
            {project.domainContexts.map((dc) => (
              <li key={dc.id}>
                <button
                  onClick={() => handleDomainContextClick(dc.id)}
                  className="w-full text-left rounded-md px-2 py-1 text-xs text-foreground transition-colors hover:bg-accent/50"
                >
                  {dcNameFromFile(dc.file)}
                </button>
              </li>
            ))}
          </ul>
          {project.domainContexts.length === 0 && (
            <p className="px-2 text-xs text-muted-foreground">None</p>
          )}
        </section>

        <section>
          <h3 className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Test Scenarios
          </h3>
          <p className="px-2 text-xs text-muted-foreground">None</p>
        </section>
      </div>
    </aside>
  )
}
