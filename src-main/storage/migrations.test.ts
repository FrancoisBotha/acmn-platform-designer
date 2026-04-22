import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { migrationRegistry, registerMigration, migrate } from './migrations'
import { FutureVersionError, MigrationError, CorruptFileError } from './storageErrors'
import { loadFileWithVersionCheck, CURRENT_SCHEMA_VERSION, CURRENT_PROJECT_FORMAT } from '../backend/localBackend'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'migrations-'))
  migrationRegistry.clear()
})

afterEach(async () => {
  migrationRegistry.clear()
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('migrate', () => {
  it('applies a synthetic v0 → v1 migration end-to-end', () => {
    registerMigration('cpm', '0', (payload) => ({
      toVersion: '1',
      payload: { ...payload, schemaVersion: '1', migrated: true },
    }))

    const input = { schemaVersion: '0', name: 'test-cpm' }
    const result = migrate('cpm', '0', '1', input)

    assert.equal(result.toVersion, '1')
    assert.equal(result.payload.migrated, true)
    assert.equal(result.payload.schemaVersion, '1')
    assert.equal(result.payload.name, 'test-cpm')
  })

  it('chains multiple migration steps sequentially', () => {
    registerMigration('cpm', '0', (payload) => ({
      toVersion: '1',
      payload: { ...payload, v1: true },
    }))
    registerMigration('cpm', '1', (payload) => ({
      toVersion: '2',
      payload: { ...payload, v2: true },
    }))

    const result = migrate('cpm', '0', '2', { name: 'test' })

    assert.equal(result.toVersion, '2')
    assert.equal(result.payload.v1, true)
    assert.equal(result.payload.v2, true)
  })

  it('throws when no migration is registered for a step', () => {
    assert.throws(
      () => migrate('cpm', '0', '1', {}),
      (err: Error) => err.message.includes('No migration registered')
    )
  })

  it('returns unchanged payload when fromVersion equals toVersion', () => {
    const input = { schemaVersion: '1', name: 'same' }
    const result = migrate('cpm', '1', '1', input)

    assert.equal(result.toVersion, '1')
    assert.deepEqual(result.payload, input)
  })
})

describe('loadFileWithVersionCheck', () => {
  it('loads a file at the current version without migration', async () => {
    const filePath = path.join(tmpDir, 'current.cpm.json')
    await fs.writeFile(filePath, JSON.stringify({ schemaVersion: '1', name: 'test' }))

    const result = await loadFileWithVersionCheck(filePath, 'cpm', '1')

    assert.equal(result.schemaVersion, '1')
    assert.equal(result.name, 'test')
  })

  it('throws FutureVersionError for a file newer than app', async () => {
    const filePath = path.join(tmpDir, 'future.cpm.json')
    await fs.writeFile(filePath, JSON.stringify({ schemaVersion: '99', name: 'future' }))

    await assert.rejects(
      () => loadFileWithVersionCheck(filePath, 'cpm', '1'),
      (err: unknown) => {
        assert.ok(err instanceof FutureVersionError)
        assert.equal(err.filePath, filePath)
        assert.equal(err.fileVersion, '99')
        assert.equal(err.appVersion, '1')
        return true
      }
    )
  })

  it('runs migration and writes .backup for older file', async () => {
    registerMigration('cpm', '0', (payload) => ({
      toVersion: '1',
      payload: { ...payload, schemaVersion: '1', migrated: true },
    }))

    const filePath = path.join(tmpDir, 'old.cpm.json')
    const originalContent = JSON.stringify({ schemaVersion: '0', name: 'old-cpm' })
    await fs.writeFile(filePath, originalContent)

    const result = await loadFileWithVersionCheck(filePath, 'cpm', '1')

    assert.equal(result.schemaVersion, '1')
    assert.equal(result.migrated, true)
    assert.equal(result.name, 'old-cpm')

    const backupContent = await fs.readFile(filePath + '.backup', 'utf-8')
    assert.equal(backupContent, originalContent)

    const updatedContent = JSON.parse(await fs.readFile(filePath, 'utf-8'))
    assert.equal(updatedContent.schemaVersion, '1')
  })

  it('overwrites .backup on subsequent migrations', async () => {
    registerMigration('cpm', '0', (payload) => ({
      toVersion: '1',
      payload: { ...payload, schemaVersion: '1' },
    }))

    const filePath = path.join(tmpDir, 'overwrite.cpm.json')
    const backupPath = filePath + '.backup'

    await fs.writeFile(backupPath, 'previous-backup-content')
    await fs.writeFile(filePath, JSON.stringify({ schemaVersion: '0', name: 'first' }))

    await loadFileWithVersionCheck(filePath, 'cpm', '1')

    const backupContent = await fs.readFile(backupPath, 'utf-8')
    assert.ok(backupContent.includes('"name":"first"') || backupContent.includes('"name": "first"'))
  })

  it('throws CorruptFileError for invalid JSON', async () => {
    const filePath = path.join(tmpDir, 'corrupt.cpm.json')
    await fs.writeFile(filePath, '{ not valid json }}}')

    await assert.rejects(
      () => loadFileWithVersionCheck(filePath, 'cpm', '1'),
      (err: unknown) => {
        assert.ok(err instanceof CorruptFileError)
        assert.equal(err.filePath, filePath)
        return true
      }
    )
  })

  it('throws CorruptFileError for missing schemaVersion', async () => {
    const filePath = path.join(tmpDir, 'noversion.cpm.json')
    await fs.writeFile(filePath, JSON.stringify({ name: 'missing-version' }))

    await assert.rejects(
      () => loadFileWithVersionCheck(filePath, 'cpm', '1'),
      (err: unknown) => {
        assert.ok(err instanceof CorruptFileError)
        assert.equal(err.filePath, filePath)
        return true
      }
    )
  })

  it('throws MigrationError when a migration step fails and does not write .backup', async () => {
    registerMigration('cpm', '0', () => {
      throw new Error('migration logic exploded')
    })

    const filePath = path.join(tmpDir, 'failmigrate.cpm.json')
    await fs.writeFile(filePath, JSON.stringify({ schemaVersion: '0', name: 'fail' }))

    await assert.rejects(
      () => loadFileWithVersionCheck(filePath, 'cpm', '1'),
      (err: unknown) => {
        assert.ok(err instanceof MigrationError)
        assert.equal(err.filePath, filePath)
        assert.equal(err.fromVersion, '0')
        assert.equal(err.toVersion, '1')
        return true
      }
    )

    let backupExists = true
    try {
      await fs.access(filePath + '.backup')
    } catch {
      backupExists = false
    }
    assert.ok(!backupExists, '.backup should not be written when migration fails')
  })

  it('throws CorruptFileError for non-object JSON (array)', async () => {
    const filePath = path.join(tmpDir, 'array.cpm.json')
    await fs.writeFile(filePath, '[1, 2, 3]')

    await assert.rejects(
      () => loadFileWithVersionCheck(filePath, 'cpm', '1'),
      (err: unknown) => {
        assert.ok(err instanceof CorruptFileError)
        return true
      }
    )
  })
})

describe('migration registry', () => {
  it('ships empty by default', () => {
    assert.equal(migrationRegistry.size, 0)
  })
})
