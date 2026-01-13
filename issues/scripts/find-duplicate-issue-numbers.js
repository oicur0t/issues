/**
 * Find issues with duplicate issueNumber values
 * Run with: node scripts/find-duplicate-issue-numbers.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function findDuplicateIssueNumbers() {
  console.log('🔍 Finding duplicate issue numbers...\n');

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

    // Use aggregation to find duplicates
    const duplicates = await issuesCollection.aggregate([
      {
        $match: {
          issueNumber: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$issueNumber',
          count: { $sum: 1 },
          issues: {
            $push: {
              id: '$_id',
              title: '$title',
              status: '$status',
              createdAt: '$createdAt'
            }
          }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();

    if (duplicates.length === 0) {
      console.log('✅ No duplicate issue numbers found!');

      // Show some statistics
      const totalIssues = await issuesCollection.countDocuments({});
      console.log(`\n📊 Total issues: ${totalIssues}`);

      // Show issue number ranges
      const issueNumbersResult = await issuesCollection.aggregate([
        {
          $group: {
            _id: {
              $arrayElemAt: [{ $split: ['$issueNumber', '-'] }, 0]
            },
            count: { $sum: 1 },
            min: { $min: '$issueNumber' },
            max: { $max: '$issueNumber' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]).toArray();

      console.log('\n📋 Issue numbers by project:');
      issueNumbersResult.forEach(result => {
        console.log(`   ${result._id}: ${result.count} issues (${result.min} to ${result.max})`);
      });

    } else {
      console.log(`❌ Found ${duplicates.length} duplicate issue number(s):\n`);

      duplicates.forEach(dup => {
        console.log(`Issue Number: ${dup._id} (${dup.count} occurrences)`);
        dup.issues.forEach((issue, index) => {
          console.log(`  ${index + 1}. MongoDB ID: ${issue.id}`);
          console.log(`     Title: ${issue.title}`);
          console.log(`     Status: ${issue.status}`);
          console.log(`     Created: ${issue.createdAt}`);
        });
        console.log('');
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

findDuplicateIssueNumbers().catch(console.error);
