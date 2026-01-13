/**
 * Find issues with duplicate IDs
 * Run with: node scripts/find-duplicate-issue-ids.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function findDuplicateIssueIds() {
  console.log('🔍 Finding duplicate issue IDs...\n');

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

    // Find all issues
    const allIssues = await issuesCollection.find({}).toArray();
    console.log(`📊 Total issues: ${allIssues.length}\n`);

    // Group by issueId
    const issueIdMap = {};
    allIssues.forEach(issue => {
      if (issue.issueId) {
        if (!issueIdMap[issue.issueId]) {
          issueIdMap[issue.issueId] = [];
        }
        issueIdMap[issue.issueId].push({
          _id: issue._id.toString(),
          title: issue.title,
          status: issue.status,
          createdAt: issue.createdAt
        });
      } else {
        console.log(`⚠️  Issue without issueId: ${issue._id} - ${issue.title}`);
      }
    });

    // Find duplicates
    const duplicates = Object.entries(issueIdMap).filter(([id, issues]) => issues.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate issue IDs found!');
    } else {
      console.log(`❌ Found ${duplicates.length} duplicate issue ID(s):\n`);

      duplicates.forEach(([issueId, issues]) => {
        console.log(`Issue ID: ${issueId} (${issues.length} occurrences)`);
        issues.forEach((issue, index) => {
          console.log(`  ${index + 1}. MongoDB ID: ${issue._id}`);
          console.log(`     Title: ${issue.title}`);
          console.log(`     Status: ${issue.status}`);
          console.log(`     Created: ${issue.createdAt}`);
        });
        console.log('');
      });
    }

    // Check for missing issueIds
    const missingIds = allIssues.filter(issue => !issue.issueId);
    if (missingIds.length > 0) {
      console.log(`\n⚠️  Found ${missingIds.length} issue(s) without issueId:`);
      missingIds.forEach(issue => {
        console.log(`   - ${issue._id}: ${issue.title}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

findDuplicateIssueIds().catch(console.error);
