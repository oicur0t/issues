import { IssueTrackerClient } from './ai-client/index'

async function testFullWorkflow() {
  const apiKey = process.argv[2]

  if (!apiKey) {
    console.error('Usage: npx tsx test-full-workflow.ts <API_KEY>')
    process.exit(1)
  }

  const client = new IssueTrackerClient({
    baseURL: 'http://localhost:3000/api/v1',
    apiKey: apiKey
  })

  console.log('🚀 Testing Full Issue Tracker Workflow\n')
  console.log('=' .repeat(60))

  try {
    // 1. List all projects
    console.log('\n📁 Step 1: Fetching all projects...')
    const projects = await client.projects.list()
    console.log(`   Found ${projects.length} projects:`)
    projects.forEach(p => console.log(`   - ${p.name} (${p.key})`))

    const issuesProject = projects.find(p => p.key === 'ISS')
    if (!issuesProject) {
      throw new Error('Issues project not found')
    }

    // 2. Create a new issue
    console.log('\n✨ Step 2: Creating a new issue...')
    const newIssue = await client.issues.create({
      title: 'Comprehensive API Workflow Test',
      description: `This issue was created to test the full API workflow including:

- Creating issues via API
- Adding comments
- Updating issue metadata
- Filtering by tags
- Full CRUD operations

This demonstrates that the Issue Tracker is fully functional for AI agents!`,
      projectId: issuesProject._id,
      priority: 'high',
      tags: ['testing', 'api', 'claude', 'automation']
    })
    console.log(`   ✅ Created issue: ${newIssue.issueNumber}`)
    console.log(`   Title: ${newIssue.title}`)
    console.log(`   Priority: ${newIssue.priority}`)
    console.log(`   Tags: ${newIssue.tags?.join(', ')}`)

    // 3. Add first comment
    console.log('\n💬 Step 3: Adding first comment...')
    const comment1 = await client.issues.addComment(newIssue._id, {
      content: 'This is the first comment! Testing the comments API functionality.'
    })
    console.log(`   ✅ Comment added by: ${comment1.author?.name || 'Unknown'}`)

    // 4. Add second comment
    console.log('\n💬 Step 4: Adding second comment...')
    const comment2 = await client.issues.addComment(newIssue._id, {
      content: `Update: The API is working perfectly!

Key achievements:
✓ Issue creation
✓ Comment posting
✓ Author attribution
✓ Tag filtering

Ready for production use.`
    })
    console.log(`   ✅ Comment added`)

    // 5. Update the issue
    console.log('\n🔄 Step 5: Updating issue status and priority...')
    const updatedIssue = await client.issues.update(newIssue._id, {
      status: 'in_progress',
      priority: 'critical',
      tags: ['testing', 'api', 'claude', 'automation', 'verified']
    })
    console.log(`   ✅ Updated status: ${updatedIssue.status}`)
    console.log(`   ✅ Updated priority: ${updatedIssue.priority}`)
    console.log(`   ✅ Added tag: verified`)

    // 6. Retrieve all comments
    console.log('\n📋 Step 6: Retrieving all comments...')
    const comments = await client.issues.getComments(newIssue._id)
    console.log(`   Found ${comments.length} comments:`)
    comments.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.author?.name}: "${c.content.substring(0, 50)}..."`)
    })

    // 7. Filter issues by tags
    console.log('\n🏷️  Step 7: Filtering issues by tags...')
    const claudeIssues = await client.issues.list({ tags: ['claude'] })
    console.log(`   Found ${claudeIssues.length} issues tagged with 'claude'`)

    const testingIssues = await client.issues.list({ tags: ['testing'] })
    console.log(`   Found ${testingIssues.length} issues tagged with 'testing'`)

    // 8. Get specific issue
    console.log('\n🔍 Step 8: Retrieving the created issue...')
    const retrievedIssue = await client.issues.get(newIssue._id)
    console.log(`   Issue: ${retrievedIssue.issueNumber}`)
    console.log(`   Status: ${retrievedIssue.status}`)
    console.log(`   Priority: ${retrievedIssue.priority}`)
    console.log(`   Tags: ${retrievedIssue.tags?.join(', ')}`)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('🎉 SUCCESS! All API operations completed successfully!\n')
    console.log('Summary:')
    console.log(`   - Issue created: ${newIssue.issueNumber}`)
    console.log(`   - Comments added: ${comments.length}`)
    console.log(`   - Status updated: ${updatedIssue.status}`)
    console.log(`   - Tags applied: ${updatedIssue.tags?.length}`)
    console.log(`\n   View at: http://localhost:3000/issues/${newIssue._id}`)
    console.log('=' .repeat(60))

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

testFullWorkflow()
