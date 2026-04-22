export class FutureVersionError extends Error {
  readonly filePath: string
  readonly fileVersion: string
  readonly appVersion: string

  constructor(filePath: string, fileVersion: string, appVersion: string) {
    super(
      `File "${filePath}" uses schema version ${fileVersion}, but this application only supports up to version ${appVersion}. Please update the application.`
    )
    this.name = 'FutureVersionError'
    this.filePath = filePath
    this.fileVersion = fileVersion
    this.appVersion = appVersion
  }
}

export class MigrationError extends Error {
  readonly filePath: string
  readonly fromVersion: string
  readonly toVersion: string
  readonly cause: unknown

  constructor(filePath: string, fromVersion: string, toVersion: string, cause: unknown) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    super(
      `Migration failed for "${filePath}" at step ${fromVersion} → ${toVersion}: ${reason}`
    )
    this.name = 'MigrationError'
    this.filePath = filePath
    this.fromVersion = fromVersion
    this.toVersion = toVersion
    this.cause = cause
  }
}

export class CorruptFileError extends Error {
  readonly filePath: string
  readonly cause: unknown

  constructor(filePath: string, cause: unknown) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    super(`File "${filePath}" is corrupt or unreadable: ${reason}`)
    this.name = 'CorruptFileError'
    this.filePath = filePath
    this.cause = cause
  }
}
