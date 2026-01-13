/**
 * Migration script to add project support to existing issues
 *
 * This script:
 * 1. Creates a default project if none exist
 * 2. Updates all existing issues to reference the default project
 * 3. Assigns issue numbers based on creation date
 *
 * Run with: npx tsx scripts/migrate-to-projects.ts
 */

import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGODB_DB || 'issue-tracker'

async function migrate() {
  console.log('🚀 Starting migration to projects...')

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')

    const db = client.db(DB_NAME)
    const projectsCollection = db.collection('projects')
    const issuesCollection = db.collection('issues')
    const usersCollection = db.collection('users')

    // Check if projects already exist
    const existingProjectCount = await projectsCollection.countDocuments()
    console.log(`📊 Found ${existingProjectCount} existing projects`)

    // Check existing issues
    const existingIssueCount = await issuesCollection.countDocuments()
    const issuesNeedingMigration = await issuesCollection.countDocuments({ projectId: { $exists: false } })
    console.log(`📊 Found ${existingIssueCount} total issues`)
    console.log(`📊 Found ${issuesNeedingMigration} issues needing migration`)

    if (issuesNeedingMigration === 0) {
      console.log('✅ All issues already have projects - nothing to migrate')
      return
    }

    // Get first admin user for project creation
    const adminUser = await usersCollection.findOne({ role: 'admin' })
    if (!adminUser) {
      console.error('❌ No admin user found - cannot create default project')
      process.exit(1)
    }

    // Create or get default project
    let defaultProject = await projectsCollection.findOne({ key: 'GEN' })

    if (!defaultProject) {
      console.log('📝 Creating default "General" project...')
      const projectData = {
        name: 'General',
        key: 'GEN',
        description: 'Default project for migrated issues',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminUser._id,
        issueCounter: 0,
      }

      const result = await projectsCollection.insertOne(projectData)
      defaultProject = { _id: result.insertedId, ...projectData }
      console.log('✅ Created default project with key "GEN"')
    } else {
      console.log('✅ Using existing "General" project')
    }

    // Get all issues that need migration, sorted by creation date
    const issuesToMigrate = await issuesCollection
      .find({ projectId: { $exists: false } })
      .sort({ createdAt: 1 })
      .toArray()

    console.log(`🔄 Migrating ${issuesToMigrate.length} issues...`)

    // Update each issue with project reference and issue number
    let counter = defaultProject.issueCounter || 0

    for (const issue of issuesToMigrate) {
      counter++
      const issueNumber = `GEN-${counter.toString().padStart(3, '0')}`

      await issuesCollection.updateOne(
        { _id: issue._id },
        {
          $set: {
            projectId: defaultProject._id,
            issueNumber: issueNumber,
          }
        }
      )

      console.log(`  ✓ Migrated issue ${issue._id} -> ${issueNumber}`)
    }

    // Update project counter
    await projectsCollection.updateOne(
      { _id: defaultProject._id },
      { $set: { issueCounter: counter } }
    )

    console.log(`✅ Migration complete!`)
    console.log(`📊 Migrated ${issuesToMigrate.length} issues to project "${defaultProject.name}" (${defaultProject.key})`)
    console.log(`📊 Project counter updated to ${counter}`)
    console.log('')
    console.log('🎉 You can now:')
    console.log('   1. Create new projects at /projects/new')
    console.log('   2. View existing issues with their GEN-XXX numbers')
    console.log('   3. Create new issues and assign them to projects')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('👋 Disconnected from MongoDB')
  }
}

// Run migration
migrate().catch(console.error)
