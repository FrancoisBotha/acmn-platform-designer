import { describe, it, before, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

let saveCalls: unknown[][]
let saveAsCalls: unknown[][]
let flushDoneCalls: number
let onFlushCallback: (() => void) | null

function resetMocks(): void {
  saveCalls = []
  saveAsCalls = []
  flushDoneCalls = 0
  onFlushCallback = null
  ;(globalThis as any).window = {
    acmn: {
      project: {
        save: async (...args: unknown[]) => {
          saveCalls.push(args)
        },
        saveAs: async (...args: unknown[]) => {
          saveAsCalls.push(args)
          return args[0]
        },
      },
      dialog: {
        saveFolder: async () => '/tmp/new-path',
      },
      window: {
        setTitle: async () => {},
      },
      autoSave: {
        onFlushRequest: (cb: () => void) => {
          onFlushCallback = cb
        },
        flushDone: () => {
          flushDoneCalls++
        },
      },
    },
  }
}

type StoreType = typeof import('./projectStore')
let useProjectStore: StoreType['useProjectStore']

before(async () => {
  resetMocks()
  const mod: StoreType = await import('./projectStore')
  useProjectStore = mod.useProjectStore
})

describe('projectStore auto-save', () => {
  let realSetTimeout: typeof globalThis.setTimeout
  let realClearTimeout: typeof globalThis.clearTimeout
  let timers: Map<number, { fn: () => void; delay: number }>
  let nextTimerId: number

  beforeEach(() => {
    resetMocks()

    timers = new Map()
    nextTimerId = 1
    realSetTimeout = globalThis.setTimeout
    realClearTimeout = globalThis.clearTimeout

    ;(globalThis as any).setTimeout = (fn: () => void, delay: number) => {
      const id = nextTimerId++
      timers.set(id, { fn, delay })
      return id
    }
    ;(globalThis as any).clearTimeout = (id: number) => {
      timers.delete(id)
    }

    useProjectStore.setState({
      currentProject: null,
      dirty: false,
      activeCpmId: null,
      activeCpmFile: null,
      recentProjects: [],
      loading: false,
      error: null,
      autoSaveEnabled: true,
      autoSaveInterval: 30_000,
      lastSavedAt: null,
    })
  })

  afterEach(() => {
    useProjectStore.getState().clearProject()
    globalThis.setTimeout = realSetTimeout
    globalThis.clearTimeout = realClearTimeout
  })

  it('has autoSaveEnabled true and autoSaveInterval 30000 by default', () => {
    const state = useProjectStore.getState()
    assert.equal(state.autoSaveEnabled, true)
    assert.equal(state.autoSaveInterval, 30_000)
    assert.equal(state.lastSavedAt, null)
  })

  it('arms a 30s debounce timer when dirty transitions from false to true', () => {
    useProjectStore.getState().setDirty(true)
    assert.equal(timers.size, 1)
    const timer = [...timers.values()][0]
    assert.equal(timer.delay, 30_000)
  })

  it('resets the timer on subsequent setDirty(true) calls while already dirty', () => {
    useProjectStore.getState().setDirty(true)
    assert.equal(timers.size, 1)
    const firstId = [...timers.keys()][0]

    useProjectStore.getState().setDirty(true)
    assert.equal(timers.size, 1)
    const secondId = [...timers.keys()][0]
    assert.notEqual(firstId, secondId, 'timer should have been re-armed with new id')
  })

  it('clears the timer when setDirty(false) is called', () => {
    useProjectStore.getState().setDirty(true)
    assert.equal(timers.size, 1)
    useProjectStore.getState().setDirty(false)
    assert.equal(timers.size, 0)
  })

  it('fires save on timer expiration', async () => {
    useProjectStore.setState({
      currentProject: { id: '1', name: 'Test', description: '', path: '/tmp/test', acmnVersion: '0.1.0', projectFormat: '1', created: '', modified: '', author: '', casePlanModels: [], domainContexts: [] },
    })

    useProjectStore.getState().setDirty(true)
    assert.equal(timers.size, 1)

    const timer = [...timers.values()][0]
    timer.fn()

    await new Promise((r) => realSetTimeout(r, 10))

    assert.equal(saveCalls.length, 1, 'save should have been called')
  })

  it('saveProject clears the debounce timer and updates lastSavedAt', async () => {
    useProjectStore.setState({
      currentProject: { id: '1', name: 'Test', description: '', path: '/tmp/test', acmnVersion: '0.1.0', projectFormat: '1', created: '', modified: '', author: '', casePlanModels: [], domainContexts: [] },
    })

    useProjectStore.getState().setDirty(true)
    assert.equal(timers.size, 1)

    await useProjectStore.getState().saveProject()

    assert.equal(timers.size, 0, 'timer should be cleared after manual save')
    assert.equal(useProjectStore.getState().dirty, false)
    assert.ok(useProjectStore.getState().lastSavedAt !== null, 'lastSavedAt should be set')
  })

  it('saveProjectAs clears the debounce timer', async () => {
    useProjectStore.setState({
      currentProject: { id: '1', name: 'Test', description: '', path: '/tmp/test', acmnVersion: '0.1.0', projectFormat: '1', created: '', modified: '', author: '', casePlanModels: [], domainContexts: [] },
    })

    useProjectStore.getState().setDirty(true)
    assert.equal(timers.size, 1)

    await useProjectStore.getState().saveProjectAs()

    assert.equal(timers.size, 0, 'timer should be cleared after Save As')
    assert.equal(useProjectStore.getState().dirty, false)
    assert.ok(useProjectStore.getState().lastSavedAt !== null)
  })

  it('flushAutoSave saves if dirty and clears timer', async () => {
    useProjectStore.setState({
      currentProject: { id: '1', name: 'Test', description: '', path: '/tmp/test', acmnVersion: '0.1.0', projectFormat: '1', created: '', modified: '', author: '', casePlanModels: [], domainContexts: [] },
    })
    useProjectStore.getState().setDirty(true)

    await useProjectStore.getState().flushAutoSave()

    assert.equal(saveCalls.length, 1)
    assert.equal(timers.size, 0)
    assert.equal(useProjectStore.getState().dirty, false)
  })

  it('flushAutoSave is a no-op when not dirty', async () => {
    useProjectStore.setState({
      currentProject: { id: '1', name: 'Test', description: '', path: '/tmp/test', acmnVersion: '0.1.0', projectFormat: '1', created: '', modified: '', author: '', casePlanModels: [], domainContexts: [] },
    })

    await useProjectStore.getState().flushAutoSave()

    assert.equal(saveCalls.length, 0)
  })

  it('clearProject clears the debounce timer', () => {
    useProjectStore.getState().setDirty(true)
    assert.equal(timers.size, 1)

    useProjectStore.getState().clearProject()
    assert.equal(timers.size, 0)
    assert.equal(useProjectStore.getState().lastSavedAt, null)
  })
})
