export type FileKind = 'project' | 'cpm' | 'domain' | 'test'

export interface MigrationStep {
  (payload: Record<string, unknown>): { toVersion: string; payload: Record<string, unknown> }
}

export type MigrationKey = `${FileKind}:${string}`

function makeKey(fileKind: FileKind, fromVersion: string): MigrationKey {
  return `${fileKind}:${fromVersion}`
}

export const migrationRegistry = new Map<MigrationKey, MigrationStep>()

export function registerMigration(
  fileKind: FileKind,
  fromVersion: string,
  step: MigrationStep
): void {
  migrationRegistry.set(makeKey(fileKind, fromVersion), step)
}

registerMigration('cpm', '1', (payload) => ({
  toVersion: '2',
  payload: {
    ...payload,
    schemaVersion: '2',
    edges: Array.isArray(payload.edges) ? payload.edges : [],
  },
}))

export function migrate(
  fileKind: FileKind,
  fromVersion: string,
  toVersion: string,
  payload: Record<string, unknown>
): { toVersion: string; payload: Record<string, unknown> } {
  let current = fromVersion
  let currentPayload = payload

  while (current !== toVersion) {
    const key = makeKey(fileKind, current)
    const step = migrationRegistry.get(key)
    if (!step) {
      throw new Error(
        `No migration registered for ${fileKind} from version ${current}`
      )
    }
    const result = step(currentPayload)
    current = result.toVersion
    currentPayload = result.payload
  }

  return { toVersion: current, payload: currentPayload }
}
