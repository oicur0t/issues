const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/issue-tracker';

async function cleanup() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const issuesCollection = db.collection('issues');
    const projectsCollection = db.collection('projects');

    // Get all issues
    const issues = await issuesCollection.find().toArray();
    console.log(`Found ${issues.length} issues`);

    // Get all valid project IDs
    const projects = await projectsCollection.find().toArray();
    const validProjectIds = new Set(projects.map(p => p._id.toString()));
    console.log(`Found ${projects.length} valid projects`);

    // Find orphaned issues
    const orphanedIssues = issues.filter(issue => !validProjectIds.has(issue.projectId.toString()));
    console.log(`Found ${orphanedIssues.length} orphaned issues`);

    if (orphanedIssues.length > 0) {
      console.log('Orphaned issue IDs:', orphanedIssues.map(i => i._id.toString()));

      // Delete orphaned issues
      const result = await issuesCollection.deleteMany({
        _id: { $in: orphanedIssues.map(i => i._id) }
      });

      console.log(`Deleted ${result.deletedCount} orphaned issues`);
    } else {
      console.log('No orphaned issues found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

cleanup();
