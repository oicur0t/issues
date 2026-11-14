export const MIN_PASSWORD_LENGTH = 8

/**
 * Validates a password change request. Pure so it can be unit tested; the
 * server action still verifies the current password against the stored hash.
 * Returns an error message, or null when the request is acceptable.
 */
export function validatePasswordChange(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): string | null {
  if (!currentPassword) return 'Enter your current password'
  if (!newPassword) return 'Enter a new password'
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `New password must be at least ${MIN_PASSWORD_LENGTH} characters`
  }
  if (newPassword.trim().length === 0) return 'New password cannot be only whitespace'
  if (newPassword !== confirmPassword) return 'New password and confirmation do not match'
  if (newPassword === currentPassword) return 'New password must be different from your current password'
  return null
}
