// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the issue-tracker database
db = db.getSiblingDB('issue-tracker');

// Create collections with validation schemas
db.createCollection('issues', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'description', 'status', 'priority', 'createdBy'],
      properties: {
        title: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'must be a string and is required'
        },
        description: {
          bsonType: 'string',
          minLength: 1,
          description: 'must be a string and is required'
        },
        status: {
          enum: ['open', 'in_progress', 'blocked', 'closed'],
          description: 'must be one of the allowed status values'
        },
        priority: {
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'must be one of the allowed priority values'
        },
        assignee: {
          bsonType: 'objectId',
          description: 'must be an ObjectId if present'
        },
        tags: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          },
          description: 'must be an array of strings if present'
        },
        createdBy: {
          bsonType: 'objectId',
          description: 'must be an ObjectId and is required'
        },
        createdAt: {
          bsonType: 'date',
          description: 'must be a date'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'must be a date'
        }
      }
    }
  }
});

db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'role'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100,
          description: 'must be a string and is required'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'must be a valid email address and is required'
        },
        role: {
          enum: ['admin', 'developer', 'viewer'],
          description: 'must be one of the allowed role values'
        },
        avatar: {
          bsonType: 'string',
          description: 'must be a string if present'
        },
        createdAt: {
          bsonType: 'date',
          description: 'must be a date'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'must be a date'
        }
      }
    }
  }
});

db.createCollection('wiki', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'slug', 'content', 'createdBy'],
      properties: {
        title: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'must be a string and is required'
        },
        slug: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200,
          pattern: '^[a-z0-9-]+$',
          description: 'must be a lowercase string with hyphens and is required'
        },
        content: {
          bsonType: 'string',
          minLength: 1,
          description: 'must be a string and is required'
        },
        summary: {
          bsonType: 'string',
          maxLength: 500,
          description: 'must be a string if present'
        },
        tags: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          },
          description: 'must be an array of strings if present'
        },
        createdBy: {
          bsonType: 'objectId',
          description: 'must be an ObjectId and is required'
        },
        createdAt: {
          bsonType: 'date',
          description: 'must be a date'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'must be a date'
        }
      }
    }
  }
});

// Create indexes for better performance
db.issues.createIndex({ status: 1 });
db.issues.createIndex({ priority: 1 });
db.issues.createIndex({ assignee: 1 });
db.issues.createIndex({ createdBy: 1 });
db.issues.createIndex({ tags: 1 });
db.issues.createIndex({ createdAt: -1 });
db.issues.createIndex({ title: 'text', description: 'text' });

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ name: 1 });

db.wiki.createIndex({ slug: 1 }, { unique: true });
db.wiki.createIndex({ createdBy: 1 });
db.wiki.createIndex({ tags: 1 });
db.wiki.createIndex({ createdAt: -1 });
db.wiki.createIndex({ title: 'text', content: 'text' });

// Insert initial demo data
print('Creating demo users...');

const adminUser = db.users.insertOne({
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date()
});

const devUser = db.users.insertOne({
  name: 'Developer User',
  email: 'dev@example.com',
  role: 'developer',
  createdAt: new Date(),
  updatedAt: new Date()
});

const viewerUser = db.users.insertOne({
  name: 'Viewer User',
  email: 'viewer@example.com',
  role: 'viewer',
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Creating demo issues...');

db.issues.insertMany([
  {
    title: 'Setup project infrastructure',
    description: 'Initialize the project with Next.js, TypeScript, and MongoDB. Set up the basic project structure and configuration files.',
    status: 'closed',
    priority: 'high',
    assignee: devUser.insertedId,
    tags: ['setup', 'infrastructure'],
    createdBy: adminUser.insertedId,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)  // 5 days ago
  },
  {
    title: 'Implement user authentication',
    description: 'Add user authentication system with login, logout, and session management. Include role-based access control.',
    status: 'in_progress',
    priority: 'high',
    assignee: devUser.insertedId,
    tags: ['authentication', 'security'],
    createdBy: adminUser.insertedId,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)  // 1 day ago
  },
  {
    title: 'Create issue tracking interface',
    description: 'Build the user interface for creating, viewing, and managing issues. Include filtering and search functionality.',
    status: 'open',
    priority: 'medium',
    assignee: devUser.insertedId,
    tags: ['ui', 'issues'],
    createdBy: adminUser.insertedId,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)  // 2 days ago
  },
  {
    title: 'Add wiki documentation system',
    description: 'Implement a wiki system for storing and displaying markdown documentation. Include search and categorization.',
    status: 'open',
    priority: 'medium',
    assignee: null,
    tags: ['wiki', 'documentation'],
    createdBy: adminUser.insertedId,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)  // 1 day ago
  }
]);

print('Creating demo wiki pages...');

db.wiki.insertMany([
  {
    title: 'Getting Started',
    slug: 'getting-started',
    content: `# Getting Started

Welcome to the Issue Tracker documentation! This guide will help you get up and running with the system.

## Overview

The Issue Tracker is a comprehensive project management tool built with:
- Next.js 15 with App Router
- TypeScript for type safety
- MongoDB Atlas for data storage
- Tailwind CSS for styling
- Docker for deployment

## Features

### Issue Tracking
- Create, read, update, and delete issues
- Filter and search issues
- Assign issues to team members
- Track issue status and priority

### Wiki System
- Create and edit documentation pages
- Markdown support with syntax highlighting
- Search across wiki pages
- Organize with tags and categories

### User Management
- Role-based access control (Admin, Developer, Viewer)
- User profiles and assignments
- Authentication and session management

## Quick Start

1. **Login** with your credentials
2. **Create an issue** to track your first task
3. **Explore the wiki** for documentation
4. **Invite team members** to collaborate

## Need Help?

Check out our other wiki pages or contact your system administrator.`,
    summary: 'Introduction to the Issue Tracker system and its main features',
    tags: ['documentation', 'getting-started'],
    createdBy: adminUser.insertedId,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)  // 7 days ago
  },
  {
    title: 'User Guide',
    slug: 'user-guide',
    content: `# User Guide

This guide covers how to use the Issue Tracker system effectively.

## Issues

### Creating an Issue

1. Navigate to the **Issues** page
2. Click **New Issue**
3. Fill in the required fields:
   - **Title**: Brief description of the issue
   - **Description**: Detailed explanation
   - **Priority**: Low, Medium, High, or Critical
   - **Assignee**: Team member responsible
   - **Tags**: Keywords for categorization
4. Click **Create Issue**

### Issue Status Workflow

Issues follow this workflow:
1. **Open** - New issue, not yet started
2. **In Progress** - Currently being worked on
3. **Blocked** - Waiting for something else
4. **Closed** - Completed or resolved

### Filtering and Searching

Use the filters on the Issues page to:
- Filter by status, priority, or assignee
- Search by title or description
- Sort by creation date or priority

## Wiki

### Creating a Wiki Page

1. Navigate to the **Wiki** section
2. Click **New Page**
3. Enter:
   - **Title**: Page title
   - **Slug**: URL-friendly identifier
   - **Content**: Markdown content
   - **Tags**: For categorization
4. Click **Create Page**

### Markdown Support

The wiki supports full GitHub-flavored markdown:
- Headers (# ## ###)
- Bold (**text**) and italic (*text*)
- Links [text](url)
- Images ![alt](url)
- Code blocks (\`\`\`language\`\`\`)
- Lists and tables

## User Roles

### Admin
- Full system access
- User management
- System configuration

### Developer
- Create and edit issues
- Create and edit wiki pages
- Assign issues to themselves

### Viewer
- Read-only access
- View issues and wiki
- No editing permissions`,
    summary: 'Comprehensive guide for using all features of the Issue Tracker',
    tags: ['user-guide', 'documentation'],
    createdBy: adminUser.insertedId,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)  // 4 days ago
  },
  {
    title: 'API Documentation',
    slug: 'api-documentation',
    content: `# API Documentation

This document describes the internal API structure and Server Actions used in the Issue Tracker.

## Server Actions

The application uses Next.js Server Actions for data mutations instead of traditional API routes.

### Issue Actions

#### \`getIssues(filters?)\`
Retrieves issues with optional filtering.
- \`filters.status\`: Filter by issue status
- \`filters.priority\`: Filter by priority
- \`filters.assignee\`: Filter by assignee ID
- \`filters.search\`: Search in title and description

#### \`createIssue(data)\`
Creates a new issue.
- \`data.title\`: Issue title (required)
- \`data.description\`: Issue description (required)
- \`data.priority\`: Priority level (required)
- \`data.assignee\`: Assignee user ID (optional)
- \`data.tags\`: Array of tags (optional)

#### \`updateIssue(id, data)\`
Updates an existing issue.
- \`id\`: Issue ID
- \`data\`: Fields to update

#### \`deleteIssue(id)\`
Deletes an issue.
- \`id\`: Issue ID

### User Actions

#### \`getUsers()\`
Retrieves all users.

#### \`createUser(data)\`
Creates a new user.
- \`data.name\`: User name (required)
- \`data.email\`: User email (required)
- \`data.role\`: User role (required)

#### \`updateUser(id, data)\`
Updates an existing user.

#### \`deleteUser(id)\`
Deletes a user.

### Wiki Actions

#### \`getWikiPages()\`
Retrieves all wiki pages.

#### \`getWikiPage(slug)\`
Retrieves a specific wiki page by slug.

#### \`createWikiPage(data)\`
Creates a new wiki page.
- \`data.title\`: Page title (required)
- \`data.slug\`: URL slug (required)
- \`data.content\`: Page content (required)

#### \`updateWikiPage(slug, data)\`
Updates an existing wiki page.

#### \`deleteWikiPage(slug)\`
Deletes a wiki page.

## Authentication

The system uses a mock authentication system with the following actions:

#### \`authenticateUser(formData)\`
Authenticates a user with email and password.
- \`formData.email\`: User email
- \`formData.password\`: User password

#### \`getCurrentSession()\`
Gets the current user session.

#### \`logoutUser()\`
Logs out the current user.

## Database Schema

### Issues Collection
\`\`\`javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  status: Enum['open', 'in_progress', 'blocked', 'closed'],
  priority: Enum['low', 'medium', 'high', 'critical'],
  assignee: ObjectId,
  tags: [String],
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Users Collection
\`\`\`javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  role: Enum['admin', 'developer', 'viewer'],
  avatar: String,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Wiki Collection
\`\`\`javascript
{
  _id: ObjectId,
  title: String,
  slug: String,
  content: String,
  summary: String,
  tags: [String],
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
\`\`\``,
    summary: 'Technical documentation for the internal API and Server Actions',
    tags: ['api', 'technical', 'documentation'],
    createdBy: devUser.insertedId,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)  // 3 days ago
  }
]);

print('Database initialization completed successfully!');
print('Demo accounts created:');
print('- Admin: admin@example.com / admin123');
print('- Developer: dev@example.com / dev123');
print('- Viewer: viewer@example.com / viewer123');