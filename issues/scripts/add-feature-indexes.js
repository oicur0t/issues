/**
 * Add indexes for the features collection and issues.featureId
 * Run with: node scripts/add-feature-indexes.js
 */

const { MongoClient } = require('mongodb');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function addFeatureIndexes() {
  console.log('Adding feature indexes...\n');

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
    const db = client.db('issues');

    const featureNumberIndex = await db.collection('features').createIndex(
      { featureNumber: 1 },
      { unique: true, sparse: true, name: 'featureNumber_unique' }
    );
    console.log(`Index created: ${featureNumberIndex}`);

    const projectIndex = await db.collection('features').createIndex(
      { projectId: 1, status: 1 },
      { name: 'projectId_status' }
    );
    console.log(`Index created: ${projectIndex}`);

    const issueFeatureIndex = await db.collection('issues').createIndex(
      { featureId: 1 },
      { sparse: true, name: 'featureId' }
    );
    console.log(`Index created: ${issueFeatureIndex}`);

    console.log('\nDone.');
  } finally {
    await client.close();
  }
}

addFeatureIndexes().catch((error) => {
  console.error('Failed to add feature indexes:', error);
  process.exit(1);
});
