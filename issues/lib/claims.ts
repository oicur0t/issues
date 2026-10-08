// Issue claims are soft locks that expire, so a crashed or abandoned agent can't hold work forever.
export const CLAIM_TTL_HOURS = Number(process.env.CLAIM_TTL_HOURS) || 4

export function claimCutoff(): Date {
  return new Date(Date.now() - CLAIM_TTL_HOURS * 60 * 60 * 1000)
}

/** True if the issue has a claim that has passed its TTL */
export function isClaimExpired(issue: Record<string, any>): boolean {
  return !!issue.claimedBy && !!issue.claimedAt && issue.claimedAt < claimCutoff()
}
