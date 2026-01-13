import { IssueTrackerClient } from './ai-client/index'

async function testAddComment() {
  const apiKey = process.argv[2]
  const issueId = process.argv[3]

  if (!apiKey || !issueId) {
    console.error('Usage: npx tsx test-add-comment.ts <API_KEY> <ISSUE_ID>')
    console.error('\nExample: npx tsx test-add-comment.ts iak_... 68f1777f224218f406ddef26')
    process.exit(1)
  }

  const client = new IssueTrackerClient({
    baseURL: 'http://localhost:3000/api/v1',
    apiKey: apiKey
  })

  try {
    console.log(`Adding comment to issue ${issueId}...`)

    const comment = await client.issues.addComment(issueId, {
      content: `Testing the comments API!

This comment was posted via the AI client to validate that:
✅ API authentication works
✅ Comment creation works
✅ Comments are properly attributed to the authenticated user

The comments feature is now fully functional!`
    })

    console.log('\n✅ Comment added successfully!')
    console.log(`Comment ID: ${comment._id}`)
    console.log(`Author: ${comment.author?.name || 'Unknown'}`)
    console.log(`Content: ${comment.content.substring(0, 50)}...`)
    console.log(`\nView at: http://localhost:3000/issues/${issueId}`)

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
  }
}

testAddComment()
