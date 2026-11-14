import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createConnectionManager } from '../lib/db-connection'

describe('createConnectionManager (database goes up and down)', () => {
  test('a failed connect is not cached: the next get() reconnects', async () => {
    let calls = 0
    const mgr = createConnectionManager<string>({
      connect: async () => {
        calls++
        if (calls === 1) throw new Error('Server selection timed out')
        return 'client'
      },
    })

    await assert.rejects(mgr.get(), /Server selection timed out/)
    assert.equal(await mgr.get(), 'client')
    assert.equal(calls, 2)
  })

  test('a successful connection is reused, not reopened', async () => {
    let calls = 0
    const mgr = createConnectionManager<object>({
      connect: async () => {
        calls++
        return {}
      },
    })
    const [a, b] = await Promise.all([mgr.get(), mgr.get()])
    assert.equal(a, b)
    assert.equal(await mgr.get(), a)
    assert.equal(calls, 1)
  })

  test('concurrent callers share one in-flight attempt and all see its failure', async () => {
    let calls = 0
    const mgr = createConnectionManager<string>({
      connect: async () => {
        calls++
        throw new Error('down')
      },
    })
    const results = await Promise.allSettled([mgr.get(), mgr.get(), mgr.get()])
    assert.ok(results.every(r => r.status === 'rejected'))
    assert.equal(calls, 1)
  })

  test('onError is called with each failure', async () => {
    const seen: string[] = []
    const mgr = createConnectionManager<string>({
      connect: async () => {
        throw new Error('boom')
      },
      onError: e => seen.push((e as Error).message),
    })
    await assert.rejects(mgr.get())
    await assert.rejects(mgr.get())
    assert.deepEqual(seen, ['boom', 'boom'])
  })

  test('reset() closes the old client and the next get() reconnects', async () => {
    const closed: string[] = []
    let n = 0
    const mgr = createConnectionManager<string>({
      connect: async () => `client-${++n}`,
      close: async c => {
        closed.push(c)
      },
    })
    assert.equal(await mgr.get(), 'client-1')
    await mgr.reset()
    assert.deepEqual(closed, ['client-1'])
    assert.equal(await mgr.get(), 'client-2')
  })

  test('reset() on a failed or never-connected manager does not throw', async () => {
    const mgr = createConnectionManager<string>({
      connect: async () => {
        throw new Error('down')
      },
      close: async () => {
        throw new Error('should not matter')
      },
    })
    await assert.rejects(mgr.get())
    await mgr.reset()
  })
})
