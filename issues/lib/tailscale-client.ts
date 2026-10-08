/**
 * Minimal Tailscale API client: OAuth client-credentials token + list devices.
 * Needs an OAuth client with the read-only `devices:core:read` scope.
 * Errors never include the client secret.
 */
import type { TailscaleDevice } from './tailscale-sync'

const API_BASE = 'https://api.tailscale.com/api/v2'
const MAX_ATTEMPTS = 4

export class TailscaleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TailscaleError'
  }
}

export interface TailscaleCredentials {
  clientId: string
  clientSecret: string
}

type FetchImpl = typeof fetch
type Sleep = (ms: number) => Promise<void>

const defaultSleep: Sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/** Tailscale's own error text (e.g. "API token invalid"); it never echoes credentials back */
async function errorDetail(response: Response): Promise<string> {
  try {
    const body = await response.json()
    const message = typeof body?.message === 'string' ? body.message : typeof body?.error === 'string' ? body.error : ''
    return message ? `: ${message.slice(0, 200)}` : ''
  } catch {
    return ''
  }
}

/** Tokens last one hour (not configurable), so we fetch a new one per sync run */
export async function getAccessToken(
  credentials: TailscaleCredentials,
  fetchImpl: FetchImpl = fetch
): Promise<string> {
  const body = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    grant_type: 'client_credentials',
  })

  let response: Response
  try {
    response = await fetchImpl(`${API_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
  } catch {
    throw new TailscaleError('Could not reach Tailscale to request an access token')
  }

  if (!response.ok) {
    throw new TailscaleError(
      `Tailscale token request failed (${response.status}${await errorDetail(response)}); check the OAuth client id and secret`
    )
  }

  const data = await response.json().catch(() => null)
  if (!data || typeof data.access_token !== 'string' || !data.access_token) {
    throw new TailscaleError('Tailscale token response did not include an access token')
  }
  return data.access_token
}

/** Lists tailnet devices ('-' = the credential's own tailnet). Retries 429/5xx with backoff. */
export async function fetchDevices(
  token: string,
  fetchImpl: FetchImpl = fetch,
  sleep: Sleep = defaultSleep
): Promise<TailscaleDevice[]> {
  let lastStatus = 0

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let response: Response | undefined
    try {
      response = await fetchImpl(`${API_BASE}/tailnet/-/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // network failure: retry like a 5xx
    }

    if (response) {
      lastStatus = response.status
      if (response.ok) {
        const data = await response.json().catch(() => null)
        if (!data || !Array.isArray(data.devices)) {
          throw new TailscaleError('Tailscale devices response was not in the expected format')
        }
        return data.devices as TailscaleDevice[]
      }

      const retryable = response.status === 429 || response.status >= 500
      if (!retryable) {
        throw new TailscaleError(
          `Tailscale devices request failed (${response.status}${await errorDetail(response)}); check the OAuth client has the devices:core:read scope`
        )
      }
    }

    if (attempt < MAX_ATTEMPTS - 1) {
      await sleep(1000 * 2 ** attempt)
    }
  }

  throw new TailscaleError(
    lastStatus
      ? `Tailscale devices request failed after ${MAX_ATTEMPTS} attempts (last status ${lastStatus})`
      : `Could not reach Tailscale after ${MAX_ATTEMPTS} attempts`
  )
}
