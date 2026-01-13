/**
 * Fix duplicate issue numbers by reassigning them
 * Run with: node scripts/fix-duplicate-issue-numbers.js
 */

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function fixDuplicateIssueNumbers() {
  console.log('🔧 Fixing duplicate issue numbers...\n');

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
    const projectsCollection = db.collection('projects');

    // Find duplicates
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
              projectId: '$projectId',
              title: '$title',
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
      return;
    }

    console.log(`📊 Found ${duplicates.length} duplicate issue number(s)\n`);

    let totalFixed = 0;

    for (const dup of duplicates) {
      console.log(`\n🔄 Fixing: ${dup._id} (${dup.count} occurrences)`);

      // Sort by creation date, keep the oldest
      const sortedIssues = dup.issues.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      console.log(`   ✓ Keeping original: ${sortedIssues[0].title.substring(0, 50)}`);

      // Reassign numbers for duplicates (skip the first/oldest one)
      for (let i = 1; i < sortedIssues.length; i++) {
        const issue = sortedIssues[i];

        // Get the project for this issue
        const project = await projectsCollection.findOne({ _id: issue.projectId });

        if (!project) {
          console.log(`   ⚠️  Project not found for issue ${issue.id}, skipping`);
          continue;
        }

        // Increment project counter and generate new issue number
        const result = await projectsCollection.findOneAndUpdate(
          { _id: issue.projectId },
          { $inc: { issueCounter: 1 } },
          { returnDocument: 'after' }
        );

        if (!result) {
          console.log(`   ⚠️  Failed to increment counter for project ${project.name}`);
          continue;
        }

        const newCounter = result.issueCounter;
        const paddedNumber = newCounter.toString().padStart(3, '0');
        const newIssueNumber = `${project.key}-${paddedNumber}`;

        // Update the issue with new number
        await issuesCollection.updateOne(
          { _id: issue.id },
          {
            $set: {
              issueNumber: newIssueNumber,
              updatedAt: new Date()
            }
          }
        );

        console.log(`   ✓ Reassigned ${dup._id} → ${newIssueNumber}: ${issue.title.substring(0, 50)}${issue.title.length > 50 ? '...' : ''}`);
        totalFixed++;
      }
    }

    console.log(`\n🎉 Fixed ${totalFixed} duplicate issue number(s)!`);

    // Verify no duplicates remain
    console.log(`\n🔍 Verifying fix...`);
    const remainingDuplicates = await issuesCollection.aggregate([
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

    if (remainingDuplicates.length === 0) {
      console.log(`✅ All issue numbers are now unique!`);
    } else {
      console.log(`❌ Still have ${remainingDuplicates.length} duplicate(s). Run script again.`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixDuplicateIssueNumbers().catch(console.error);
