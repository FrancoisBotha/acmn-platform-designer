import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { writeAtomic, rotateBackups } from './atomicWrite'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rotateBackups-'))
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('rotateBackups', () => {
  describe('first save (no existing file)', () => {
    it('skips rotation when target does not exist', async () => {
      const target = path.join(tmpDir, 'project.acmn.json')

      await writeAtomic(target, '{"save":1}', { rotate: true })

      const result = await fs.readFile(target, 'utf-8')
      assert.equal(result, '{"save":1}')

      const entries = await fs.readdir(tmpDir)
      assert.deepEqual(entries.sort(), ['project.acmn.json'])
    })
  })

  describe('second save', () => {
    it('creates .bak.1 from the previous target', async () => {
      const target = path.join(tmpDir, 'project.acmn.json')

      await writeAtomic(target, '{"save":1}', { rotate: true })
      await writeAtomic(target, '{"save":2}', { rotate: true })

      const current = await fs.readFile(target, 'utf-8')
      assert.equal(current, '{"save":2}')

      const bak1 = await fs.readFile(`${target}.bak.1`, 'utf-8')
      assert.equal(bak1, '{"save":1}')

      const entries = await fs.readdir(tmpDir)
      assert.deepEqual(entries.sort(), [
        'project.acmn.json',
        'project.acmn.json.bak.1',
      ])
    })
  })

  describe('third save', () => {
    it('creates .bak.1 and .bak.2', async () => {
      const target = path.join(tmpDir, 'project.acmn.json')

      await writeAtomic(target, '{"save":1}', { rotate: true })
      await writeAtomic(target, '{"save":2}', { rotate: true })
      await writeAtomic(target, '{"save":3}', { rotate: true })

      const current = await fs.readFile(target, 'utf-8')
      assert.equal(current, '{"save":3}')

      const bak1 = await fs.readFile(`${target}.bak.1`, 'utf-8')
      assert.equal(bak1, '{"save":2}')

      const bak2 = await fs.readFile(`${target}.bak.2`, 'utf-8')
      assert.equal(bak2, '{"save":1}')

      const entries = (await fs.readdir(tmpDir)).filter((e) => !e.endsWith('.tmp'))
      assert.deepEqual(entries.sort(), [
        'project.acmn.json',
        'project.acmn.json.bak.1',
        'project.acmn.json.bak.2',
      ])
    })
  })

  describe('fourth save (NFR-055)', () => {
    it('maintains exactly three .bak.N siblings with contents rotated forward', async () => {
      const target = path.join(tmpDir, 'project.acmn.json')

      await writeAtomic(target, '{"save":1}', { rotate: true })
      await writeAtomic(target, '{"save":2}', { rotate: true })
      await writeAtomic(target, '{"save":3}', { rotate: true })
      await writeAtomic(target, '{"save":4}', { rotate: true })

      const current = await fs.readFile(target, 'utf-8')
      assert.equal(current, '{"save":4}')

      const bak1 = await fs.readFile(`${target}.bak.1`, 'utf-8')
      assert.equal(bak1, '{"save":3}')

      const bak2 = await fs.readFile(`${target}.bak.2`, 'utf-8')
      assert.equal(bak2, '{"save":2}')

      const bak3 = await fs.readFile(`${target}.bak.3`, 'utf-8')
      assert.equal(bak3, '{"save":1}')

      const entries = (await fs.readdir(tmpDir)).filter((e) => !e.endsWith('.tmp'))
      assert.deepEqual(entries.sort(), [
        'project.acmn.json',
        'project.acmn.json.bak.1',
        'project.acmn.json.bak.2',
        'project.acmn.json.bak.3',
      ])
    })

    it('drops the oldest backup when a fifth save occurs', async () => {
      const target = path.join(tmpDir, 'data.cpm.json')

      await writeAtomic(target, '{"save":1}', { rotate: true })
      await writeAtomic(target, '{"save":2}', { rotate: true })
      await writeAtomic(target, '{"save":3}', { rotate: true })
      await writeAtomic(target, '{"save":4}', { rotate: true })
      await writeAtomic(target, '{"save":5}', { rotate: true })

      const current = await fs.readFile(target, 'utf-8')
      assert.equal(current, '{"save":5}')

      const bak1 = await fs.readFile(`${target}.bak.1`, 'utf-8')
      assert.equal(bak1, '{"save":4}')

      const bak2 = await fs.readFile(`${target}.bak.2`, 'utf-8')
      assert.equal(bak2, '{"save":3}')

      const bak3 = await fs.readFile(`${target}.bak.3`, 'utf-8')
      assert.equal(bak3, '{"save":2}')

      const entries = (await fs.readdir(tmpDir)).filter((e) => !e.endsWith('.tmp'))
      assert.equal(entries.length, 4)
    })
  })

  describe('mid-rotation failure', () => {
    it('surfaces error and does not write the new file', async () => {
      const target = path.join(tmpDir, 'fail.domain.json')

      await writeAtomic(target, '{"save":1}', { rotate: true })
      await writeAtomic(target, '{"save":2}', { rotate: true })

      const originalRename = fs.rename
      let renameCallCount = 0
      ;(fs as any).rename = async (src: string, dst: string) => {
        renameCallCount++
        if (dst.endsWith('.bak.2')) {
          const err: NodeJS.ErrnoException = new Error('EACCES: permission denied')
          err.code = 'EACCES'
          throw err
        }
        return originalRename(src, dst)
      }

      try {
        await assert.rejects(
          () => writeAtomic(target, '{"save":3}', { rotate: true }),
          { code: 'EACCES' }
        )

        const current = await fs.readFile(target, 'utf-8')
        assert.equal(current, '{"save":2}', 'target should retain its pre-rotation content')

        const bak1 = await fs.readFile(`${target}.bak.1`, 'utf-8')
        assert.equal(bak1, '{"save":1}', '.bak.1 should be unchanged')
      } finally {
        ;(fs as any).rename = originalRename
      }
    })
  })

  describe('applies to all project file kinds', () => {
    for (const filename of [
      'project.acmn.json',
      'onboarding.cpm.json',
      'legal.domain.json',
      'smoke.test.json',
    ]) {
      it(`rotates backups for ${filename}`, async () => {
        const target = path.join(tmpDir, filename)

        await writeAtomic(target, '"v1"', { rotate: true })
        await writeAtomic(target, '"v2"', { rotate: true })

        const current = await fs.readFile(target, 'utf-8')
        assert.equal(current, '"v2"')

        const bak1 = await fs.readFile(`${target}.bak.1`, 'utf-8')
        assert.equal(bak1, '"v1"')
      })
    }
  })

  describe('without rotate option', () => {
    it('does not create backup files when rotate is not set', async () => {
      const target = path.join(tmpDir, 'recent.json')

      await writeAtomic(target, '"v1"')
      await writeAtomic(target, '"v2"')

      const entries = await fs.readdir(tmpDir)
      assert.deepEqual(entries.sort(), ['recent.json'])
    })
  })
})
