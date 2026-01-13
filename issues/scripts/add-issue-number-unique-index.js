/**
 * Add unique index on issueNumber to prevent future duplicates
 * Run with: node scripts/add-issue-number-unique-index.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function addUniqueIndex() {
  console.log('🔐 Adding unique index on issueNumber...\n');

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  const options = {};

  if (process.env.MONGODB_CERT_PATH) {
    const certPath = path.resolve(process.env.MONGODB_CERT_PATH);
    options.tls = true;
    options.tlsCertificateKeyFile = certPath;
    options.authMechanism = 'MONGODB-X509';
    options.authSource = '$external';
  }

  const client = new MongoClient(uri, options);

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const db = client.db('issues');
    const issuesCollection = db.collection('issues');

    // Check existing indexes
    const existingIndexes = await issuesCollection.indexes();
    console.log('📋 Existing indexes:');
    existingIndexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Check if unique index already exists
    const hasUniqueIndex = existingIndexes.some(idx =>
      idx.key.issueNumber && idx.unique === true
    );

    if (hasUniqueIndex) {
      console.log('\n✅ Unique index on issueNumber already exists!');
      return;
    }

    // Verify no duplicates exist before creating unique index
    console.log('\n🔍 Verifying no duplicates exist...');
    const duplicates = await issuesCollection.aggregate([
      {
        $match: {
          issueNumber: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$issueNumber',
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]).toArray();

    if (duplicates.length > 0) {
      console.log(`❌ Cannot create unique index: ${duplicates.length} duplicate(s) still exist`);
      console.log('   Run fix-all-issue-numbers.js first');
      process.exit(1);
    }

    console.log('✓ No duplicates found, safe to create unique index\n');

    // Create unique index
    console.log('📝 Creating unique index on issueNumber...');
    const indexName = await issuesCollection.createIndex(
      { issueNumber: 1 },
      {
        unique: true,
        sparse: true,
        name: 'issueNumber_unique',
        background: true
      }
    );

    console.log(`✅ Index created: ${indexName}\n`);

    // Verify index was created
    const updatedIndexes = await issuesCollection.indexes();
    const newIndex = updatedIndexes.find(idx => idx.name === 'issueNumber_unique');

    if (newIndex) {
      console.log('✅ Verification successful!');
      console.log('   Index details:');
      console.log(`   - Name: ${newIndex.name}`);
      console.log(`   - Key: ${JSON.stringify(newIndex.key)}`);
      console.log(`   - Unique: ${newIndex.unique}`);
      console.log(`   - Sparse: ${newIndex.sparse ? 'Yes' : 'No'}`);
    }

    console.log('\n🎉 Unique constraint added! Future duplicate issue numbers will be prevented.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.close();
  }
}

addUniqueIndex().catch(console.error);
