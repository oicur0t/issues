/**
 * One-off cleanup: clear the Tailscale "needs review" flag on assets that already have
 * hand-entered details (provider, location, description, cost, custom fields, project links,
 * a type other than 'host', or extra tags).
 * Shows what it would change; nothing is written without --apply.
 *
 * Run with: node scripts/clear-needs-review.js          (dry run)
 *           node scripts/clear-needs-review.js --apply
 */

const { MongoClient } = require('mongodb');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function run() {
  const apply = process.argv.includes('--apply');

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const options = {};
  if (process.env.MONGODB_CERT_PATH) {
    options.tls = true;
    options.tlsCertificateKeyFile = path.resolve(process.env.MONGODB_CERT_PATH);
    options.authMechanism = 'MONGODB-X509';
    options.authSource = '$external';
  }

  const client = new MongoClient(process.env.MONGODB_URI, options);
  try {
    await client.connect();
    const assets = client.db('issues').collection('assets');

    const flagged = await assets.find({ needsReview: true }).toArray();
    // The sync creates assets as type 'host' tagged only 'tailscale'. Anything beyond that was done by hand.
    const reviewed = flagged.filter(a =>
      a.provider || a.location || a.description || a.cost !== undefined ||
      (a.customFields && a.customFields.length > 0) || (a.projects && a.projects.length > 0) ||
      (a.type && a.type !== 'host') ||
      (a.tags && a.tags.some(t => t !== 'tailscale'))
    );

    console.log(`${flagged.length} assets flagged needs-review; ${reviewed.length} already have hand-entered details:`);
    reviewed.forEach(a => console.log(`  - ${a.name}`));

    if (reviewed.length === 0) return;

    if (!apply) {
      console.log('\nDry run only. Re-run with --apply to clear the flag on these.');
      return;
    }

    const result = await assets.updateMany(
      { _id: { $in: reviewed.map(a => a._id) } },
      { $unset: { needsReview: '' } }
    );
    console.log(`\nCleared the flag on ${result.modifiedCount} assets.`);
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error('Failed:', error);
  process.exit(1);
});
