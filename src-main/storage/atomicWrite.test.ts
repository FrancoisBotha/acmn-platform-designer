import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { writeAtomic } from './atomicWrite'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'atomicWrite-'))
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('writeAtomic', () => {
  it('writes contents atomically to the target file', async () => {
    const target = path.join(tmpDir, 'out.json')
    const data = JSON.stringify({ hello: 'world' }, null, 2)

    await writeAtomic(target, data)

    const result = await fs.readFile(target, 'utf-8')
    assert.equal(result, data)

    const entries = await fs.readdir(tmpDir)
    assert.ok(!entries.some((e) => e.endsWith('.tmp')), 'no .tmp file should remain')
  })

  it('overwrites an existing target file', async () => {
    const target = path.join(tmpDir, 'out.json')
    await fs.writeFile(target, 'old', 'utf-8')

    await writeAtomic(target, 'new')

    const result = await fs.readFile(target, 'utf-8')
    assert.equal(result, 'new')
  })

  it('retries on EBUSY rename failure and succeeds', async () => {
    const target = path.join(tmpDir, 'retry.json')
    const data = '{"retry":true}'

    const originalRename = fs.rename
    let attempt = 0
    ;(fs as any).rename = async (src: string, dst: string) => {
      attempt++
      if (attempt === 1) {
        const err: NodeJS.ErrnoException = new Error('EBUSY: resource busy')
        err.code = 'EBUSY'
        throw err
      }
      return originalRename(src, dst)
    }

    try {
      await writeAtomic(target, data)
      const result = await fs.readFile(target, 'utf-8')
      assert.equal(result, data)
      assert.ok(attempt >= 2, 'should have retried at least once')
    } finally {
      ;(fs as any).rename = originalRename
    }
  })

  it('retries on EPERM rename failure and succeeds', async () => {
    const target = path.join(tmpDir, 'retry-eperm.json')
    const data = '{"retry":"eperm"}'

    const originalRename = fs.rename
    let attempt = 0
    ;(fs as any).rename = async (src: string, dst: string) => {
      attempt++
      if (attempt <= 2) {
        const err: NodeJS.ErrnoException = new Error('EPERM: operation not permitted')
        err.code = 'EPERM'
        throw err
      }
      return originalRename(src, dst)
    }

    try {
      await writeAtomic(target, data)
      const result = await fs.readFile(target, 'utf-8')
      assert.equal(result, data)
      assert.ok(attempt === 3, 'should have retried with exponential backoff')
    } finally {
      ;(fs as any).rename = originalRename
    }
  })

  it('leaves .tmp file behind when crash occurs before rename', async () => {
    const target = path.join(tmpDir, 'crash.json')
    const data = '{"crash":true}'

    const originalRename = fs.rename
    ;(fs as any).rename = async () => {
      throw new Error('simulated crash')
    }

    try {
      await assert.rejects(() => writeAtomic(target, data), { message: 'simulated crash' })

      const entries = await fs.readdir(tmpDir)
      assert.ok(entries.includes('crash.json.tmp'), '.tmp file should remain after crash')

      let targetExists = true
      try {
        await fs.access(target)
      } catch {
        targetExists = false
      }
      assert.ok(!targetExists, 'target file should not exist after crash')

      const tmpContents = await fs.readFile(path.join(tmpDir, 'crash.json.tmp'), 'utf-8')
      assert.equal(tmpContents, data, '.tmp file should contain the intended data')
    } finally {
      ;(fs as any).rename = originalRename
    }
  })

  it('surfaces non-retryable errors immediately', async () => {
    const target = path.join(tmpDir, 'nonexistent-dir', 'sub', 'out.json')

    await assert.rejects(() => writeAtomic(target, 'data'), { code: 'ENOENT' })
  })
})
