import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { formatAsset, formatProject } from '../mcp-server/src/format'

// Regression tests for ISS-021: update_asset printed linked projects as "undefined (role)"
// because the API returned the raw stored shape ({ projectId, role }) with no key.

const base: any = {
  _id: '1',
  name: 'wopr',
  type: 'desktop',
  status: 'active',
  ipAddresses: [],
  accounts: [],
  tags: [],
}

describe('formatProject', () => {
  test('prefers the project key', () => {
    assert.equal(formatProject({ key: 'ISS', name: 'Issues', role: 'Host' }), 'ISS (Host)')
  })

  test('falls back to the name when there is no key', () => {
    assert.equal(formatProject({ name: 'Issues', role: 'Host' }), 'Issues (Host)')
  })

  test('never prints "undefined" for the raw stored shape', () => {
    const raw = { projectId: '69377421a1d867c40da2c430', role: 'Host' } as any
    const text = formatProject(raw)
    assert.ok(!text.includes('undefined'))
    assert.equal(text, 'unknown project (Host)')
  })
})

describe('formatAsset', () => {
  test('lists populated projects by key', () => {
    const text = formatAsset({
      ...base,
      projects: [
        { _id: 'p1', key: 'ISS', name: 'Issues', role: 'Host' },
        { _id: 'p2', key: 'APP', name: 'Wrangl App', role: 'dev environment' },
      ],
    })
    assert.match(text, /Projects: ISS \(Host\), APP \(dev environment\)/)
  })

  test('the raw project shape from an update response does not print undefined', () => {
    const text = formatAsset({
      ...base,
      projects: [
        { projectId: 'a', role: 'Host' },
        { projectId: 'b', role: 'dev environment' },
      ] as any,
    })
    assert.ok(!text.includes('undefined'), text)
  })

  test('a sparse asset never prints undefined or null', () => {
    const text = formatAsset({ ...base, cost: null } as any)
    assert.ok(!text.includes('undefined') && !text.includes('null'), text)
  })

  test('shows cost 0 but not a cleared cost', () => {
    assert.match(formatAsset({ ...base, cost: 0 }), /Cost: 0/)
    assert.doesNotMatch(formatAsset({ ...base, cost: undefined }), /Cost:/)
  })

  test('omits the Projects line when there are none', () => {
    assert.doesNotMatch(formatAsset({ ...base, projects: [] }), /Projects:/)
  })
})
