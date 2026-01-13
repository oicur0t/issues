# Issue Tracker AI Client

**A single-file, portable API client for AI agents to interact with the Issue Tracker.**

Zero dependencies. Just drop `index.ts` into any project and start tracking issues.

## Installation

Copy `index.ts` to your project:

```bash
# Copy to your project
cp ai-client/index.ts your-project/issue-tracker-client.ts
```

## Quick Start

```typescript
import IssueTrackerClient from './issue-tracker-client';

// Initialize
const client = new IssueTrackerClient({
  baseURL: 'http://localhost:3000/api/v1',
  apiKey: 'iak_your_api_key_here'
});

// Create an issue
const issue = await client.issues.create({
  title: 'Fix navigation bug',
  description: 'Users report navigation not working on mobile',
  priority: 'high',
  tags: ['bug', 'mobile', 'goose']
});

// List all issues
const issues = await client.issues.list();

// Filter by tags - get all 'goose' issues
const gooseIssues = await client.issues.list({ tags: ['goose'] });

// Filter by multiple criteria
const claudeBackendIssues = await client.issues.list({
  tags: ['claude', 'backend'],
  status: ['backlog', 'in_progress'],
  priority: ['high']
});

// Update issue status
await client.issues.update(issue._id, { status: 'in_progress' });

// Mark as fixed
await client.issues.update(issue._id, { status: 'fixed' });
```

## AI Agent Usage

### Working on Issues

```typescript
// AI agent workflow: Find and fix high-priority issues
async function workOnIssues() {
  // Get all high-priority backlog issues
  const issues = await client.issues.list({
    status: ['backlog'],
    priority: ['high']
  });

  for (const issue of issues) {
    console.log(`Working on: ${issue.title}`);

    // Update status
    await client.issues.update(issue._id, { status: 'in_progress' });

    // ... do work ...

    // Mark complete
    await client.issues.update(issue._id, { status: 'fixed' });
  }
}

// Filter by AI agent - only work on issues assigned to this agent
async function workOnMyIssues(agentName: 'goose' | 'claude') {
  const myIssues = await client.issues.list({
    tags: [agentName],
    status: ['backlog', 'in_progress']
  });

  for (const issue of myIssues) {
    console.log(`[${agentName}] Working on: ${issue.title}`);
    // ... do work ...
  }
}
```

### Project Management

```typescript
// Create a project for organizing issues
const project = await client.projects.create({
  name: 'Mobile App Redesign',
  key: 'MOBILE',
  description: 'Complete mobile app UI/UX overhaul'
});

// Create issues in the project
await client.issues.create({
  title: 'Design new navigation',
  description: 'Create mockups for new mobile nav',
  priority: 'high',
  projectId: project._id
});
```

### Documentation with Wiki

```typescript
// Create documentation
await client.wiki.create({
  title: 'Getting Started',
  slug: 'getting-started',
  content: '# Getting Started\n\nWelcome to the project...',
  tags: ['documentation', 'onboarding']
});

// Update docs
await client.wiki.update('getting-started', {
  content: '# Getting Started\n\nUpdated content...'
});
```

## Issue Status Workflow

Issues follow this status workflow:

- **`backlog`** (default) - Issue created and awaiting triage
- **`in_progress`** - Actively being worked on
- **`blocked`** - Work stopped due to external dependency
- **`fixed`** - Issue resolved and fixed
- **`wont_fix`** - Issue acknowledged but won't be addressed

```typescript
// Typical workflow
const issue = await client.issues.create({...}); // status: 'backlog'
await client.issues.update(issue._id, { status: 'in_progress' });
await client.issues.update(issue._id, { status: 'fixed' });

// Handle blocked issues
await client.issues.update(issue._id, { status: 'blocked' });
// ... resolve blocker ...
await client.issues.update(issue._id, { status: 'in_progress' });

// Won't fix workflow
await client.issues.update(issue._id, { status: 'wont_fix' });
```

## API Reference

### Issues

- `issues.list()` - Get all issues
- `issues.get(id)` - Get issue by ID
- `issues.create(data)` - Create new issue
- `issues.update(id, data)` - Update issue
- `issues.delete(id)` - Delete issue
- `issues.addComment(id, data)` - Add comment to issue
- `issues.getComments(id)` - Get all comments for an issue

### Projects

- `projects.list()` - Get all projects
- `projects.get(id)` - Get project by ID
- `projects.create(data)` - Create new project
- `projects.update(id, data)` - Update project
- `projects.delete(id)` - Delete project

### Wiki

- `wiki.list()` - Get all wiki pages
- `wiki.get(slug)` - Get page by slug
- `wiki.create(data)` - Create new page
- `wiki.update(slug, data)` - Update page
- `wiki.delete(slug)` - Delete page

## Error Handling

```typescript
try {
  await client.issues.create({ title: 'Test', description: 'Test' });
} catch (error) {
  console.error('Failed to create issue:', error.message);
}
```

## Features

- ✅ **Zero dependencies** - Only uses native fetch()
- ✅ **TypeScript support** - Full type definitions included
- ✅ **Timeout handling** - Configurable request timeouts
- ✅ **Simple API** - Clean, intuitive interface
- ✅ **Portable** - Single file, drop anywhere
- ✅ **AI-friendly** - Designed for AI agent usage

## Configuration

```typescript
const client = new IssueTrackerClient({
  baseURL: 'http://localhost:3000/api/v1',  // API base URL
  apiKey: 'iak_...',                         // Your API key
  timeout: 30000                             // Optional: Request timeout (ms)
});
```

## Getting an API Key

1. Log in to the Issue Tracker
2. Go to Profile page
3. Generate or view your API key
4. Copy and use in your client configuration

## File Size

- **~300 lines** of clean, readable TypeScript
- **~12KB** uncompressed
- **No dependencies** to install

## License

MIT - Use freely in any project
