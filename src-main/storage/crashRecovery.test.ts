import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { scanForRecoveryOptions, applyRecovery } from './crashRecovery'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crashRecovery-'))
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('scanForRecoveryOptions', () => {
  it('returns empty array when no tmp files exist', async () => {
    await fs.writeFile(path.join(tmpDir, 'project.acmn.json'), '{}')
    const options = await scanForRecoveryOptions(tmpDir)
    assert.deepEqual(options, [])
  })

  it('detects a tmp file with all three backups', async () => {
    const base = path.join(tmpDir, 'project.acmn.json')
    await fs.writeFile(base, '{"saved":true}')
    await fs.writeFile(base + '.tmp', '{"unsaved":true}')
    await fs.writeFile(base + '.bak.1', '{"backup":1}')
    await fs.writeFile(base + '.bak.2', '{"backup":2}')
    await fs.writeFile(base + '.bak.3', '{"backup":3}')

    const options = await scanForRecoveryOptions(tmpDir)

    assert.equal(options.length, 1)
    assert.equal(options[0].filePath, base)
    assert.equal(options[0].tmpPath, base + '.tmp')
    assert.equal(options[0].lastSavedPath, base)
    assert.deepEqual(options[0].backupPaths, [
      base + '.bak.1',
      base + '.bak.2',
      base + '.bak.3',
    ])
  })

  it('detects a tmp file with partial backups', async () => {
    const base = path.join(tmpDir, 'data.cpm.json')
    await fs.writeFile(base, '{"saved":true}')
    await fs.writeFile(base + '.tmp', '{"unsaved":true}')
    await fs.writeFile(base + '.bak.1', '{"backup":1}')

    const options = await scanForRecoveryOptions(tmpDir)

    assert.equal(options.length, 1)
    assert.equal(options[0].lastSavedPath, base)
    assert.deepEqual(options[0].backupPaths, [base + '.bak.1'])
  })

  it('detects a tmp file with no last-saved and no backups', async () => {
    const base = path.join(tmpDir, 'new-file.json')
    await fs.writeFile(base + '.tmp', '{"unsaved":true}')

    const options = await scanForRecoveryOptions(tmpDir)

    assert.equal(options.length, 1)
    assert.equal(options[0].filePath, base)
    assert.equal(options[0].lastSavedPath, '')
    assert.deepEqual(options[0].backupPaths, [])
  })

  it('scans subdirectories for tmp files', async () => {
    const subdir = path.join(tmpDir, 'case-plan-models')
    await fs.mkdir(subdir)
    const base = path.join(subdir, 'onboarding.cpm.json')
    await fs.writeFile(base + '.tmp', '{"unsaved":true}')
    await fs.writeFile(base, '{"saved":true}')

    const options = await scanForRecoveryOptions(tmpDir)

    assert.equal(options.length, 1)
    assert.equal(options[0].filePath, base)
    assert.equal(options[0].tmpPath, base + '.tmp')
  })

  it('returns multiple recovery options for multiple tmp files', async () => {
    const base1 = path.join(tmpDir, 'project.acmn.json')
    const base2 = path.join(tmpDir, 'data.cpm.json')
    await fs.writeFile(base1 + '.tmp', '{}')
    await fs.writeFile(base1, '{}')
    await fs.writeFile(base2 + '.tmp', '{}')

    const options = await scanForRecoveryOptions(tmpDir)

    assert.equal(options.length, 2)
  })

  it('returns empty array for nonexistent directory', async () => {
    const options = await scanForRecoveryOptions(path.join(tmpDir, 'nonexistent'))
    assert.deepEqual(options, [])
  })
})

describe('applyRecovery', () => {
  it('use-tmp: overwrites target with tmp contents and deletes tmp', async () => {
    const base = path.join(tmpDir, 'project.acmn.json')
    await fs.writeFile(base, '{"old":true}')
    await fs.writeFile(base + '.tmp', '{"recovered":true}')

    await applyRecovery({ filePath: base, choice: 'use-tmp' })

    const result = await fs.readFile(base, 'utf-8')
    assert.equal(result, '{"recovered":true}')

    await assert.rejects(() => fs.access(base + '.tmp'))
  })

  it('use-last-saved: deletes tmp and keeps original', async () => {
    const base = path.join(tmpDir, 'project.acmn.json')
    await fs.writeFile(base, '{"saved":true}')
    await fs.writeFile(base + '.tmp', '{"unsaved":true}')

    await applyRecovery({ filePath: base, choice: 'use-last-saved' })

    const result = await fs.readFile(base, 'utf-8')
    assert.equal(result, '{"saved":true}')

    await assert.rejects(() => fs.access(base + '.tmp'))
  })

  it('use-backup: overwrites target with backup contents and deletes tmp', async () => {
    const base = path.join(tmpDir, 'project.acmn.json')
    await fs.writeFile(base, '{"saved":true}')
    await fs.writeFile(base + '.tmp', '{"unsaved":true}')
    await fs.writeFile(base + '.bak.1', '{"backup":1}')
    await fs.writeFile(base + '.bak.2', '{"backup":2}')
    await fs.writeFile(base + '.bak.3', '{"backup":3}')

    await applyRecovery({ filePath: base, choice: 'use-backup', backupIndex: 1 })

    const result = await fs.readFile(base, 'utf-8')
    assert.equal(result, '{"backup":2}')

    await assert.rejects(() => fs.access(base + '.tmp'))
  })

  it('use-backup: defaults to backupIndex 0 when not specified', async () => {
    const base = path.join(tmpDir, 'project.acmn.json')
    await fs.writeFile(base, '{"saved":true}')
    await fs.writeFile(base + '.tmp', '{"unsaved":true}')
    await fs.writeFile(base + '.bak.1', '{"backup":1}')

    await applyRecovery({ filePath: base, choice: 'use-backup' })

    const result = await fs.readFile(base, 'utf-8')
    assert.equal(result, '{"backup":1}')
  })

  it('use-tmp: works when no original file exists', async () => {
    const base = path.join(tmpDir, 'brand-new.json')
    await fs.writeFile(base + '.tmp', '{"new":true}')

    await applyRecovery({ filePath: base, choice: 'use-tmp' })

    const result = await fs.readFile(base, 'utf-8')
    assert.equal(result, '{"new":true}')

    await assert.rejects(() => fs.access(base + '.tmp'))
  })
})
