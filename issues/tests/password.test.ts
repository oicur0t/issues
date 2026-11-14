import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { validatePasswordChange } from '../lib/password'

describe('validatePasswordChange', () => {
  test('accepts a valid change', () => {
    assert.equal(validatePasswordChange('old-password', 'new-password-1', 'new-password-1'), null)
  })

  test('requires current and new password', () => {
    assert.match(validatePasswordChange('', 'new-password-1', 'new-password-1')!, /current/i)
    assert.match(validatePasswordChange('old', '', '')!, /new password/i)
  })

  test('enforces minimum length', () => {
    assert.match(validatePasswordChange('old-password', 'short', 'short')!, /at least 8/)
  })

  test('rejects whitespace-only passwords', () => {
    assert.match(validatePasswordChange('old-password', '        ', '        ')!, /whitespace/)
  })

  test('requires confirmation to match', () => {
    assert.match(validatePasswordChange('old-password', 'new-password-1', 'new-password-2')!, /do not match/)
  })

  test('rejects reusing the current password', () => {
    assert.match(validatePasswordChange('same-password', 'same-password', 'same-password')!, /different/)
  })
})
