import fs from 'fs/promises'
import path from 'path'
import { writeAtomic } from './atomicWrite'
import type { RecoveryOption, RecoveryChoice } from '../backend/contract'

const BACKUP_SUFFIXES = ['.bak.1', '.bak.2', '.bak.3']

export async function scanForRecoveryOptions(projectFolder: string): Promise<RecoveryOption[]> {
  const options: RecoveryOption[] = []
  await walkForTmpFiles(projectFolder, options)
  return options
}

async function walkForTmpFiles(dir: string, results: RecoveryOption[]): Promise<void> {
  let entries: import('fs').Dirent[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walkForTmpFiles(fullPath, results)
    } else if (entry.isFile() && entry.name.endsWith('.tmp')) {
      const filePath = fullPath.slice(0, -4)
      const lastSavedPath = await fileExists(filePath) ? filePath : ''

      const backupPaths: string[] = []
      const backupMtimes: string[] = []
      for (const suffix of BACKUP_SUFFIXES) {
        const bakPath = filePath + suffix
        if (await fileExists(bakPath)) {
          backupPaths.push(bakPath)
          try {
            const stat = await fs.stat(bakPath)
            backupMtimes.push(stat.mtime.toISOString())
          } catch {
            backupMtimes.push('')
          }
        }
      }

      results.push({
        filePath,
        tmpPath: fullPath,
        lastSavedPath,
        backupPaths,
        backupMtimes,
      })
    }
  }
}

export async function applyRecovery(choice: RecoveryChoice): Promise<void> {
  const { filePath, tmpPath } = resolveRecoveryPaths(choice.filePath)

  switch (choice.choice) {
    case 'use-tmp': {
      const contents = await fs.readFile(tmpPath, 'utf-8')
      await fs.unlink(tmpPath)
      await writeAtomic(filePath, contents)
      break
    }
    case 'use-last-saved': {
      await fs.unlink(tmpPath)
      break
    }
    case 'use-backup': {
      const backupIndex = choice.backupIndex ?? 0
      const backupPath = filePath + BACKUP_SUFFIXES[backupIndex]
      const contents = await fs.readFile(backupPath, 'utf-8')
      await fs.unlink(tmpPath)
      await writeAtomic(filePath, contents)
      break
    }
  }
}

function resolveRecoveryPaths(filePath: string): { filePath: string; tmpPath: string } {
  return { filePath, tmpPath: filePath + '.tmp' }
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}
