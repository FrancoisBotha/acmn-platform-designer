import { useEffect, useState } from 'react'
import type { RecentProject } from '@/contracts/backend'
import { useProjectStore } from '@/state/projectStore'
import { NewProjectWizard } from '@/features/newProject/NewProjectWizard'

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 30) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

interface OpenProjectError {
  path: string | null
  message: string
}

export function WelcomeScreen() {
  const { recentProjects, setRecentProjects, setCurrentProject, setLoading } = useProjectStore()
  const [showNewProject, setShowNewProject] = useState(false)
  const [openError, setOpenError] = useState<OpenProjectError | null>(null)

  useEffect(() => {
    window.acmn.project.listRecent().then(setRecentProjects).catch(() => {})
  }, [setRecentProjects])

  async function handleOpenProject() {
    setOpenError(null)
    const folderPath = await window.acmn.dialog.openFolder()
    if (!folderPath) return

    setLoading(true)
    try {
      const project = await window.acmn.project.open(folderPath)
      setCurrentProject(project)
    } catch {
      setOpenError({
        path: folderPath,
        message: 'Folder is not a valid ACMN project',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleOpenRecent(path: string) {
    setOpenError(null)
    setLoading(true)
    try {
      const project = await window.acmn.project.open(path)
      setCurrentProject(project)
    } catch {
      setOpenError({
        path,
        message: 'Folder is not a valid ACMN project',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleChooseAnother() {
    setOpenError(null)
    await handleOpenProject()
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-3xl rounded-xl border border-border bg-card p-10">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[hsl(245,80%,65%)] text-xl font-bold text-white">
            AP
          </div>
          <h1 className="text-2xl font-semibold">Welcome to ACMN Designer</h1>
          <p className="text-sm text-muted-foreground">
            Design case plan models with AI agent orchestration
          </p>
        </div>

        {/* Open error inline */}
        {openError && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="mb-2 text-sm font-medium text-destructive-foreground">
              {openError.message}
            </p>
            {openError.path && (
              <p className="mb-3 truncate text-xs text-muted-foreground">{openError.path}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleChooseAnother}
                className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
              >
                Choose another folder
              </button>
              <button
                onClick={() => setOpenError(null)}
                className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Two-column layout: left = action buttons, right = recent projects */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left column — New project + Open project buttons */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setShowNewProject(true)}
              className="flex flex-col items-start gap-2 rounded-lg border border-border bg-secondary/50 p-5 text-left transition-colors hover:bg-secondary"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(245,80%,65%)] text-sm text-white">
                +
              </span>
              <span className="font-semibold">New project</span>
              <span className="text-sm text-muted-foreground">
                Start a new case plan model with an empty canvas.
              </span>
            </button>

            <button
              onClick={handleOpenProject}
              className="flex flex-col items-start gap-2 rounded-lg border border-border bg-secondary/50 p-5 text-left transition-colors hover:bg-secondary"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm text-muted-foreground">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3.5C2 2.67 2.67 2 3.5 2H6l1.5 1.5H12.5C13.33 3.5 14 4.17 14 5V12.5C14 13.33 13.33 14 12.5 14H3.5C2.67 14 2 13.33 2 12.5V3.5Z" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </span>
              <span className="font-semibold">Open project</span>
              <span className="text-sm text-muted-foreground">
                Browse for an existing .acmn project folder.
              </span>
            </button>
          </div>

          {/* Right column — Recent projects list */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recent Projects
            </h2>
            {recentProjects.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No recent projects. Create or open a project to get started.
              </p>
            ) : (
              <ul className="space-y-1">
                {recentProjects.slice(0, 10).map((rp) => (
                  <li key={rp.path}>
                    <button
                      onClick={() => handleOpenRecent(rp.path)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[hsl(245,80%,65%)] text-[10px] font-bold text-white">
                          AP
                        </span>
                        <div className="overflow-hidden">
                          <p className="truncate text-sm font-medium">{rp.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{rp.path}</p>
                        </div>
                      </div>
                      <span className="shrink-0 pl-4 text-xs text-muted-foreground">
                        {formatRelativeTime(rp.lastModified)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {showNewProject && (
        <NewProjectWizard onClose={() => setShowNewProject(false)} />
      )}
    </div>
  )
}
