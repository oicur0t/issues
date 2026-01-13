#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { IssueTrackerClient } from './client.js';
import type { 
  Issue, 
  Project, 
  User, 
  WikiPage, 
  Comment, 
  CreateIssueData, 
  UpdateIssueData, 
  CreateProjectData, 
  UpdateProjectData, 
  CreateWikiData, 
  UpdateWikiData, 
  CreateCommentData, 
  UpdateCommentData, 
  IssueFilter, 
  WikiFilter 
} from './types.js';

// Get configuration from environment variables
const config = {
  baseURL: process.env.ISSUE_TRACKER_BASE_URL || 'http://localhost:3000/api/v1',
  apiKey: process.env.ISSUE_TRACKER_API_KEY || '',
  timeout: parseInt(process.env.ISSUE_TRACKER_TIMEOUT || '30000')
};

if (!config.apiKey) {
  console.error('ERROR: ISSUE_TRACKER_API_KEY environment variable is required');
  process.exit(1);
}

// Create client
const client = new IssueTrackerClient(config);

// Create MCP server
const server = new McpServer({
  name: 'issue-tracker-mcp-server',
  version: '1.0.0'
});

// ============================================================================
// ISSUES TOOLS
// ============================================================================

// List Issues
server.tool(
  'list_issues',
  'List all issues with optional filtering. Supports filtering by project, status, priority, assignee, reporter, tags, and search.',
  {
    projectId: z.string().optional().describe('Filter by project ID'),
    status: z.array(z.enum(['backlog', 'in_progress', 'blocked', 'fixed', 'wont_fix'])).optional().describe('Filter by status'),
    priority: z.array(z.enum(['low', 'medium', 'high', 'critical'])).optional().describe('Filter by priority'),
    assigneeId: z.string().optional().describe('Filter by assignee ID'),
    reporterId: z.string().optional().describe('Filter by reporter ID'),
    tags: z.array(z.string()).optional().describe('Filter by tags'),
    search: z.string().optional().describe('Search in title and description')
  },
  async ({ projectId, status, priority, assigneeId, reporterId, tags, search }) => {
    try {
      const filter: IssueFilter = {};
      if (projectId) filter.projectId = projectId;
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (assigneeId) filter.assigneeId = assigneeId;
      if (reporterId) filter.reporterId = reporterId;
      if (tags) filter.tags = tags;
      if (search) filter.search = search;

      const issues = await client.listIssues(filter);
      
      return {
        content: [{
          type: 'text',
          text: `Found ${issues.length} issues:\n\n${issues.map(issue =>
            `${issue.issueNumber}: ${issue.title}\n` +
            `  Status: ${issue.status} | Priority: ${issue.priority}\n` +
            `  Project: ${issue.project?.name || 'Unknown'} (${issue.projectId})\n` +
            `  Tags: ${issue.tags?.join(', ') || 'None'}\n` +
            `  Created: ${issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Unknown'}\n` +
            `  ID: ${issue._id}\n`
          ).join('\n')}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing issues: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Get Issue
server.tool(
  'get_issue',
  'Get detailed information about a specific issue by ID',
  {
    issueId: z.string().describe('The ID of the issue to retrieve')
  },
  async ({ issueId }) => {
    try {
      const issue = await client.getIssue(issueId);
      
      return {
        content: [{
          type: 'text',
          text: `Issue Details:\n\n` +
            `${issue.issueNumber}: ${issue.title}\n` +
            `Status: ${issue.status}\n` +
            `Priority: ${issue.priority}\n` +
            `Project: ${issue.project?.name || 'Unknown'} (${issue.projectId})\n` +
            `Assignee: ${issue.assignee?.name || 'Unassigned'}\n` +
            `Reporter: ${issue.reporter?.name || 'Unknown'}\n` +
            `Tags: ${issue.tags?.join(', ') || 'None'}\n` +
            `Created: ${issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Unknown'}\n` +
            `Updated: ${issue.updatedAt ? new Date(issue.updatedAt).toLocaleDateString() : 'Unknown'}\n` +
            `${issue.dueDate ? `Due: ${new Date(issue.dueDate).toLocaleDateString()}\n` : ''}\n\n` +
            `Description:\n${issue.description}\n\n` +
            `ID: ${issue._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting issue: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Create Issue
server.tool(
  'create_issue',
  'Create a new issue in the specified project',
  {
    projectId: z.string().describe('The ID of the project to create the issue in'),
    title: z.string().describe('The title of the issue'),
    description: z.string().describe('Detailed description of the issue'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Priority level (default: medium)'),
    assigneeId: z.string().optional().describe('ID of the user to assign the issue to'),
    tags: z.array(z.string()).optional().describe('Tags to categorize the issue'),
    dueDate: z.string().optional().describe('Due date in ISO format')
  },
  async ({ projectId, title, description, priority, assigneeId, tags, dueDate }) => {
    try {
      const data: CreateIssueData = {
        projectId,
        title,
        description,
        priority: priority || 'medium',
        assigneeId,
        tags: tags || [],
        dueDate: dueDate
      };

      const issue = await client.createIssue(data);
      
      return {
        content: [{
          type: 'text',
          text: `Issue created successfully!\n\n` +
            `${issue.issueNumber}: ${issue.title}\n` +
            `Status: ${issue.status}\n` +
            `Priority: ${issue.priority}\n` +
            `ID: ${issue._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating issue: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Update Issue
server.tool(
  'update_issue',
  'Update an existing issue with new information',
  {
    issueId: z.string().describe('The ID of the issue to update'),
    title: z.string().optional().describe('New title for the issue'),
    description: z.string().optional().describe('New description for the issue'),
    status: z.enum(['backlog', 'in_progress', 'blocked', 'fixed', 'wont_fix']).optional().describe('New status for the issue'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('New priority for the issue'),
    assigneeId: z.string().optional().describe('New assignee ID'),
    tags: z.array(z.string()).optional().describe('New tags for the issue'),
    dueDate: z.string().optional().describe('New due date in ISO format')
  },
  async ({ issueId, title, description, status, priority, assigneeId, tags, dueDate }) => {
    try {
      const data: UpdateIssueData = {};
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (status !== undefined) data.status = status;
      if (priority !== undefined) data.priority = priority;
      if (assigneeId !== undefined) data.assigneeId = assigneeId;
      if (tags !== undefined) data.tags = tags;
      if (dueDate !== undefined) data.dueDate = dueDate;

      const issue = await client.updateIssue(issueId, data);
      
      return {
        content: [{
          type: 'text',
          text: `Issue updated successfully!\n\n` +
            `${issue.issueNumber}: ${issue.title}\n` +
            `Status: ${issue.status}\n` +
            `Priority: ${issue.priority}\n` +
            `ID: ${issue._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error updating issue: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Delete Issue
server.tool(
  'delete_issue',
  'Delete an issue permanently',
  {
    issueId: z.string().describe('The ID of the issue to delete')
  },
  async ({ issueId }) => {
    try {
      await client.deleteIssue(issueId);
      
      return {
        content: [{
          type: 'text',
          text: `Issue ${issueId} deleted successfully!`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error deleting issue: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Get Issue Comments
server.tool(
  'get_issue_comments',
  'Get all comments for a specific issue',
  {
    issueId: z.string().describe('The ID of the issue to get comments for')
  },
  async ({ issueId }) => {
    try {
      const comments = await client.getIssueComments(issueId);
      
      if (comments.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No comments found for issue ${issueId}`
          }]
        };
      }
      
      return {
        content: [{
          type: 'text',
          text: `Comments for issue ${issueId}:\n\n${comments.map(comment =>
            `${comment.author?.name || 'Unknown'} - ${comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Unknown'}\n` +
            `${comment.content}\n` +
            `ID: ${comment._id}\n`
          ).join('\n')}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting issue comments: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Add Issue Comment
server.tool(
  'add_issue_comment',
  'Add a comment to an issue',
  {
    issueId: z.string().describe('The ID of the issue to comment on'),
    content: z.string().describe('The comment content')
  },
  async ({ issueId, content }) => {
    try {
      const comment = await client.addIssueComment(issueId, { issueId, content });
      
      return {
        content: [{
          type: 'text',
          text: `Comment added successfully!\n\n` +
            `${comment.author?.name || 'Unknown'} - ${comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Unknown'}\n` +
            `${comment.content}\n` +
            `ID: ${comment._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error adding comment: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// ============================================================================
// PROJECTS TOOLS
// ============================================================================

// List Projects
server.tool(
  'list_projects',
  'List all available projects',
  {},
  async () => {
    try {
      const projects = await client.listProjects();
      
      return {
        content: [{
          type: 'text',
          text: `Found ${projects.length} projects:\n\n${projects.map(project =>
            `${project.name} (${project.key})\n` +
            `  Description: ${project.description}\n` +
            `  Created: ${project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown'}\n` +
            `  Issues: ${project.issueCounter}\n` +
            `  ID: ${project._id}\n`
          ).join('\n')}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing projects: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Get Project
server.tool(
  'get_project',
  'Get detailed information about a specific project',
  {
    projectId: z.string().describe('The ID of the project to retrieve')
  },
  async ({ projectId }) => {
    try {
      const project = await client.getProject(projectId);
      
      return {
        content: [{
          type: 'text',
          text: `Project Details:\n\n` +
            `${project.name} (${project.key})\n` +
            `Description: ${project.description}\n` +
            `Created: ${project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown'}\n` +
            `Updated: ${project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'Unknown'}\n` +
            `Issues: ${project.issueCounter}\n` +
            `Creator: ${project.creator?.name || 'Unknown'}\n` +
            `ID: ${project._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting project: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Create Project
server.tool(
  'create_project',
  'Create a new project',
  {
    name: z.string().describe('The name of the project'),
    key: z.string().describe('The project key (e.g., "WEB", "MOBILE")'),
    description: z.string().describe('Description of the project')
  },
  async ({ name, key, description }) => {
    try {
      const data: CreateProjectData = { name, key, description };
      const project = await client.createProject(data);
      
      return {
        content: [{
          type: 'text',
          text: `Project created successfully!\n\n` +
            `${project.name} (${project.key})\n` +
            `Description: ${project.description}\n` +
            `ID: ${project._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating project: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Update Project
server.tool(
  'update_project',
  'Update an existing project',
  {
    projectId: z.string().describe('The ID of the project to update'),
    name: z.string().optional().describe('New name for the project'),
    key: z.string().optional().describe('New key for the project'),
    description: z.string().optional().describe('New description for the project')
  },
  async ({ projectId, name, key, description }) => {
    try {
      const data: UpdateProjectData = {};
      if (name !== undefined) data.name = name;
      if (key !== undefined) data.key = key;
      if (description !== undefined) data.description = description;

      const project = await client.updateProject(projectId, data);
      
      return {
        content: [{
          type: 'text',
          text: `Project updated successfully!\n\n` +
            `${project.name} (${project.key})\n` +
            `Description: ${project.description}\n` +
            `ID: ${project._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error updating project: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Delete Project
server.tool(
  'delete_project',
  'Delete a project permanently',
  {
    projectId: z.string().describe('The ID of the project to delete')
  },
  async ({ projectId }) => {
    try {
      await client.deleteProject(projectId);
      
      return {
        content: [{
          type: 'text',
          text: `Project ${projectId} deleted successfully!`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error deleting project: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// ============================================================================
// USERS TOOLS
// ============================================================================

// List Users
server.tool(
  'list_users',
  'List all users in the system',
  {},
  async () => {
    try {
      const users = await client.listUsers();
      
      return {
        content: [{
          type: 'text',
          text: `Found ${users.length} users:\n\n${users.map(user =>
            `${user.name}\n` +
            `  Email: ${user.email}\n` +
            `  Role: ${user.role}\n` +
            `  Status: ${user.isActive ? 'Active' : 'Inactive'}\n` +
            `  Created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}\n` +
            `  ID: ${user._id}\n`
          ).join('\n')}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing users: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Get User
server.tool(
  'get_user',
  'Get detailed information about a specific user',
  {
    userId: z.string().describe('The ID of the user to retrieve')
  },
  async ({ userId }) => {
    try {
      const user = await client.getUser(userId);
      
      return {
        content: [{
          type: 'text',
          text: `User Details:\n\n` +
            `${user.name}\n` +
            `Email: ${user.email}\n` +
            `Role: ${user.role}\n` +
            `Status: ${user.isActive ? 'Active' : 'Inactive'}\n` +
            `Created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}\n` +
            `${user.lastLoginAt ? `Last Login: ${new Date(user.lastLoginAt).toLocaleDateString()}\n` : ''}` +
            `ID: ${user._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting user: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// ============================================================================
// WIKI TOOLS
// ============================================================================

// List Wiki Pages
server.tool(
  'list_wiki_pages',
  'List all wiki pages with optional filtering',
  {
    tags: z.array(z.string()).optional().describe('Filter by tags'),
    authorId: z.string().optional().describe('Filter by author ID'),
    isPublished: z.boolean().optional().describe('Filter by published status'),
    search: z.string().optional().describe('Search in title and content')
  },
  async ({ tags, authorId, isPublished, search }) => {
    try {
      const filter: WikiFilter = {};
      if (tags) filter.tags = tags;
      if (authorId) filter.authorId = authorId;
      if (isPublished !== undefined) filter.isPublished = isPublished;
      if (search) filter.search = search;

      const pages = await client.listWikiPages(filter);
      
      return {
        content: [{
          type: 'text',
          text: `Found ${pages.length} wiki pages:\n\n${pages.map(page =>
            `${page.title} (${page.slug})\n` +
            `  Author: ${page.author?.name || 'Unknown'}\n` +
            `  Published: ${page.isPublished ? 'Yes' : 'No'}\n` +
            `  Tags: ${page.tags?.join(', ') || 'None'}\n` +
            `  Updated: ${page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : 'Unknown'}\n` +
            `  ID: ${page._id}\n`
          ).join('\n')}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing wiki pages: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Get Wiki Page
server.tool(
  'get_wiki_page',
  'Get a specific wiki page by slug',
  {
    slug: z.string().describe('The slug of the wiki page to retrieve')
  },
  async ({ slug }) => {
    try {
      const page = await client.getWikiPage(slug);
      
      return {
        content: [{
          type: 'text',
          text: `Wiki Page: ${page.title}\n\n` +
            `Author: ${page.author?.name || 'Unknown'}\n` +
            `Published: ${page.isPublished ? 'Yes' : 'No'}\n` +
            `Tags: ${page.tags?.join(', ') || 'None'}\n` +
            `Created: ${page.createdAt ? new Date(page.createdAt).toLocaleDateString() : 'Unknown'}\n` +
            `Updated: ${page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : 'Unknown'}\n\n` +
            `${page.summary ? `Summary: ${page.summary}\n\n` : ''}` +
            `Content:\n${page.content}\n\n` +
            `ID: ${page._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting wiki page: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Create Wiki Page
server.tool(
  'create_wiki_page',
  'Create a new wiki page',
  {
    title: z.string().describe('The title of the wiki page'),
    slug: z.string().describe('The URL slug for the wiki page'),
    content: z.string().describe('The content of the wiki page'),
    summary: z.string().optional().describe('A brief summary of the page'),
    tags: z.array(z.string()).optional().describe('Tags to categorize the page'),
    isPublished: z.boolean().optional().describe('Whether the page should be published (default: true)')
  },
  async ({ title, slug, content, summary, tags, isPublished }) => {
    try {
      const data: CreateWikiData = {
        title,
        content,
        summary,
        tags: tags || [],
        isPublished: isPublished !== undefined ? isPublished : true
      };
      // Note: The API will extract slug from the data or use title to generate one
      const page = await client.createWikiPage(data);
      
      return {
        content: [{
          type: 'text',
          text: `Wiki page created successfully!\n\n` +
            `${page.title} (${page.slug})\n` +
            `Published: ${page.isPublished ? 'Yes' : 'No'}\n` +
            `ID: ${page._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating wiki page: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Update Wiki Page
server.tool(
  'update_wiki_page',
  'Update an existing wiki page',
  {
    slug: z.string().describe('The slug of the wiki page to update'),
    title: z.string().optional().describe('New title for the page'),
    content: z.string().optional().describe('New content for the page'),
    summary: z.string().optional().describe('New summary for the page'),
    tags: z.array(z.string()).optional().describe('New tags for the page'),
    isPublished: z.boolean().optional().describe('New published status')
  },
  async ({ slug, title, content, summary, tags, isPublished }) => {
    try {
      const data: UpdateWikiData = {};
      if (title !== undefined) data.title = title;
      if (content !== undefined) data.content = content;
      if (summary !== undefined) data.summary = summary;
      if (tags !== undefined) data.tags = tags;
      if (isPublished !== undefined) data.isPublished = isPublished;

      const page = await client.updateWikiPage(slug, data);
      
      return {
        content: [{
          type: 'text',
          text: `Wiki page updated successfully!\n\n` +
            `${page.title} (${page.slug})\n` +
            `Published: ${page.isPublished ? 'Yes' : 'No'}\n` +
            `ID: ${page._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error updating wiki page: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Delete Wiki Page
server.tool(
  'delete_wiki_page',
  'Delete a wiki page permanently',
  {
    slug: z.string().describe('The slug of the wiki page to delete')
  },
  async ({ slug }) => {
    try {
      await client.deleteWikiPage(slug);
      
      return {
        content: [{
          type: 'text',
          text: `Wiki page "${slug}" deleted successfully!`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error deleting wiki page: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// ============================================================================
// RESOURCES
// ============================================================================

server.resource(
  'issues',
  'issue://',
  async (uri) => {
    try {
      const issueId = uri.pathname.split('/').pop();
      if (!issueId) {
        throw new Error('Invalid issue ID in URI');
      }

      const issue = await client.getIssue(issueId);
      const content = JSON.stringify(issue, null, 2);
      
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: content
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/plain',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

server.resource(
  'projects',
  'project://',
  async (uri) => {
    try {
      const projectId = uri.pathname.split('/').pop();
      if (!projectId) {
        throw new Error('Invalid project ID in URI');
      }

      const project = await client.getProject(projectId);
      const content = JSON.stringify(project, null, 2);
      
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: content
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/plain',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

server.resource(
  'wiki',
  'wiki://',
  async (uri) => {
    try {
      const slug = uri.pathname.split('/').pop();
      if (!slug) {
        throw new Error('Invalid wiki slug in URI');
      }

      const page = await client.getWikiPage(slug);
      const content = JSON.stringify(page, null, 2);
      
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: content
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/plain',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// ============================================================================
// START SERVER
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Issue Tracker MCP Server started successfully');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
