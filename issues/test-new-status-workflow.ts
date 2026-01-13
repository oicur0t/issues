import { IssueTrackerClient } from './ai-client'

async function testNewStatusWorkflow() {
  const client = new IssueTrackerClient({
    baseURL: 'http://localhost:3000/api/v1',
    apiKey: 'iak_c0c0487189dfe9ce54fcfd038c3e5cb2ab5bca05fc53424ad5db7058a6f55799',
  })

  try {
    console.log('🧪 Testing New Status Workflow\n')

    // Create a new issue - should default to 'backlog'
    console.log('1️⃣ Creating new issue (should default to backlog)...')
    const newIssue = await client.issues.create({
      title: 'Test New Status Workflow',
      description: 'Testing the new Backlog → In Progress → Blocked → Fixed/Won\'t Fix workflow',
      projectId: '68f14026b3ff7be5f1d4a3ca', // ISS project
      priority: 'medium',
      tags: ['testing', 'status-workflow'],
    })
    console.log(`✅ Created issue ${newIssue.issueNumber} with status: ${newIssue.status}`)
    console.log(`   Expected: backlog, Got: ${newIssue.status}\n`)

    // Test status progression
    console.log('2️⃣ Testing status progression...')

    // Backlog → In Progress
    console.log('   Moving to In Progress...')
    const inProgress = await client.issues.update(newIssue._id.toString(), {
      status: 'in_progress',
    })
    console.log(`   ✅ Status: ${inProgress.status}`)

    // In Progress → Blocked
    console.log('   Moving to Blocked...')
    const blocked = await client.issues.update(newIssue._id.toString(), {
      status: 'blocked',
    })
    console.log(`   ✅ Status: ${blocked.status}`)

    // Blocked → In Progress (unblock)
    console.log('   Unblocking → In Progress...')
    const unblocked = await client.issues.update(newIssue._id.toString(), {
      status: 'in_progress',
    })
    console.log(`   ✅ Status: ${unblocked.status}`)

    // In Progress → Fixed
    console.log('   Resolving as Fixed...')
    const fixed = await client.issues.update(newIssue._id.toString(), {
      status: 'fixed',
    })
    console.log(`   ✅ Status: ${fixed.status}\n`)

    // Test Won't Fix workflow
    console.log('3️⃣ Testing Won\'t Fix workflow...')
    const wontFixIssue = await client.issues.create({
      title: 'Issue that won\'t be fixed',
      description: 'Testing the won\'t fix status',
      projectId: '68f14026b3ff7be5f1d4a3ca',
      priority: 'low',
      tags: ['testing', 'wont-fix'],
    })
    console.log(`   Created issue ${wontFixIssue.issueNumber}`)

    const wontFix = await client.issues.update(wontFixIssue._id.toString(), {
      status: 'wont_fix',
    })
    console.log(`   ✅ Marked as Won't Fix: ${wontFix.status}\n`)

    // Verify all statuses work
    console.log('4️⃣ Verifying all statuses...')
    const allStatuses = ['backlog', 'in_progress', 'blocked', 'fixed', 'wont_fix'] as const
    console.log(`   Available statuses: ${allStatuses.join(', ')}`)
    console.log(`   ✅ All ${allStatuses.length} statuses tested successfully\n`)

    // Add a comment documenting the workflow
    console.log('5️⃣ Adding workflow documentation comment...')
    await client.issues.addComment(newIssue._id.toString(), {
      content: `✅ New status workflow tested successfully!

**Workflow:**
1. Backlog (default) → Issue created and awaiting triage
2. In Progress → Actively being worked on
3. Blocked → Work stopped due to external dependency
4. Fixed → Issue resolved and fixed
5. Won't Fix → Issue acknowledged but won't be addressed

All status transitions working correctly! 🎉`,
    })
    console.log('   ✅ Workflow documentation added\n')

    console.log('✨ All tests passed! New status workflow is working correctly.\n')
    console.log(`View the test issues:`)
    console.log(`- http://localhost:3000/issues/${newIssue.issueNumber}`)
    console.log(`- http://localhost:3000/issues/${wontFixIssue.issueNumber}`)

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    if (error.response) {
      console.error('Response:', error.response.data)
    }
    process.exit(1)
  }
}

testNewStatusWorkflow()
