#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { IssueTrackerClient } from './client.js';
import { formatAsset } from './format.js';
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
  WikiFilter,
  Feature,
  CreateFeatureData,
  UpdateFeatureData,
  FeatureFilter,
  Asset,
  CreateAssetData,
  UpdateAssetData,
  AssetFilter
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
    featureId: z.string().optional().describe('Filter by feature (ID or number like CUS-F001)'),
    tags: z.array(z.string()).optional().describe('Filter by tags'),
    search: z.string().optional().describe('Search in title and description')
  },
  async ({ projectId, status, priority, assigneeId, reporterId, featureId, tags, search }) => {
    try {
      const filter: IssueFilter = {};
      if (projectId) filter.projectId = projectId;
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (assigneeId) filter.assigneeId = assigneeId;
      if (reporterId) filter.reporterId = reporterId;
      if (featureId) filter.featureId = featureId;
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
            (issue.claimer ? `  Claimed by: ${issue.claimer.name}${issue.claimExpired ? ' (expired)' : ''}\n` : '') +
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
            (issue.claimer ? `Claimed by: ${issue.claimer.name}${issue.claimExpired ? ' (claim expired)' : ''}\n` : '') +
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
    featureId: z.string().optional().describe('Feature to link the issue to (ID or number like CUS-F001)'),
    dueDate: z.string().optional().describe('Due date in ISO format')
  },
  async ({ projectId, title, description, priority, assigneeId, tags, featureId, dueDate }) => {
    try {
      const data: CreateIssueData = {
        projectId,
        title,
        description,
        priority: priority || 'medium',
        assigneeId,
        tags: tags || [],
        featureId,
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
    assigneeId: z.string().nullable().optional().describe('New assignee ID; null unassigns'),
    tags: z.array(z.string()).optional().describe('New tags for the issue'),
    featureId: z.string().nullable().optional().describe('Feature to link to (ID or number like CUS-F001); null unlinks'),
    dueDate: z.string().optional().describe('New due date in ISO format')
  },
  async ({ issueId, title, description, status, priority, assigneeId, tags, featureId, dueDate }) => {
    try {
      const data: UpdateIssueData = {};
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (status !== undefined) data.status = status;
      if (priority !== undefined) data.priority = priority;
      if (assigneeId !== undefined) data.assigneeId = assigneeId;
      if (tags !== undefined) data.tags = tags;
      if (featureId !== undefined) data.featureId = featureId;
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
// WORK CLAIMING TOOLS
// ============================================================================

function formatClaimedIssue(issue: Issue): string {
  return `${issue.issueNumber}: ${issue.title}\n` +
    `Status: ${issue.status} | Priority: ${issue.priority}\n` +
    `Project: ${issue.project?.name || 'Unknown'} (${issue.projectId})\n` +
    (issue.featureId ? `Feature: ${issue.featureId}\n` : '') +
    `Tags: ${issue.tags?.join(', ') || 'None'}\n\n` +
    `Description:\n${issue.description}\n\n` +
    `ID: ${issue._id}`;
}

// Get Next Work
server.tool(
  'get_next_work',
  'Get the next issue to work on: highest priority, oldest first, from the backlog (or abandoned in-progress work whose claim expired). ' +
    'By default it CLAIMS the issue for you (moves it to in_progress, assigns it to you if unassigned) so no other agent picks it up. ' +
    'Set claim=false to just peek. Claims expire after a few hours; call claim_issue on the same issue to refresh. ' +
    'Returns a message instead of an issue when nothing is available.',
  {
    projectId: z.string().optional().describe('Only consider issues in this project'),
    featureId: z.string().optional().describe('Only consider issues linked to this feature (ID or number like CUS-F001)'),
    claim: z.boolean().optional().describe('Claim the issue for yourself (default: true). Use false to only look.')
  },
  async ({ projectId, featureId, claim }) => {
    try {
      const shouldClaim = claim !== false;
      const issue = await client.getNextWork({ projectId, featureId, claim: shouldClaim });

      if (!issue) {
        return {
          content: [{
            type: 'text',
            text: 'No work available: no unclaimed backlog issues match.'
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `${shouldClaim ? 'Claimed' : 'Next up (not claimed)'}:\n\n${formatClaimedIssue(issue)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting next work: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Claim Issue
server.tool(
  'claim_issue',
  'Claim a specific issue so other agents do not work on it. Fails if someone else holds a live claim. ' +
    'Moves a backlog issue to in_progress and assigns it to you if unassigned. ' +
    'Claiming an issue you already hold refreshes the claim, which expires after a few hours.',
  {
    issueId: z.string().describe('The ID or number (e.g. CUS-001) of the issue to claim')
  },
  async ({ issueId }) => {
    try {
      const issue = await client.claimIssue(issueId);

      return {
        content: [{
          type: 'text',
          text: `Claimed:\n\n${formatClaimedIssue(issue)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error claiming issue: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Release Issue
server.tool(
  'release_issue',
  'Release your claim on an issue without closing it (e.g. you are blocked or stopping). ' +
    'Status and assignee are left unchanged. Closing an issue (fixed / wont_fix) releases the claim automatically.',
  {
    issueId: z.string().describe('The ID or number (e.g. CUS-001) of the issue to release')
  },
  async ({ issueId }) => {
    try {
      const issue = await client.releaseIssue(issueId);

      return {
        content: [{
          type: 'text',
          text: `Released ${issue.issueNumber}: ${issue.title} (status: ${issue.status})`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error releasing issue: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Get My Work
server.tool(
  'get_my_work',
  'List the open issues that are assigned to you or that you have claimed, so you can resume after a restart. ' +
    'Closed issues (fixed / wont_fix) are excluded. Shows whether each claim is still live or has expired; ' +
    'call claim_issue on an issue to refresh a live claim or re-take an expired one.',
  {
    projectId: z.string().optional().describe('Only issues in this project'),
    featureId: z.string().optional().describe('Only issues linked to this feature (ID or number like CUS-F001)')
  },
  async ({ projectId, featureId }) => {
    try {
      const filter: IssueFilter = { mine: true };
      if (projectId) filter.projectId = projectId;
      if (featureId) filter.featureId = featureId;

      const issues = await client.listIssues(filter);

      if (issues.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'You have no open assigned or claimed issues.'
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `You have ${issues.length} open issues:\n\n${issues.map(issue =>
            `${issue.issueNumber}: ${issue.title}\n` +
            `  Status: ${issue.status} | Priority: ${issue.priority}\n` +
            `  Claim: ${issue.claimer ? (issue.claimExpired ? 'expired' : 'live') : 'none'}\n` +
            (issue.featureId ? `  Feature: ${issue.featureId}\n` : '') +
            `  ID: ${issue._id}\n`
          ).join('\n')}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting your work: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// ============================================================================
// ASSETS TOOLS
// ============================================================================

const assetStatusEnum = z.enum(['active', 'maintenance', 'decommissioned', 'removed']);
const accountsSchema = z.array(z.object({ key: z.string(), value: z.string() })).optional()
  .describe('Account NAMES only, e.g. {key: "Runs as", value: "root via sudo podman"}. NEVER store passwords, keys or tokens.');
const customFieldsSchema = z.array(z.object({ key: z.string(), value: z.string() })).optional()
  .describe('Free-form key/value fields, e.g. {key: "Serial number", value: "C02XYZ"}. NEVER store passwords, keys or tokens.');
const assetProjectsSchema = z.array(z.object({ projectId: z.string(), role: z.string() })).optional()
  .describe('Projects this asset serves, each with the role it plays (e.g. "Production server")');

// List Assets
server.tool(
  'list_assets',
  'List infrastructure assets (hosts, containers, pods, integrations) with optional filtering by type, status, project, tags, provider, location, or search.',
  {
    type: z.array(z.string()).optional().describe('Filter by type, e.g. ["host", "container"]'),
    status: z.array(assetStatusEnum).optional().describe('Filter by status'),
    projectId: z.string().optional().describe('Filter by project ID'),
    tags: z.array(z.string()).optional().describe('Filter by tags'),
    provider: z.string().optional().describe('Filter by provider, e.g. "AWS"'),
    location: z.string().optional().describe('Filter by location'),
    search: z.string().optional().describe('Search name, hostname, description and IPs')
  },
  async ({ type, status, projectId, tags, provider, location, search }) => {
    try {
      const filter: AssetFilter = {};
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (projectId) filter.projectId = projectId;
      if (tags) filter.tags = tags;
      if (provider) filter.provider = provider;
      if (location) filter.location = location;
      if (search) filter.search = search;

      const assets = await client.listAssets(filter);

      return {
        content: [{
          type: 'text',
          text: `Found ${assets.length} assets:\n\n${assets.map(a => `${formatAsset(a)}  ID: ${a._id}\n`).join('\n')}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing assets: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Get Asset
server.tool(
  'get_asset',
  'Get full details of an asset by ID, including accounts, projects and any phone-home system info',
  {
    assetId: z.string().describe('The ID of the asset')
  },
  async ({ assetId }) => {
    try {
      const asset = await client.getAsset(assetId);

      return {
        content: [{
          type: 'text',
          text: `Asset Details:\n\n${formatAsset(asset)}` +
            (asset.vendorUrl ? `  Vendor URL: ${asset.vendorUrl}\n` : '') +
            (asset.accounts?.length ? `  Accounts: ${asset.accounts.map(a => `${a.key}: ${a.value}`).join('; ')}\n` : '') +
            (asset.customFields?.length ? `  Custom fields: ${asset.customFields.map(f => `${f.key}: ${f.value}`).join('; ')}\n` : '') +
            (asset.description ? `\nDescription:\n${asset.description}\n` : '') +
            (asset.systemInfo ? `\nSystem info:\n${JSON.stringify(asset.systemInfo, null, 2)}\n` : '') +
            `\nID: ${asset._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting asset: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Create Asset
server.tool(
  'create_asset',
  'Create a new infrastructure asset. Type is free-form (host, container, pod, integration, ...).',
  {
    name: z.string().describe('Asset name, e.g. "production-web-01"'),
    type: z.string().describe('Asset type. The Assets page groups by: "physical server", "virtual server", "desktop", "laptop", "device" (in that order); other values like "container" or "pod" also work'),
    status: assetStatusEnum.describe('Asset status'),
    hostname: z.string().optional().describe('Hostname'),
    ipAddresses: z.array(z.string()).optional().describe('IP addresses'),
    os: z.string().optional().describe('Operating system'),
    provider: z.string().optional().describe('Provider, e.g. "AWS", "On-Prem"'),
    location: z.string().optional().describe('Location, e.g. "us-east-1"'),
    cost: z.number().optional().describe('Monthly/annual cost'),
    vendorUrl: z.string().optional().describe('Link to the vendor/provider portal'),
    accounts: accountsSchema,
    customFields: customFieldsSchema,
    description: z.string().optional().describe('Notes about the asset'),
    projects: assetProjectsSchema,
    tags: z.array(z.string()).optional().describe('Tags')
  },
  async (args) => {
    try {
      const data: CreateAssetData = { ...args };
      const asset = await client.createAsset(data);

      return {
        content: [{
          type: 'text',
          text: `Asset created successfully!\n\n${formatAsset(asset)}  ID: ${asset._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating asset: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Update Asset
server.tool(
  'update_asset',
  'Update an existing asset. Only the fields you pass change; arrays (ipAddresses, accounts, projects, tags) are replaced wholesale.',
  {
    assetId: z.string().describe('The ID of the asset to update'),
    name: z.string().optional().describe('New name'),
    type: z.string().optional().describe('New type'),
    status: assetStatusEnum.optional().describe('New status'),
    hostname: z.string().optional().describe('New hostname'),
    ipAddresses: z.array(z.string()).optional().describe('Replacement list of IP addresses'),
    os: z.string().optional().describe('New operating system'),
    provider: z.string().optional().describe('New provider'),
    location: z.string().optional().describe('New location'),
    cost: z.number().nullable().optional().describe('New cost; null clears it'),
    vendorUrl: z.string().optional().describe('New vendor URL'),
    accounts: accountsSchema,
    customFields: customFieldsSchema,
    description: z.string().optional().describe('New notes'),
    projects: assetProjectsSchema,
    tags: z.array(z.string()).optional().describe('Replacement list of tags')
  },
  async ({ assetId, ...fields }) => {
    try {
      const data: UpdateAssetData = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) (data as Record<string, unknown>)[key] = value;
      }

      const asset = await client.updateAsset(assetId, data);

      return {
        content: [{
          type: 'text',
          text: `Asset updated successfully!\n\n${formatAsset(asset)}  ID: ${asset._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error updating asset: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Delete Asset
server.tool(
  'delete_asset',
  'Delete an asset permanently. Prefer update_asset with status "decommissioned" to keep history.',
  {
    assetId: z.string().describe('The ID of the asset to delete')
  },
  async ({ assetId }) => {
    try {
      await client.deleteAsset(assetId);

      return {
        content: [{
          type: 'text',
          text: `Asset ${assetId} deleted successfully!`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error deleting asset: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Get Tailscale Sync Status
server.tool(
  'get_tailscale_sync_status',
  'Check whether the Tailscale host auto-discovery is configured and how the last sync went (when, what changed, any error).',
  {},
  async () => {
    try {
      const s = await client.getTailscaleSyncStatus();

      return {
        content: [{
          type: 'text',
          text: `Tailscale sync: ${s.configured ? 'configured' : 'NOT configured (needs TAILSCALE_OAUTH_CLIENT_ID and TAILSCALE_OAUTH_CLIENT_SECRET on the server)'}\n` +
            (s.configured ? `Automatic interval: ${s.intervalMinutes > 0 ? `${s.intervalMinutes} min` : 'disabled'}\n` : '') +
            `Last success: ${s.lastSuccessAt ? new Date(s.lastSuccessAt).toLocaleString() : 'never'}\n` +
            (s.lastError ? `Last error: ${s.lastError}\n` : '') +
            (s.summary ? `Last result: ${s.summary.devices} devices, ${s.summary.added} added, ${s.summary.adopted} linked, ${s.summary.updated} updated, ${s.summary.reactivated} reactivated, ${s.summary.removed} removed, ${s.summary.withWarnings} with warnings\n` : '')
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting Tailscale sync status: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Sync Tailscale Assets
server.tool(
  'sync_tailscale_assets',
  'Run the Tailscale host discovery now: adds new tailnet devices as host assets (flagged needs-review), links existing assets by IP/hostname, ' +
    'updates Tailscale details and warnings, and marks assets removed when their device disappears. Manual fields are never changed. ' +
    'A failed run changes nothing. Requires the server to have Tailscale OAuth credentials configured.',
  {},
  async () => {
    try {
      const s = await client.syncTailscale();

      return {
        content: [{
          type: 'text',
          text: `Tailscale sync complete.\n\n` +
            `Devices: ${s.devices}\nAdded: ${s.added}\nLinked to existing assets: ${s.adopted}\nUpdated: ${s.updated}\n` +
            `Reactivated: ${s.reactivated}\nMarked removed: ${s.removed}\nAssets with warnings: ${s.withWarnings}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error syncing Tailscale: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// ============================================================================
// FEATURES TOOLS
// ============================================================================

const featureStatusEnum = z.enum(['proposed', 'planned', 'in_progress', 'shipped', 'dropped']);
const priorityEnum = z.enum(['low', 'medium', 'high', 'critical']);

function formatProgress(feature: Feature): string {
  const p = feature.progress;
  if (!p) return 'Unknown';
  return `${p.done}/${p.total} issues done (${p.percent}%)` +
    (p.inProgress ? `, ${p.inProgress} in progress` : '') +
    (p.blocked ? `, ${p.blocked} blocked` : '');
}

// List Features
server.tool(
  'list_features',
  'List features with optional filtering. Supports filtering by project, status, priority, owner, tags, and search.',
  {
    projectId: z.string().optional().describe('Filter by project ID'),
    status: z.array(featureStatusEnum).optional().describe('Filter by status'),
    priority: z.array(priorityEnum).optional().describe('Filter by priority'),
    ownerId: z.string().optional().describe('Filter by owner user ID'),
    tags: z.array(z.string()).optional().describe('Filter by tags'),
    search: z.string().optional().describe('Search in title, description and feature number')
  },
  async ({ projectId, status, priority, ownerId, tags, search }) => {
    try {
      const filter: FeatureFilter = {};
      if (projectId) filter.projectId = projectId;
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (ownerId) filter.ownerId = ownerId;
      if (tags) filter.tags = tags;
      if (search) filter.search = search;

      const features = await client.listFeatures(filter);

      return {
        content: [{
          type: 'text',
          text: `Found ${features.length} features:\n\n${features.map(f =>
            `${f.featureNumber}: ${f.title}\n` +
            `  Status: ${f.status} | Priority: ${f.priority}\n` +
            `  Project: ${f.project?.name || 'Unknown'} (${f.projectId})\n` +
            `  Owner: ${f.owner?.name || 'Unassigned'}\n` +
            `  Progress: ${formatProgress(f)}\n` +
            `  ID: ${f._id}\n`
          ).join('\n')}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing features: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Get Feature
server.tool(
  'get_feature',
  'Get detailed information about a feature by ID or number (e.g. CUS-F001), including progress from linked issues',
  {
    featureId: z.string().describe('The ID or number (e.g. CUS-F001) of the feature')
  },
  async ({ featureId }) => {
    try {
      const feature = await client.getFeature(featureId);

      return {
        content: [{
          type: 'text',
          text: `Feature Details:\n\n` +
            `${feature.featureNumber}: ${feature.title}\n` +
            `Status: ${feature.status}\n` +
            `Priority: ${feature.priority}\n` +
            `Project: ${feature.project?.name || 'Unknown'} (${feature.projectId})\n` +
            `Owner: ${feature.owner?.name || 'Unassigned'}\n` +
            `Progress: ${formatProgress(feature)}\n` +
            `Tags: ${feature.tags?.join(', ') || 'None'}\n` +
            (feature.wikiSlug ? `Wiki: ${feature.wikiSlug}\n` : '') +
            (feature.targetDate ? `Target: ${new Date(feature.targetDate).toLocaleDateString()}\n` : '') +
            (feature.shippedAt ? `Shipped: ${new Date(feature.shippedAt).toLocaleDateString()}\n` : '') +
            `Created: ${feature.createdAt ? new Date(feature.createdAt).toLocaleDateString() : 'Unknown'}\n\n` +
            `Description:\n${feature.description}\n\n` +
            `Acceptance Criteria:\n${feature.acceptanceCriteria || 'None'}\n\n` +
            `ID: ${feature._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting feature: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Create Feature
server.tool(
  'create_feature',
  'Create a new feature in the specified project. Features are delivered through linked issues.',
  {
    projectId: z.string().describe('The ID of the project to create the feature in'),
    title: z.string().describe('The title of the feature'),
    description: z.string().describe('Markdown description: the problem and the desired behaviour'),
    acceptanceCriteria: z.string().optional().describe('Markdown checklist, e.g. "- [ ] user can export CSV"'),
    status: featureStatusEnum.optional().describe('Initial status (default: proposed)'),
    priority: priorityEnum.optional().describe('Priority level (default: medium)'),
    ownerId: z.string().optional().describe('ID of the user accountable for the feature'),
    wikiSlug: z.string().optional().describe('Slug of a wiki page holding the design/spec'),
    tags: z.array(z.string()).optional().describe('Tags to categorize the feature'),
    targetDate: z.string().optional().describe('Target date in ISO format')
  },
  async ({ projectId, title, description, acceptanceCriteria, status, priority, ownerId, wikiSlug, tags, targetDate }) => {
    try {
      const data: CreateFeatureData = {
        projectId,
        title,
        description,
        acceptanceCriteria,
        status,
        priority,
        ownerId,
        wikiSlug,
        tags: tags || [],
        targetDate
      };

      const feature = await client.createFeature(data);

      return {
        content: [{
          type: 'text',
          text: `Feature created successfully!\n\n` +
            `${feature.featureNumber}: ${feature.title}\n` +
            `Status: ${feature.status}\n` +
            `Priority: ${feature.priority}\n` +
            `ID: ${feature._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating feature: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Update Feature
server.tool(
  'update_feature',
  'Update an existing feature. Setting status to shipped records the ship date and warns if linked issues are still open.',
  {
    featureId: z.string().describe('The ID or number (e.g. CUS-F001) of the feature to update'),
    title: z.string().optional().describe('New title'),
    description: z.string().optional().describe('New description'),
    acceptanceCriteria: z.string().optional().describe('New acceptance criteria'),
    status: featureStatusEnum.optional().describe('New status'),
    priority: priorityEnum.optional().describe('New priority'),
    ownerId: z.string().nullable().optional().describe('New owner ID; null clears the owner'),
    wikiSlug: z.string().optional().describe('Wiki page slug; empty string clears it'),
    tags: z.array(z.string()).optional().describe('New tags'),
    targetDate: z.string().nullable().optional().describe('New target date in ISO format; null clears it')
  },
  async ({ featureId, title, description, acceptanceCriteria, status, priority, ownerId, wikiSlug, tags, targetDate }) => {
    try {
      const data: UpdateFeatureData = {};
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (acceptanceCriteria !== undefined) data.acceptanceCriteria = acceptanceCriteria;
      if (status !== undefined) data.status = status;
      if (priority !== undefined) data.priority = priority;
      if (ownerId !== undefined) data.ownerId = ownerId;
      if (wikiSlug !== undefined) data.wikiSlug = wikiSlug;
      if (tags !== undefined) data.tags = tags;
      if (targetDate !== undefined) data.targetDate = targetDate;

      const feature = await client.updateFeature(featureId, data);

      return {
        content: [{
          type: 'text',
          text: `Feature updated successfully!\n\n` +
            `${feature.featureNumber}: ${feature.title}\n` +
            `Status: ${feature.status}\n` +
            `Priority: ${feature.priority}\n` +
            `Progress: ${formatProgress(feature)}\n` +
            (feature.warnings?.length ? `Warnings: ${feature.warnings.join('; ')}\n` : '') +
            `ID: ${feature._id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error updating feature: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Delete Feature
server.tool(
  'delete_feature',
  'Delete a feature. Linked issues are unlinked, not deleted.',
  {
    featureId: z.string().describe('The ID or number (e.g. CUS-F001) of the feature to delete')
  },
  async ({ featureId }) => {
    try {
      await client.deleteFeature(featureId);

      return {
        content: [{
          type: 'text',
          text: `Feature ${featureId} deleted successfully!`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error deleting feature: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Get Feature Issues
server.tool(
  'get_feature_issues',
  'List the issues linked to a feature',
  {
    featureId: z.string().describe('The ID or number (e.g. CUS-F001) of the feature')
  },
  async ({ featureId }) => {
    try {
      const issues = await client.getFeatureIssues(featureId);

      return {
        content: [{
          type: 'text',
          text: `Found ${issues.length} linked issues:\n\n${issues.map(issue =>
            `${issue.issueNumber}: ${issue.title}\n` +
            `  Status: ${issue.status} | Priority: ${issue.priority}\n` +
            `  Assignee: ${issue.assignee?.name || 'Unassigned'}\n` +
            `  ID: ${issue._id}\n`
          ).join('\n')}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting feature issues: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Link Issue to Feature
server.tool(
  'link_issue_to_feature',
  'Link an existing issue to a feature (an issue belongs to at most one feature; linking moves it)',
  {
    featureId: z.string().describe('The ID or number (e.g. CUS-F001) of the feature'),
    issueId: z.string().describe('The ID or number (e.g. CUS-001) of the issue')
  },
  async ({ featureId, issueId }) => {
    try {
      await client.linkIssueToFeature(featureId, issueId);

      return {
        content: [{
          type: 'text',
          text: `Issue ${issueId} linked to feature ${featureId}.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error linking issue: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Unlink Issue from Feature
server.tool(
  'unlink_issue_from_feature',
  'Remove an issue from a feature',
  {
    featureId: z.string().describe('The ID or number (e.g. CUS-F001) of the feature'),
    issueId: z.string().describe('The ID or number (e.g. CUS-001) of the issue')
  },
  async ({ featureId, issueId }) => {
    try {
      await client.unlinkIssueFromFeature(featureId, issueId);

      return {
        content: [{
          type: 'text',
          text: `Issue ${issueId} unlinked from feature ${featureId}.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error unlinking issue: ${error instanceof Error ? error.message : 'Unknown error'}`
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
