/**
 * Check what fields issues have
 * Run with: node scripts/check-issue-fields.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function checkIssueFields() {
  console.log('🔍 Checking issue fields...\n');

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

    // Get a few sample issues
    const sampleIssues = await issuesCollection.find({}).limit(3).toArray();

    console.log(`📊 Showing ${sampleIssues.length} sample issues:\n`);

    sampleIssues.forEach((issue, index) => {
      console.log(`Issue ${index + 1}:`);
      console.log(`  _id: ${issue._id}`);
      console.log(`  title: ${issue.title}`);
      console.log(`  issueId: ${issue.issueId || 'NOT PRESENT'}`);
      console.log(`  issueNumber: ${issue.issueNumber || 'NOT PRESENT'}`);
      console.log(`  projectId: ${issue.projectId || 'NOT PRESENT'}`);
      console.log(`  status: ${issue.status || 'NOT PRESENT'}`);
      console.log('');
    });

    // Count issues with each field
    const totalIssues = await issuesCollection.countDocuments({});
    const withIssueId = await issuesCollection.countDocuments({ issueId: { $exists: true } });
    const withIssueNumber = await issuesCollection.countDocuments({ issueNumber: { $exists: true } });

    console.log('📊 Statistics:');
    console.log(`  Total issues: ${totalIssues}`);
    console.log(`  With 'issueId' field: ${withIssueId}`);
    console.log(`  With 'issueNumber' field: ${withIssueNumber}`);
    console.log(`  Without either: ${totalIssues - Math.max(withIssueId, withIssueNumber)}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkIssueFields().catch(console.error);
