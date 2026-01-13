/**
 * Script to delete all issues from the database
 * Usage: npx tsx scripts/cleanup-issues.ts
 */

import { MongoClient } from 'mongodb'
import * as fs from 'fs'
import * as path from 'path'

async function cleanupIssues() {
  const mongoUri = process.env.MONGODB_URI
  const certPath = process.env.MONGODB_CERT_PATH

  if (!mongoUri) {
    console.error('Error: MONGODB_URI environment variable is not set')
    process.exit(1)
  }

  let client: MongoClient

  try {
    // Setup MongoDB client options
    const options: any = {}

    if (certPath) {
      const resolvedCertPath = path.resolve(process.cwd(), certPath)
      console.log('Using certificate authentication from:', resolvedCertPath)
      options.tlsCertificateKeyFile = resolvedCertPath
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB...')
    client = new MongoClient(mongoUri, options)
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()
    const issuesCollection = db.collection('issues')

    // Count existing issues
    const count = await issuesCollection.countDocuments()
    console.log(`Found ${count} issues in the database`)

    if (count === 0) {
      console.log('No issues to delete')
      return
    }

    // Delete all issues
    console.log('Deleting all issues...')
    const result = await issuesCollection.deleteMany({})
    console.log(`✓ Successfully deleted ${result.deletedCount} issues`)

    // Also reset issue counters on all projects
    const projectsCollection = db.collection('projects')
    const projectCount = await projectsCollection.countDocuments()

    if (projectCount > 0) {
      console.log(`Resetting issue counters for ${projectCount} projects...`)
      const resetResult = await projectsCollection.updateMany(
        {},
        { $set: { issueCounter: 0 } }
      )
      console.log(`✓ Reset issue counters for ${resetResult.modifiedCount} projects`)
    }

    console.log('\n✓ Cleanup completed successfully!')

  } catch (error) {
    console.error('Error during cleanup:', error)
    process.exit(1)
  } finally {
    if (client!) {
      await client.close()
      console.log('MongoDB connection closed')
    }
  }
}

// Run the cleanup
cleanupIssues()
