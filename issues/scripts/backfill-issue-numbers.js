/**
 * Backfill issue numbers for all issues without them
 * Run with: node scripts/backfill-issue-numbers.js
 */

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function backfillIssueNumbers() {
  console.log('🔢 Backfilling issue numbers...\n');

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

    // Find all issues without issueNumber
    const issuesWithoutNumber = await issuesCollection.find({
      issueNumber: { $exists: false }
    }).sort({ createdAt: 1 }).toArray();

    if (issuesWithoutNumber.length === 0) {
      console.log('✅ All issues already have issue numbers!');
      return;
    }

    console.log(`📊 Found ${issuesWithoutNumber.length} issue(s) without issue numbers\n`);

    // Group issues by project
    const issuesByProject = {};
    for (const issue of issuesWithoutNumber) {
      const projectId = issue.projectId ? issue.projectId.toString() : 'no-project';
      if (!issuesByProject[projectId]) {
        issuesByProject[projectId] = [];
      }
      issuesByProject[projectId].push(issue);
    }

    console.log(`📂 Issues grouped into ${Object.keys(issuesByProject).length} project(s)\n`);

    let totalUpdated = 0;
    const results = [];

    // Process each project
    for (const [projectIdStr, projectIssues] of Object.entries(issuesByProject)) {
      if (projectIdStr === 'no-project') {
        console.log(`⚠️  Skipping ${projectIssues.length} issue(s) without project`);
        continue;
      }

      // Get project details
      const project = await projectsCollection.findOne({ _id: new ObjectId(projectIdStr) });

      if (!project) {
        console.log(`⚠️  Project ${projectIdStr} not found, skipping ${projectIssues.length} issue(s)`);
        continue;
      }

      console.log(`\n📝 Processing project: ${project.name} (${project.key})`);
      console.log(`   ${projectIssues.length} issue(s) to process`);

      // Get current counter or initialize to 0
      let counter = project.issueCounter || 0;
      console.log(`   Starting counter: ${counter}`);

      // Assign issue numbers to each issue
      for (const issue of projectIssues) {
        counter++;
        const paddedNumber = counter.toString().padStart(3, '0');
        const issueNumber = `${project.key}-${paddedNumber}`;

        await issuesCollection.updateOne(
          { _id: issue._id },
          {
            $set: {
              issueNumber: issueNumber,
              updatedAt: new Date()
            }
          }
        );

        console.log(`   ✓ ${issueNumber}: ${issue.title.substring(0, 50)}${issue.title.length > 50 ? '...' : ''}`);
        totalUpdated++;
      }

      // Update project counter
      await projectsCollection.updateOne(
        { _id: new ObjectId(projectIdStr) },
        {
          $set: {
            issueCounter: counter,
            updatedAt: new Date()
          }
        }
      );

      results.push({
        project: project.name,
        key: project.key,
        issuesUpdated: projectIssues.length,
        newCounter: counter
      });

      console.log(`   ✅ Updated project counter to ${counter}`);
    }

    console.log(`\n🎉 Backfill complete!`);
    console.log(`\n📊 Summary:`);
    console.log(`   Total issues updated: ${totalUpdated}`);
    console.log(`\n📋 By Project:`);
    results.forEach(r => {
      console.log(`   ${r.project} (${r.key}): ${r.issuesUpdated} issues, counter now at ${r.newCounter}`);
    });

    // Verify no duplicates
    console.log(`\n🔍 Verifying uniqueness...`);
    const allIssues = await issuesCollection.find({ issueNumber: { $exists: true } }).toArray();
    const issueNumbers = allIssues.map(i => i.issueNumber);
    const duplicates = issueNumbers.filter((item, index) => issueNumbers.indexOf(item) !== index);

    if (duplicates.length === 0) {
      console.log(`✅ All issue numbers are unique!`);
    } else {
      console.log(`❌ Found duplicate issue numbers: ${[...new Set(duplicates)].join(', ')}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

backfillIssueNumbers().catch(console.error);
