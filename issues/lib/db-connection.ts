/**
 * Connection manager that never caches a failed connection.
 *
 * The old code did `clientPromise = client.connect()` once at import time, so
 * if Atlas was unreachable at that moment (paused cluster, IP not allowed,
 * network blip) the rejected promise was reused forever and every request
 * failed until the process restarted. Here a failed attempt is dropped, so the
 * next request connects again. A connected client is reused; the driver itself
 * recovers from a cluster that goes away and comes back.
 */
export interface ConnectionManager<C> {
  get(): Promise<C>
  /** Drops the cached client (closing it best-effort) so the next get() reconnects. */
  reset(): Promise<void>
}

export function createConnectionManager<C>(opts: {
  connect: () => Promise<C>
  close?: (client: C) => Promise<void>
  onError?: (error: unknown) => void
}): ConnectionManager<C> {
  let pending: Promise<C> | null = null

  return {
    get() {
      if (!pending) {
        const attempt = opts.connect().catch(error => {
          // Only clear if nobody has replaced us (e.g. via reset()).
          if (pending === attempt) pending = null
          opts.onError?.(error)
          throw error
        })
        pending = attempt
      }
      return pending
    },

    async reset() {
      const old = pending
      pending = null
      if (old && opts.close) {
        try {
          await opts.close(await old)
        } catch {
          // The old client was already broken or never connected.
        }
      }
    },
  }
}
