const { MongoClient } = require('mongodb');
const fs = require('fs');

async function cleanup() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const lines = envContent.split('\n');
    let uri = '';
    let certPath = '';

    for (const line of lines) {
      if (line.startsWith('MONGODB_URI=')) {
        uri = line.substring('MONGODB_URI='.length).trim();
      }
      if (line.startsWith('MONGODB_CERT_PATH=')) {
        certPath = line.substring('MONGODB_CERT_PATH='.length).trim();
      }
    }

    if (!uri) {
      console.error('MONGODB_URI not found in .env');
      process.exit(1);
    }

    const options = {};
    if (certPath && fs.existsSync(certPath)) {
      options.tlsCertificateKeyFile = certPath;
      console.log('Using certificate:', certPath);
    }

    console.log('Connecting to MongoDB...');
    const client = new MongoClient(uri, options);
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db();

    console.log('Deleting all issues...');
    const issuesResult = await db.collection('issues').deleteMany({});
    console.log('✓ Deleted', issuesResult.deletedCount, 'issues');

    console.log('Resetting project counters...');
    const projectsResult = await db.collection('projects').updateMany(
      {},
      { $set: { issueCounter: 0 } }
    );
    console.log('✓ Reset', projectsResult.modifiedCount, 'project counters');

    await client.close();
    console.log('\n✓ Cleanup complete!');
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

cleanup();
