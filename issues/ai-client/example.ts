/**
 * Example usage of the Issue Tracker AI Client
 *
 * This demonstrates how AI agents can use the client to manage issues,
 * projects, and documentation in your development workflow.
 */

import IssueTrackerClient from './index';

// ============================================================================
// Setup
// ============================================================================

const client = new IssueTrackerClient({
  baseURL: process.env.ISSUE_TRACKER_URL || 'http://localhost:3000/api/v1',
  apiKey: process.env.ISSUE_TRACKER_API_KEY || 'iak_your_api_key_here',
  timeout: 30000
});

// ============================================================================
// Example 1: AI Agent Working on Issues
// ============================================================================

async function aiAgentWorkflow() {
  console.log('🤖 AI Agent: Starting work session...\n');

  // Get all issues
  const issues = await client.issues.list();
  console.log(`Found ${issues.length} total issues`);

  // Find high-priority open issues
  const highPriorityIssues = issues.filter(
    issue => issue.priority === 'high' && issue.status === 'backlog'
  );

  console.log(`Found ${highPriorityIssues.length} high-priority open issues\n`);

  // Work on each issue
  for (const issue of highPriorityIssues) {
    console.log(`📋 Working on: ${issue.title} (${issue.issueNumber})`);

    // Update status to in_progress
    await client.issues.update(issue._id, { status: 'in_progress' });
    console.log('   → Status: in_progress');

    // Simulate work...
    console.log('   → Analyzing issue...');
    console.log('   → Implementing fix...');
    console.log('   → Testing solution...');

    // Mark as closed
    await client.issues.update(issue._id, { status: 'fixed' });
    console.log('   → Status: closed ✓\n');
  }

  console.log('✅ All high-priority issues resolved!\n');
}

// ============================================================================
// Example 2: Project-Based Development
// ============================================================================

async function projectDevelopment() {
  console.log('🚀 Starting new project...\n');

  // Create a project
  const project = await client.projects.create({
    name: 'Mobile App Redesign',
    key: 'MOBILE',
    description: 'Complete mobile app UI/UX overhaul'
  });

  console.log(`Created project: ${project.name} (${project.key})`);

  // Create issues for the project
  const tasks = [
    { title: 'Design new navigation', priority: 'high' as const },
    { title: 'Implement dark mode', priority: 'medium' as const },
    { title: 'Optimize image loading', priority: 'high' as const },
    { title: 'Add accessibility features', priority: 'medium' as const }
  ];

  console.log(`\nCreating ${tasks.length} tasks...\n`);

  for (const task of tasks) {
    const issue = await client.issues.create({
      title: task.title,
      description: `Project: ${project.name}`,
      priority: task.priority,
      projectId: project._id,
      tags: ['mobile', 'redesign']
    });
    console.log(`✓ Created: ${issue.issueNumber} - ${issue.title}`);
  }

  console.log('\n✅ Project setup complete!\n');
}

// ============================================================================
// Example 3: Documentation Management
// ============================================================================

async function documentationWorkflow() {
  console.log('📚 Managing documentation...\n');

  // Create a getting started guide
  const guide = await client.wiki.create({
    title: 'Getting Started',
    slug: 'getting-started',
    content: `# Getting Started

## Installation

\`\`\`bash
npm install
\`\`\`

## Configuration

Create a \`.env\` file with your settings.

## Running the App

\`\`\`bash
npm run dev
\`\`\`
`,
    summary: 'Quick start guide for new developers',
    tags: ['documentation', 'onboarding']
  });

  console.log(`✓ Created: ${guide.title}`);

  // Create API documentation
  const apiDocs = await client.wiki.create({
    title: 'API Documentation',
    slug: 'api-docs',
    content: `# API Documentation

## Authentication

All API requests require an API key...

## Endpoints

### Issues
- GET /api/v1/issues
- POST /api/v1/issues
...
`,
    summary: 'Complete API reference',
    tags: ['documentation', 'api']
  });

  console.log(`✓ Created: ${apiDocs.title}`);
  console.log('\n✅ Documentation updated!\n');
}

// ============================================================================
// Example 4: Monitoring and Reporting
// ============================================================================

async function generateReport() {
  console.log('📊 Generating project report...\n');

  const [issues, projects] = await Promise.all([
    client.issues.list(),
    client.projects.list()
  ]);

  // Calculate statistics
  const stats = {
    totalIssues: issues.length,
    openIssues: issues.filter(i => i.status === 'backlog').length,
    inProgressIssues: issues.filter(i => i.status === 'in_progress').length,
    closedIssues: issues.filter(i => i.status === 'fixed').length,
    highPriority: issues.filter(i => i.priority === 'high').length,
    criticalPriority: issues.filter(i => i.priority === 'critical').length,
    totalProjects: projects.length
  };

  console.log('=== PROJECT HEALTH REPORT ===\n');
  console.log(`Total Projects: ${stats.totalProjects}`);
  console.log(`Total Issues: ${stats.totalIssues}`);
  console.log(`  Open: ${stats.openIssues}`);
  console.log(`  In Progress: ${stats.inProgressIssues}`);
  console.log(`  Closed: ${stats.closedIssues}`);
  console.log(`\nPriority Breakdown:`);
  console.log(`  High: ${stats.highPriority}`);
  console.log(`  Critical: ${stats.criticalPriority}`);
  console.log('\n==============================\n');
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  try {
    // Uncomment the example you want to run:

    // await aiAgentWorkflow();
    // await projectDevelopment();
    // await documentationWorkflow();
    await generateReport();

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { aiAgentWorkflow, projectDevelopment, documentationWorkflow, generateReport };
