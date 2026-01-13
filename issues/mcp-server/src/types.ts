// Type definitions for MCP server
export type IssueStatus = 'backlog' | 'in_progress' | 'blocked' | 'fixed' | 'wont_fix';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type UserRole = 'admin' | 'developer' | 'tester' | 'viewer';

export interface Issue {
  _id: string;
  projectId: string;
  issueNumber: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId?: string;
  reporterId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  project?: {
    _id: string;
    name: string;
    key: string;
  };
  assignee?: {
    _id: string;
    name: string;
    email: string;
  };
  reporter?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface Project {
  _id: string;
  name: string;
  key: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  issueCounter: number;
  creator?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface WikiPage {
  _id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  authorId: string;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  lastEditedBy?: string;
  version: number;
  author?: {
    _id: string;
    name: string;
    email: string;
  };
  lastEditor?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface Comment {
  _id: string;
  issueId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface CreateIssueData {
  projectId: string;
  title: string;
  description: string;
  priority?: IssuePriority;
  assigneeId?: string;
  tags?: string[];
  dueDate?: string;
}

export interface UpdateIssueData {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: string;
  tags?: string[];
  dueDate?: string;
}

export interface CreateProjectData {
  name: string;
  key: string;
  description: string;
}

export interface UpdateProjectData {
  name?: string;
  key?: string;
  description?: string;
}

export interface CreateWikiData {
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  isPublished?: boolean;
}

export interface UpdateWikiData {
  title?: string;
  content?: string;
  summary?: string;
  tags?: string[];
  isPublished?: boolean;
}

export interface CreateCommentData {
  issueId: string;
  content: string;
}

export interface UpdateCommentData {
  content: string;
}

export interface IssueFilter {
  projectId?: string;
  status?: IssueStatus[];
  priority?: IssuePriority[];
  assigneeId?: string;
  reporterId?: string;
  tags?: string[];
  search?: string;
}

export interface WikiFilter {
  tags?: string[];
  authorId?: string;
  isPublished?: boolean;
  search?: string;
}

export interface ClientConfig {
  baseURL: string;
  apiKey: string;
  timeout?: number;
}
