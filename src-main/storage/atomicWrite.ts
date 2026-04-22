import fs from 'fs/promises'
import path from 'path'

const WINDOWS_RETRY_CODES = new Set(['EBUSY', 'EPERM'])
const RETRY_BASE_MS = 50
const MAX_BACKUPS = 3

export interface WriteAtomicOptions {
  rotate?: boolean
}

export async function rotateBackups(targetPath: string): Promise<void> {
  try {
    await fs.access(targetPath)
  } catch {
    return
  }

  for (let i = MAX_BACKUPS - 1; i >= 1; i--) {
    const src = `${targetPath}.bak.${i}`
    const dst = `${targetPath}.bak.${i + 1}`
    try {
      await fs.rename(src, dst)
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
        continue
      }
      throw err
    }
  }

  await fs.rename(targetPath, `${targetPath}.bak.1`)
}

export async function writeAtomic(targetPath: string, contents: string, options?: WriteAtomicOptions): Promise<void> {
  const tmpPath = targetPath + '.tmp'
  const handle = await fs.open(tmpPath, 'w')
  try {
    await handle.writeFile(contents, 'utf-8')
    await handle.sync()
  } finally {
    await handle.close()
  }

  if (options?.rotate) {
    await rotateBackups(targetPath)
  }

  try {
    await fs.rename(tmpPath, targetPath)
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && WINDOWS_RETRY_CODES.has((err as NodeJS.ErrnoException).code!)) {
      await delay(RETRY_BASE_MS)
      try {
        await fs.rename(tmpPath, targetPath)
      } catch (retryErr: unknown) {
        if (retryErr instanceof Error && 'code' in retryErr && WINDOWS_RETRY_CODES.has((retryErr as NodeJS.ErrnoException).code!)) {
          await delay(RETRY_BASE_MS * 2)
          await fs.rename(tmpPath, targetPath)
        } else {
          throw retryErr
        }
      }
    } else {
      throw err
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
