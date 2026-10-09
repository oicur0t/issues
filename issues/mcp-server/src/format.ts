// Text formatting for MCP tool responses. Kept free of server/SDK imports so it can be unit tested.
import type { Asset } from './types.js';

/**
 * Label for a linked project. The API normally returns populated projects ({ key, name, role }),
 * but the raw stored shape ({ projectId, role }) must never print "undefined" (ISS-021).
 */
export function formatProject(project: { key?: string; name?: string; role: string }): string {
  return `${project.key ?? project.name ?? 'unknown project'} (${project.role})`;
}

export function formatAsset(asset: Asset): string {
  return `${asset.name} (${asset.type}, ${asset.status})\n` +
    (asset.hostname ? `  Hostname: ${asset.hostname}\n` : '') +
    (asset.ipAddresses?.length ? `  IPs: ${asset.ipAddresses.join(', ')}\n` : '') +
    (asset.os ? `  OS: ${asset.os}\n` : '') +
    (asset.provider || asset.location ? `  Provider/Location: ${asset.provider || '-'} / ${asset.location || '-'}\n` : '') +
    (asset.cost != null ? `  Cost: ${asset.cost}\n` : '') +
    (asset.projects?.length ? `  Projects: ${asset.projects.map(formatProject).join(', ')}\n` : '') +
    (asset.tags?.length ? `  Tags: ${asset.tags.join(', ')}\n` : '') +
    (asset.lastCheckIn ? `  Last check-in: ${new Date(asset.lastCheckIn).toLocaleString()}\n` : '') +
    (asset.needsReview ? '  Needs review: discovered via Tailscale, manual fields still empty\n' : '') +
    (asset.tailscale?.warnings?.length ? `  Warnings: ${asset.tailscale.warnings.map(w => w.message).join('; ')}\n` : '');
}

/** Exact text returned by the create_asset tool */
export function formatAssetCreatedResponse(asset: Asset): string {
  return `Asset created successfully!

${formatAsset(asset)}  ID: ${asset._id}`;
}

/** Exact text returned by the update_asset tool */
export function formatAssetUpdatedResponse(asset: Asset): string {
  return `Asset updated successfully!

${formatAsset(asset)}  ID: ${asset._id}`;
}
