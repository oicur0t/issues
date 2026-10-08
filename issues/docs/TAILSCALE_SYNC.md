# Tailscale host discovery (Assets)

Pulls tailnet devices into Assets so host cards stay current without manual entry. Tracked as feature ISS-F002 (issue ISS-012).

## Setup

1. In the Tailscale admin console go to **Settings > Trust credentials** and create an **OAuth client** with **only** the read-only scope `devices:core:read`. Do not use a personal API key (they expire after at most 90 days; OAuth clients don't).
2. Add to the Issues `.env` (gitignored; never put these in Atlas or in an asset record):
   ```
   TAILSCALE_OAUTH_CLIENT_ID=...
   TAILSCALE_OAUTH_CLIENT_SECRET=...
   ```
   Optional: `TAILSCALE_SYNC_INTERVAL_MINUTES` (default 60, `0` disables the schedule), `TAILSCALE_KEY_EXPIRY_WARN_DAYS` (default 14), `TAILSCALE_OFFLINE_HOURS` (default 24).
3. Restart the container so it reads the new `.env`.
4. Open **Assets** and press **Sync now** (or wait for the first scheduled run, about 30 seconds after start).

Until credentials are set the Assets page shows "Not configured" and nothing runs.

## What a sync does

For every tailnet device:

| Situation | Result |
|---|---|
| Asset already linked by `nodeId` | `tailscale` details and warnings refresh |
| Existing asset (manual or phone-home) shares a Tailscale IP or the hostname | **Linked** to the device, not duplicated |
| New device | Inserted as `type: host`, status `active`, tag `tailscale`, flagged **Needs review** |
| Linked device missing from the tailnet | Asset status becomes `removed` (never deleted; history and issue links stay) |
| `removed` device reappears | Status back to `active` |

`decommissioned` and `maintenance` set by a human are respected: a decommissioned asset is never marked removed.

## Field ownership

The sync owns **only** the `tailscale` subdocument, plus `status: removed`/`removedAt`. Provider, location, cost, notes, tags, accounts and project links are manual and never touched. Newly discovered hosts start with those empty.

## Warnings (shown on the card and detail page)

- Node key expired, or expiring within N days (skipped when key expiry is disabled for the device)
- Offline longer than the threshold
- Tailscale client update available
- Device not authorized

## Safety guards

A sync that fails writes **nothing**:

- Token or API failure (bad secret, revoked client, Tailscale down; 429/5xx are retried with backoff) is recorded as "last attempt failed" on the Assets page.
- An **empty** device list while linked assets exist aborts.
- A run that would mark **more than half** of the linked assets removed aborts.

## API and MCP

- `GET /api/v1/assets/tailscale-sync` : configured? last result / error
- `POST /api/v1/assets/tailscale-sync` : run now (developer role)
- MCP: `get_tailscale_sync_status`, `sync_tailscale_assets`

## Tests

`npm test` runs the sync planner and API client tests (no network or database needed). The fixture `tests/fixtures/tailscale-devices.json` is modelled on the documented response and verified against the official client's field names; replace it with a scrubbed real capture once credentials exist.

## Not included (later)

Containers/pods/integrations (likely a per-host agent), LAN/public IPs, provider and location (manual). Account info is names only, never credentials.
