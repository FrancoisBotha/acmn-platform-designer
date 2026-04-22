import { useState, useMemo } from 'react'
import { useProjectStore } from '@/state/projectStore'

interface NewProjectWizardProps {
  onClose: () => void
}

const STARTER_TEMPLATES = ['Empty'] as const

export function NewProjectWizard({ onClose }: NewProjectWizardProps) {
  const { setCurrentProject, setLoading } = useProjectStore()

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [template, setTemplate] = useState<string>(STARTER_TEMPLATES[0])
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false)

  const isValid = useMemo(() => {
    return name.trim().length > 0 && location.trim().length > 0
  }, [name, location])

  async function handleBrowse() {
    const folderPath = await window.acmn.dialog.openFolder()
    if (folderPath) {
      setLocation(folderPath)
      setError(null)
    }
  }

  async function handleCreate() {
    if (!isValid || creating) return

    setError(null)

    const isEmpty = await window.acmn.dialog.checkFolderEmpty(location.trim())
    if (!isEmpty) {
      setShowOverwriteConfirm(true)
      return
    }

    await doCreate()
  }

  async function doCreate() {
    setCreating(true)
    setError(null)
    setShowOverwriteConfirm(false)
    setLoading(true)

    try {
      const project = await window.acmn.project.create({
        name: name.trim(),
        location: location.trim(),
        description: description.trim() || undefined,
        template,
      })
      setCurrentProject(project)
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create project'
      setError(message)
    } finally {
      setCreating(false)
      setLoading(false)
    }
  }

  const slugName = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-8 shadow-xl">
        <h2 className="mb-1 text-xl font-semibold">Create new project</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          A project folder (.acmn) contains your case plan models, domain contexts, and test scenarios.
        </p>

        {/* Project name */}
        <div className="mb-4">
          <label htmlFor="project-name" className="mb-1.5 block text-sm font-medium">
            Project name
          </label>
          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Insurance Claims Onboarding"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            autoFocus
          />
        </div>

        {/* Location */}
        <div className="mb-4">
          <label htmlFor="project-location" className="mb-1.5 block text-sm font-medium">
            Location
          </label>
          <div className="flex gap-2">
            <input
              id="project-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Select a folder..."
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              readOnly
            />
            <button
              onClick={handleBrowse}
              className="shrink-0 rounded-md border border-input bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Browse...
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label htmlFor="project-description" className="mb-1.5 block text-sm font-medium">
            Description <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Brief description of this project..."
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>

        {/* Starter template */}
        <div className="mb-4">
          <label htmlFor="project-template" className="mb-1.5 block text-sm font-medium">
            Starter template
          </label>
          <select
            id="project-template"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          >
            {STARTER_TEMPLATES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Project structure preview */}
        {name.trim() && location.trim() && (
          <div className="mb-6">
            <p className="mb-1.5 text-sm font-medium">Project structure (preview)</p>
            <div className="rounded-md border border-border bg-secondary/50 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
              <p>{slugName}/</p>
              <p className="ml-4">project.acmn.json</p>
              <p className="ml-4">case-plan-models/</p>
              <p className="ml-4">domain-contexts/</p>
              <p className="ml-4">test-scenarios/</p>
              <p className="ml-4">assets/</p>
            </div>
          </div>
        )}

        {/* Overwrite confirmation */}
        {showOverwriteConfirm && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3">
            <p className="mb-2 text-sm font-medium text-destructive-foreground">
              Project already exists at this location — overwrite?
            </p>
            <div className="flex gap-2">
              <button
                onClick={doCreate}
                className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/80"
              >
                Overwrite
              </button>
              <button
                onClick={() => setShowOverwriteConfirm(false)}
                className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!isValid || creating}
            className="rounded-md bg-[hsl(245,80%,65%)] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[hsl(245,80%,55%)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
