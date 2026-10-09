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

The sync owns **only** the `tailscale` subdocument, plus `status: removed`/`removedAt`. Provider, location, cost, notes, tags, accounts, custom fields, type and project links are manual and never touched. Newly discovered hosts start with those empty.

On an asset's page the Tailscale panel is **read-only**; everything else is editable with the **Edit** button.

## After the first sync (what you do by hand)

- **Type each host.** New hosts are created as type `host`. The Assets page groups by type (physical server, virtual server, desktop, laptop, device, then others), so until you change a host's type it sits in one big "Host" group. The sync cannot tell a laptop from a desktop or a physical from a virtual server, so it does not guess. (A device whose reported hostname is `localhost`, as iOS does, is named from its MagicDNS name instead.)
- **Fill in provider, location, notes**, link the projects it serves, and add custom fields.
- **Needs review.** Newly discovered hosts show a **Needs review** chip. It clears when you save the asset (any edit counts) or press **Mark reviewed** on its page. Later syncs never set it again on a host that already exists. `node scripts/clear-needs-review.js` (dry run by default, `--apply` to write) clears it in bulk on hosts that already have hand-entered details, a changed type or extra tags.
- **Decommission dead hosts.** Set status to Decommissioned; the sync respects that and will not flip it back to active.

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

## Troubleshooting

The Assets page panel shows the last failure with Tailscale's own message.

| Panel says | Cause and fix |
|---|---|
| "Not configured" | The two variables are missing or misspelled. The names must be exactly `TAILSCALE_OAUTH_CLIENT_ID` and `TAILSCALE_OAUTH_CLIENT_SECRET` (not `OATH`, not `..._OAUTH_SECRET`). Save `.env`, then restart the container. |
| "token request failed (403: request must be authenticated with OAuth client credentials)" | Wrong **kind** of credential. The secret must start with `tskey-client-`. An API access token (`tskey-api-...`) or an auth key (`tskey-auth-...`) from Settings > Keys will not work. |
| "token request failed (401: API token invalid)" | Client id or secret is wrong, or the OAuth client was revoked. |
| "devices request failed (403)" | The OAuth client lacks the `devices:core:read` scope. |
| "refusing to mark ... removed" / "returned no devices" | A safety guard tripped (see above). Nothing was written. Check the credentials and the tailnet, then sync again. |

Where to create the OAuth client: https://console.tailscale.com/admin/settings/trust-credentials (Settings > Trust credentials > **Credential** > **OAuth**, scope Devices > Core > Read). Owners, Admins, Network admins and IT admins can create them; a plain Member cannot. This is a different page from Settings > Keys.

Editing `.env` only takes effect after a container restart (no rebuild): `sudo podman-compose down && sudo podman-compose up -d --no-build`.

## Tests

`npm test` runs the sync planner, API client and asset-grouping tests (no network or database needed). The fixture `tests/fixtures/tailscale-devices.json` is modelled on the documented response and verified against the official client's field names; the first real sync worked against it, but it should be replaced with a scrubbed real capture (tracked as ISS-018). The "removed", "reactivated" and abort paths are unit-tested but have not yet been seen on a real tailnet.

## Known follow-ups

Tracked in the ISS project: ISS-014 decommission dead hosts, ISS-015 fill in provider/location, ISS-016 move the "client update available" chip off cards, ISS-017 a "stale host" flag for long-offline devices, ISS-018 real-capture fixture.

## Not included (later)

Containers/pods/integrations (likely a per-host agent), LAN/public IPs, provider and location (manual). Account info is names only, never credentials.
