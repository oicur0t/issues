/**
 * Comprehensive fix for issue numbers:
 * 1. Synchronize project counters to max issue number
 * 2. Fix all duplicates
 * Run with: node scripts/fix-all-issue-numbers.js
 */

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function fixAllIssueNumbers() {
  console.log('🔧 Comprehensive issue number fix...\n');

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

    // Step 1: Synchronize all project counters
    console.log('📊 Step 1: Synchronizing project counters...\n');

    const projects = await projectsCollection.find({}).toArray();

    for (const project of projects) {
      // Find all issues for this project
      const projectIssues = await issuesCollection.find({
        projectId: project._id,
        issueNumber: { $exists: true, $ne: null }
      }).toArray();

      if (projectIssues.length === 0) {
        console.log(`   ${project.name} (${project.key}): No issues, counter set to 0`);
        await projectsCollection.updateOne(
          { _id: project._id },
          { $set: { issueCounter: 0 } }
        );
        continue;
      }

      // Find the maximum issue number
      let maxNumber = 0;
      projectIssues.forEach(issue => {
        if (issue.issueNumber && issue.issueNumber.startsWith(project.key + '-')) {
          const numPart = issue.issueNumber.split('-')[1];
          const num = parseInt(numPart, 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      });

      console.log(`   ${project.name} (${project.key}): ${projectIssues.length} issues, max number ${maxNumber}, updating counter`);

      await projectsCollection.updateOne(
        { _id: project._id },
        { $set: { issueCounter: maxNumber, updatedAt: new Date() } }
      );
    }

    // Step 2: Find and fix duplicates
    console.log('\n📊 Step 2: Finding and fixing duplicates...\n');

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
      console.log('✅ No duplicates found!');
      return;
    }

    console.log(`Found ${duplicates.length} duplicate issue number(s)\n`);

    let totalFixed = 0;

    for (const dup of duplicates) {
      console.log(`🔄 Fixing: ${dup._id} (${dup.count} occurrences)`);

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
          { $inc: { issueCounter: 1 }, $set: { updatedAt: new Date() } },
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

        console.log(`   ✓ Reassigned ${dup._id} → ${newIssueNumber}: ${issue.title.substring(0, 40)}...`);
        totalFixed++;
      }
    }

    console.log(`\n🎉 Fixed ${totalFixed} duplicate issue number(s)!`);

    // Step 3: Verify
    console.log(`\n🔍 Step 3: Verifying fix...\n`);
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

      // Show final statistics
      const totalIssues = await issuesCollection.countDocuments({});
      console.log(`\n📊 Final Statistics:`);
      console.log(`   Total issues: ${totalIssues}`);

      for (const project of projects) {
        const count = await issuesCollection.countDocuments({ projectId: project._id });
        const proj = await projectsCollection.findOne({ _id: project._id });
        console.log(`   ${project.name} (${project.key}): ${count} issues, counter at ${proj.issueCounter}`);
      }
    } else {
      console.log(`❌ Still have ${remainingDuplicates.length} duplicate(s):`);
      remainingDuplicates.forEach(d => console.log(`   - ${d._id}: ${d.count} occurrences`));
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixAllIssueNumbers().catch(console.error);
