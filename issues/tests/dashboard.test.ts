import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { summarizeAssets, buildProjectStats, countAssetsPerProject } from '../lib/dashboard'

describe('summarizeAssets (ISS-022: "16 then 0 hosts")', () => {
  const assets = [
    { type: 'laptop', status: 'active' },
    { type: 'laptop', status: 'active', tailscale: { warnings: [{ code: 'offline' }] } },
    { type: 'device', status: 'active', needsReview: true },
    { type: 'host', status: 'active' },
    { type: 'desktop', status: 'removed', tailscale: { warnings: [{ code: 'offline' }] } },
    { type: 'physical server', status: 'decommissioned' },
    { type: undefined, status: 'active' },
  ]

  test('counts by the same categories as the Assets page, in the same order', () => {
    const s = summarizeAssets(assets)
    assert.deepEqual(
      s.byCategory.map(c => [c.key, c.count]),
      [
        ['physical server', 1],
        ['desktop', 1],
        ['laptop', 2],
        ['device', 1],
        ['host', 1],
        ['unclassified', 1],
      ]
    )
  })

  test('retyping hosts no longer makes the dashboard say there are none', () => {
    const s = summarizeAssets([{ type: 'laptop', status: 'active' }, { type: 'device', status: 'active' }])
    assert.equal(s.total, 2)
    assert.equal(s.byCategory.reduce((n, c) => n + c.count, 0), 2)
    assert.ok(!s.byCategory.some(c => c.key === 'host'))
  })

  test('active, status breakdown, needs-review count', () => {
    const s = summarizeAssets(assets)
    assert.equal(s.total, 7)
    assert.equal(s.active, 5)
    assert.deepEqual(s.byStatus, { active: 5, removed: 1, decommissioned: 1 })
    assert.equal(s.needsReview, 1)
  })

  test('warnings are counted for active assets only', () => {
    // the removed desktop also has a warning but must not count
    assert.equal(summarizeAssets(assets).withWarnings, 1)
  })

  test('no assets gives zeros, not NaN or undefined', () => {
    const s = summarizeAssets([])
    assert.deepEqual(s, { total: 0, active: 0, byCategory: [], byStatus: {}, withWarnings: 0, needsReview: 0 })
  })

  test('a missing status counts as active', () => {
    assert.equal(summarizeAssets([{ type: 'laptop' }]).active, 1)
  })
})

describe('buildProjectStats', () => {
  const projects = [
    { _id: 'p1', key: 'ISS', name: 'Issues' },
    { _id: 'p2', key: 'APP', name: 'Wrangl App' },
    { _id: 'p3', key: 'NEW', name: 'Empty project' },
  ]
  const issueRows = [
    { projectId: 'p1', status: 'backlog', count: 4 },
    { projectId: 'p1', status: 'in_progress', count: 2 },
    { projectId: 'p1', status: 'blocked', count: 1 },
    { projectId: 'p1', status: 'fixed', count: 10 },
    { projectId: 'p1', status: 'wont_fix', count: 3 },
    { projectId: 'p2', status: 'backlog', count: 7 },
  ]
  const featureRows = [
    { projectId: 'p1', status: 'shipped', count: 1 },
    { projectId: 'p1', status: 'proposed', count: 2 },
    { projectId: 'p2', status: 'planned', count: 1 },
    { projectId: 'p2', status: 'in_progress', count: 2 },
  ]
  const stats = buildProjectStats(projects, issueRows, featureRows, new Map([['p1', 5]]))

  test('one entry per project, in the given order', () => {
    assert.deepEqual(stats.map(s => s.key), ['ISS', 'APP', 'NEW'])
  })

  test('issue counts per project, with open = backlog + in progress + blocked', () => {
    const iss = stats[0].issues
    assert.deepEqual(iss, { total: 20, open: 7, backlog: 4, inProgress: 2, blocked: 1, fixed: 10, wontFix: 3 })
    assert.equal(stats[1].issues.total, 7)
  })

  test('feature counts per project, with active = planned + in progress', () => {
    assert.deepEqual(stats[0].features, { total: 3, active: 0, proposed: 2, planned: 0, inProgress: 0, shipped: 1, dropped: 0 })
    assert.equal(stats[1].features.active, 3)
  })

  test('linked asset counts, zero when none', () => {
    assert.equal(stats[0].assets, 5)
    assert.equal(stats[1].assets, 0)
  })

  test('a project with no data is all zeros', () => {
    const empty = stats[2]
    assert.equal(empty.issues.total, 0)
    assert.equal(empty.features.total, 0)
    assert.equal(empty.assets, 0)
  })

  test('ObjectId-like values match by their string form', () => {
    const id = { toString: () => 'abc' }
    const rows = [{ projectId: { toString: () => 'abc' }, status: 'backlog', count: 2 }]
    const [s] = buildProjectStats([{ _id: id, key: 'X', name: 'X' }], rows, [], new Map())
    assert.equal(s.issues.backlog, 2)
  })
})

describe('countAssetsPerProject', () => {
  test('counts each asset once per project it serves', () => {
    const counts = countAssetsPerProject([
      { projects: [{ projectId: 'p1' }, { projectId: 'p2' }] },
      { projects: [{ projectId: 'p1' }, { projectId: 'p1' }] },
      { projects: [] },
      {},
    ])
    assert.equal(counts.get('p1'), 2)
    assert.equal(counts.get('p2'), 1)
    assert.equal(counts.get('p3'), undefined)
  })
})
