import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  computeWarnings,
  toTailscaleInfo,
  planSync,
  type TailscaleDevice,
  type ExistingAsset,
  type SyncConfig,
} from '../lib/tailscale-sync'
import { getAccessToken, fetchDevices, TailscaleError } from '../lib/tailscale-client'

const fixture = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'tailscale-devices.json'), 'utf8'))
const devices: TailscaleDevice[] = fixture.devices
const NOW = new Date('2026-10-08T12:00:00Z')
const CFG: SyncConfig = { expiryWarnDays: 14, offlineHours: 24 }
const CREATED_BY = 'user-1'

const byName = (n: string) => devices.find(d => d.hostname === n)!
const codes = (d: TailscaleDevice) => computeWarnings(d, NOW, CFG).map(w => w.code)

describe('computeWarnings', () => {
  test('healthy device with key expiry disabled has no warnings', () => {
    assert.deepEqual(codes(byName('wopr')), [])
  })

  test('key expiring within the threshold warns; offline and old lastSeen warns', () => {
    assert.deepEqual(codes(byName('orac')).sort(), ['key_expiring', 'offline'])
  })

  test('already expired key warns key_expired, not key_expiring', () => {
    assert.deepEqual(codes(byName('sooke-srv')), ['key_expired'])
  })

  test('keyExpiryDisabled suppresses key warnings even with a near expiry', () => {
    const d = { ...byName('orac'), keyExpiryDisabled: true }
    assert.ok(!codes(d).includes('key_expiring'))
  })

  test('update available is surfaced', () => {
    assert.deepEqual(codes(byName('greenmachine')), ['update_available'])
  })

  test('recently seen but not connected is not yet offline', () => {
    const d = { ...byName('orac'), lastSeen: '2026-10-08T06:00:00Z' }
    assert.ok(!codes(d).includes('offline'))
  })

  test('unauthorized device warns', () => {
    assert.ok(codes({ ...byName('wopr'), authorized: false }).includes('unauthorized'))
  })
})

describe('toTailscaleInfo', () => {
  test('maps fields, treats zero-time expiry and null lastSeen as null', () => {
    const info = toTailscaleInfo(byName('wopr'), NOW, CFG)
    assert.equal(info.nodeId, 'nFAKEWOPR1CNTRL')
    assert.equal(info.name, 'wopr.tail6fe843.ts.net')
    assert.deepEqual(info.addresses, ['100.90.70.25', 'fd7a:115c:a1e0::aa01:4619'])
    assert.equal(info.expires, null)
    assert.equal(info.lastSeen, null)
    assert.equal(info.lastSyncedAt, NOW)
  })

  test('parses real dates', () => {
    const info = toTailscaleInfo(byName('orac'), NOW, CFG)
    assert.equal(info.lastSeen?.toISOString(), '2026-09-01T08:30:00.000Z')
    assert.equal(info.expires?.toISOString(), '2026-10-12T12:00:00.000Z')
  })
})

// Existing assets as they look today: manually entered / phone-home, no tailscale subdocument
const manualOrac = (): ExistingAsset => ({
  _id: 'a-orac',
  name: 'orac',
  type: 'server',
  status: 'active',
  ipAddresses: ['10.0.0.28', '10.89.0.1', '100.122.154.12'],
})
const manualWopr = (): ExistingAsset => ({
  _id: 'a-wopr',
  name: 'wopr',
  type: 'host',
  status: 'active',
  hostname: 'wopr.tail6fe843.ts.net',
  ipAddresses: [],
})

describe('planSync', () => {
  test('new devices are inserted as hosts flagged for review with empty manual fields', () => {
    const plan = planSync([], devices, NOW, CFG, CREATED_BY)
    assert.equal(plan.aborted, undefined)
    assert.equal(plan.inserts.length, 4)
    const g = plan.inserts.find(i => i.tailscale.nodeId === 'nFAKEGREEN1CNTRL')!
    assert.equal(g.type, 'host')
    assert.equal(g.status, 'active')
    assert.equal(g.name, 'greenmachine')
    assert.equal(g.hostname, 'greenmachine.tail6fe843.ts.net')
    assert.equal(g.needsReview, true)
    assert.equal(g.createdBy, CREATED_BY)
    assert.equal(g.provider, undefined)
    assert.equal(g.location, undefined)
    assert.deepEqual(g.projects, [])
    assert.deepEqual(g.accounts, [])
    assert.deepEqual(g.tags, ['tailscale'])
  })

  test('existing assets are adopted by Tailscale IP or hostname, not duplicated', () => {
    const plan = planSync([manualOrac(), manualWopr()], devices, NOW, CFG, CREATED_BY)
    assert.equal(plan.inserts.length, 2) // greenmachine + sooke-srv only
    const adopted = plan.updates.map(u => [u.assetId, u.tailscale.nodeId, u.adopted]).sort()
    assert.deepEqual(adopted, [
      ['a-orac', 'nFAKEORAC1CNTRL', true],
      ['a-wopr', 'nFAKEWOPR1CNTRL', true],
    ])
  })

  test('updates only touch the tailscale subdocument and never manual fields', () => {
    const asset: ExistingAsset = {
      ...manualWopr(),
      tailscale: { nodeId: 'nFAKEWOPR1CNTRL' } as any,
    }
    const plan = planSync([asset], [byName('wopr')], NOW, CFG, CREATED_BY)
    assert.equal(plan.updates.length, 1)
    assert.deepEqual(Object.keys(plan.updates[0]).sort(), ['adopted', 'assetId', 'reactivate', 'tailscale'])
    assert.equal(plan.updates[0].adopted, false)
  })

  test('one asset is never adopted by two devices', () => {
    const twin: TailscaleDevice[] = [
      byName('orac'),
      { ...byName('orac'), nodeId: 'nTWIN', id: '9', name: 'orac2.ts.net', hostname: 'orac2' },
    ]
    const plan = planSync([manualOrac()], twin, NOW, CFG, CREATED_BY)
    assert.equal(plan.updates.length, 1)
    assert.equal(plan.inserts.length, 1)
  })

  test('device missing from the response marks its asset removed, not deleted', () => {
    const gone: ExistingAsset = {
      _id: 'a-gone',
      name: 'gone',
      type: 'host',
      status: 'active',
      ipAddresses: [],
      tailscale: { nodeId: 'nGONE' } as any,
    }
    const known = devices.map((d, i) => ({
      _id: `k${i}`,
      name: d.hostname,
      type: 'host',
      status: 'active',
      ipAddresses: [],
      tailscale: { nodeId: d.nodeId } as any,
    }))
    const plan = planSync([...known, gone], devices, NOW, CFG, CREATED_BY)
    assert.deepEqual(plan.removals, ['a-gone'])
  })

  test('removed asset that reappears is reactivated', () => {
    const asset: ExistingAsset = {
      ...manualWopr(),
      status: 'removed',
      tailscale: { nodeId: 'nFAKEWOPR1CNTRL' } as any,
    }
    const plan = planSync([asset], devices, NOW, CFG, CREATED_BY)
    const u = plan.updates.find(x => x.assetId === 'a-wopr')!
    assert.equal(u.reactivate, true)
  })

  test('manually decommissioned or maintenance assets are not reactivated or removed', () => {
    const maint: ExistingAsset = {
      ...manualWopr(),
      status: 'maintenance',
      tailscale: { nodeId: 'nFAKEWOPR1CNTRL' } as any,
    }
    const decom: ExistingAsset = {
      _id: 'a-d',
      name: 'old',
      type: 'host',
      status: 'decommissioned',
      ipAddresses: [],
      tailscale: { nodeId: 'nOLD' } as any,
    }
    const plan = planSync([maint, decom], [byName('wopr')], NOW, CFG, CREATED_BY)
    assert.equal(plan.updates.find(x => x.assetId === 'a-wopr')!.reactivate, false)
    assert.deepEqual(plan.removals, []) // decommissioned stays decommissioned
  })

  test('assets without a tailscale link are never removed', () => {
    const plan = planSync([manualOrac()], [], NOW, CFG, CREATED_BY)
    assert.deepEqual(plan.removals, [])
  })

  test('aborts on an empty response when assets are known', () => {
    const known: ExistingAsset = { ...manualWopr(), tailscale: { nodeId: 'nFAKEWOPR1CNTRL' } as any }
    const plan = planSync([known], [], NOW, CFG, CREATED_BY)
    assert.match(plan.aborted!, /no devices/i)
    assert.equal(plan.inserts.length + plan.updates.length + plan.removals.length, 0)
  })

  test('aborts when more than half of the known devices would be removed', () => {
    const mk = (i: number): ExistingAsset => ({
      _id: `k${i}`,
      name: `k${i}`,
      type: 'host',
      status: 'active',
      ipAddresses: [],
      tailscale: { nodeId: `n${i}` } as any,
    })
    // 4 known, only 1 present in response -> 3/4 removed
    const present = { ...byName('wopr'), nodeId: 'n0' }
    const plan = planSync([mk(0), mk(1), mk(2), mk(3)], [present], NOW, CFG, CREATED_BY)
    assert.match(plan.aborted!, /more than half/i)
    assert.deepEqual(plan.removals, [])
  })

  test('removing exactly half is allowed', () => {
    const mk = (i: number): ExistingAsset => ({
      _id: `k${i}`,
      name: `k${i}`,
      type: 'host',
      status: 'active',
      ipAddresses: [],
      tailscale: { nodeId: `n${i}` } as any,
    })
    const present = [{ ...byName('wopr'), nodeId: 'n0' }, { ...byName('orac'), nodeId: 'n1' }]
    const plan = planSync([mk(0), mk(1), mk(2), mk(3)], present, NOW, CFG, CREATED_BY)
    assert.equal(plan.aborted, undefined)
    assert.deepEqual(plan.removals.sort(), ['k2', 'k3'])
  })

  test('empty tailnet with no known assets is a clean no-op, not an abort', () => {
    const plan = planSync([manualOrac()], [], NOW, CFG, CREATED_BY)
    assert.equal(plan.aborted, undefined)
  })
})

describe('tailscale client', () => {
  const okJson = (body: unknown, status = 200) =>
    ({ ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) }) as Response
  const noSleep = async () => {}

  test('getAccessToken posts client credentials form-encoded and returns the token', async () => {
    let seen: any
    const fetchImpl = (async (url: string, init: any) => {
      seen = { url, init }
      return okJson({ access_token: 'tok', expires_in: 3600 })
    }) as any
    const token = await getAccessToken({ clientId: 'id', clientSecret: 'sec' }, fetchImpl)
    assert.equal(token, 'tok')
    assert.equal(seen.url, 'https://api.tailscale.com/api/v2/oauth/token')
    assert.equal(seen.init.method, 'POST')
    const body = new URLSearchParams(seen.init.body)
    assert.equal(body.get('client_id'), 'id')
    assert.equal(body.get('client_secret'), 'sec')
    assert.equal(body.get('grant_type'), 'client_credentials')
  })

  test('a failed token request throws without leaking the secret', async () => {
    const fetchImpl = (async () => okJson({ message: 'invalid client' }, 401)) as any
    await assert.rejects(
      () => getAccessToken({ clientId: 'id', clientSecret: 'supersecret' }, fetchImpl),
      (e: Error) => e instanceof TailscaleError && !e.message.includes('supersecret') && /401/.test(e.message)
    )
  })

  test('fetchDevices returns the devices array with a bearer token', async () => {
    let auth = ''
    const fetchImpl = (async (_u: string, init: any) => {
      auth = init.headers.Authorization
      return okJson({ devices })
    }) as any
    const got = await fetchDevices('tok', fetchImpl, noSleep)
    assert.equal(auth, 'Bearer tok')
    assert.equal(got.length, 4)
  })

  test('fetchDevices retries 429 then succeeds', async () => {
    let calls = 0
    const fetchImpl = (async () => (++calls < 3 ? okJson({}, 429) : okJson({ devices }))) as any
    const got = await fetchDevices('tok', fetchImpl, noSleep)
    assert.equal(calls, 3)
    assert.equal(got.length, 4)
  })

  test('fetchDevices gives up after repeated 5xx', async () => {
    let calls = 0
    const fetchImpl = (async () => (calls++, okJson({}, 503))) as any
    await assert.rejects(() => fetchDevices('tok', fetchImpl, noSleep), TailscaleError)
    assert.equal(calls, 4)
  })

  test('fetchDevices rejects a malformed body instead of returning nothing', async () => {
    const fetchImpl = (async () => okJson({ nope: true })) as any
    await assert.rejects(() => fetchDevices('tok', fetchImpl, noSleep), TailscaleError)
  })
})
