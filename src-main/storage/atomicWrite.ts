import fs from 'fs/promises'
import path from 'path'

const WINDOWS_RETRY_CODES = new Set(['EBUSY', 'EPERM'])
const RETRY_BASE_MS = 50

export async function writeAtomic(targetPath: string, contents: string): Promise<void> {
  const tmpPath = targetPath + '.tmp'
  const handle = await fs.open(tmpPath, 'w')
  try {
    await handle.writeFile(contents, 'utf-8')
    await handle.sync()
  } finally {
    await handle.close()
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
