import { IssueTrackerClient } from './ai-client/index'

async function testCreateIssue() {
  const apiKey = process.argv[2]
  
  if (!apiKey) {
    console.error('Usage: npx tsx test-api.ts <API_KEY>')
    console.error('\nYou can find your API key at http://localhost:3000/profile')
    process.exit(1)
  }

  // Initialize client
  const client = new IssueTrackerClient({
    baseURL: 'http://localhost:3000/api/v1',
    apiKey: apiKey
  })

  try {
    // Get the 'Issues' project
    console.log('Fetching projects...')
    const projects = await client.projects.list()
    console.log('Projects response:', typeof projects, Array.isArray(projects), projects)
    const issuesProject = projects.find(p => p.key === 'ISS')
    
    if (!issuesProject) {
      console.error('Could not find Issues project with key ISS')
      console.error('Available projects:', projects.map(p => `${p.name} (${p.key})`).join(', '))
      return
    }

    console.log(`Found project: ${issuesProject.name} (${issuesProject.key})`)

    // Create the meta issue
    console.log('\nCreating issue...')
    const issue = await client.issues.create({
      title: 'Test AI API Client by Creating This Issue',
      description: `This issue documents the process of testing the AI client API functionality.

## Steps Taken:
1. Read the AI client implementation to understand the API
2. Created a test script (test-api.ts) to interact with the API
3. Retrieved the 'Issues' project using the projects.list() method
4. Created this issue using the issues.create() method with the following data:
   - Title describing the meta nature of the task
   - Description documenting the testing process
   - Project ID linking to the 'Issues' project
   - Priority set to 'medium'
   - Tags including 'testing' and 'claude'
   - Status defaults to 'open' per API design

## Purpose:
Validate that the AI client can successfully:
- Connect to the API with proper authentication
- Retrieve project information
- Create issues with proper metadata
- Apply tags for filtering

## Result:
If you're reading this, the test was successful!`,
      projectId: issuesProject._id,
      priority: 'medium',
      tags: ['testing', 'claude']
    })

    console.log('\n✅ Successfully created issue!')
    console.log(`Issue ID: ${issue._id}`)
    console.log(`Issue Key: ${issue.issueNumber}`)
    console.log(`Title: ${issue.title}`)
    console.log(`Tags: ${issue.tags?.join(', ') || 'none'}`)
    console.log(`\nView at: http://localhost:3000/issues/${issue._id}`)

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
  }
}

testCreateIssue()
