import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { groupAssetsByType, normalizeAssetType } from '../lib/asset-types'

const a = (name: string, type?: string) => ({ name, type })

describe('groupAssetsByType', () => {
  test('standard categories come first in the agreed order', () => {
    const groups = groupAssetsByType([
      a('d1', 'device'),
      a('l1', 'laptop'),
      a('p1', 'physical server'),
      a('ds1', 'desktop'),
      a('v1', 'virtual server'),
    ])
    assert.deepEqual(
      groups.map(g => g.key),
      ['physical server', 'virtual server', 'desktop', 'laptop', 'device']
    )
  })

  test('other types follow alphabetically, unclassified last', () => {
    const groups = groupAssetsByType([a('x', 'pod'), a('y', undefined), a('z', 'container'), a('p', 'desktop'), a('q', '  ')])
    assert.deepEqual(
      groups.map(g => g.key),
      ['desktop', 'container', 'pod', 'unclassified']
    )
    assert.equal(groups[3].assets.length, 2)
  })

  test('type matching ignores case and extra whitespace', () => {
    const groups = groupAssetsByType([a('a', 'Physical  Server'), a('b', ' physical server ')])
    assert.equal(groups.length, 1)
    assert.equal(groups[0].label, 'Physical server')
    assert.equal(groups[0].assets.length, 2)
  })

  test('assets inside a group are sorted by name, case-insensitive', () => {
    const [group] = groupAssetsByType([a('beta', 'laptop'), a('Alpha', 'laptop'), a('charlie', 'laptop')])
    assert.deepEqual(group.assets.map(x => x.name), ['Alpha', 'beta', 'charlie'])
  })

  test('empty categories are omitted and the input is not mutated', () => {
    const input = [a('b', 'laptop'), a('a', 'laptop')]
    const copy = [...input]
    const groups = groupAssetsByType(input)
    assert.equal(groups.length, 1)
    assert.deepEqual(input, copy)
  })

  test('no assets gives no groups', () => {
    assert.deepEqual(groupAssetsByType([]), [])
  })

  test('normalizeAssetType', () => {
    assert.equal(normalizeAssetType(' Virtual   Server '), 'virtual server')
    assert.equal(normalizeAssetType(undefined), '')
  })
})
