/**
 * Lightweight Issue Tracker API Client for AI Agents
 *
 * A minimal, portable client for AI agents to interact with the Issue Tracker API.
 * Drop this file into any project and start tracking issues programmatically.
 *
 * @example
 * const client = new IssueTrackerClient({
 *   baseURL: 'http://localhost:3000/api/v1',
 *   apiKey: 'iak_...'
 * });
 *
 * const issues = await client.issues.list();
 */

// ============================================================================
// Types
// ============================================================================

export interface ClientConfig {
  baseURL: string;
  apiKey: string;
  timeout?: number;
}

export type IssueStatus = 'backlog' | 'in_progress' | 'blocked' | 'fixed' | 'wont_fix';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export interface Issue {
  _id: string;
  issueNumber: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  projectId?: string;
  assigneeId?: string;
  tags?: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  name: string;
  key: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WikiPage {
  _id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  tags?: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
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
  title: string;
  description: string;
  priority?: IssuePriority;
  projectId?: string;
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
  description?: string;
}

// ============================================================================
// Main Client
// ============================================================================

export class IssueTrackerClient {
  private baseURL: string;
  private apiKey: string;
  private timeout: number;

  public issues: IssuesAPI;
  public projects: ProjectsAPI;
  public wiki: WikiAPI;

  constructor(config: ClientConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;

    this.issues = new IssuesAPI(this);
    this.projects = new ProjectsAPI(this);
    this.wiki = new WikiAPI(this);
  }

  async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const url = `${this.baseURL}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`API Error (${response.status}): ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }
}

// ============================================================================
// Issues API
// ============================================================================

class IssuesAPI {
  constructor(private client: IssueTrackerClient) {}

  /**
   * List all issues with optional filtering
   * @example await client.issues.list()
   * @example await client.issues.list({ tags: ['goose', 'backend'] })
   * @example await client.issues.list({ status: ['open'], priority: ['high'] })
   */
  async list(filter?: {
    projectId?: string;
    status?: IssueStatus[];
    priority?: IssuePriority[];
    assigneeId?: string;
    tags?: string[];
    search?: string;
  }): Promise<Issue[]> {
    let path = '/issues';

    if (filter) {
      const params = new URLSearchParams();

      if (filter.projectId) params.append('projectId', filter.projectId);
      if (filter.status) params.append('status', filter.status.join(','));
      if (filter.priority) params.append('priority', filter.priority.join(','));
      if (filter.assigneeId) params.append('assigneeId', filter.assigneeId);
      if (filter.tags) params.append('tags', filter.tags.join(','));
      if (filter.search) params.append('search', filter.search);

      const queryString = params.toString();
      if (queryString) path += `?${queryString}`;
    }

    const response = await this.client.request<{ data: Issue[] }>('GET', path);
    return response.data;
  }

  /**
   * Get a specific issue by ID
   * @example await client.issues.get('68f01...')
   */
  async get(id: string): Promise<Issue> {
    return this.client.request<Issue>('GET', `/issues/${id}`);
  }

  /**
   * Create a new issue
   * @example await client.issues.create({ title: 'Bug fix', description: '...', priority: 'high' })
   */
  async create(data: CreateIssueData): Promise<Issue> {
    const response = await this.client.request<{ data: Issue }>('POST', '/issues', data);
    return response.data;
  }

  /**
   * Update an existing issue
   * @example await client.issues.update('68f01...', { status: 'closed' })
   */
  async update(id: string, data: UpdateIssueData): Promise<Issue> {
    const response = await this.client.request<{ data: Issue }>('PUT', `/issues/${id}`, data);
    return response.data;
  }

  /**
   * Delete an issue
   * @example await client.issues.delete('68f01...')
   */
  async delete(id: string): Promise<void> {
    return this.client.request<void>('DELETE', `/issues/${id}`);
  }

  /**
   * Get comments for an issue
   * @example await client.issues.getComments('68f01...')
   */
  async getComments(id: string): Promise<Comment[]> {
    const response = await this.client.request<{ data: Comment[] }>('GET', `/issues/${id}/comments`);
    return response.data;
  }

  /**
   * Add a comment to an issue
   * @example await client.issues.addComment('68f01...', { content: 'Great work!' })
   */
  async addComment(id: string, data: { content: string }): Promise<Comment> {
    const response = await this.client.request<{ data: Comment }>('POST', `/issues/${id}/comments`, data);
    return response.data;
  }
}

// ============================================================================
// Projects API
// ============================================================================

class ProjectsAPI {
  constructor(private client: IssueTrackerClient) {}

  /**
   * List all projects
   * @example await client.projects.list()
   */
  async list(): Promise<Project[]> {
    const response = await this.client.request<{ data: Project[] }>('GET', '/projects');
    return response.data;
  }

  /**
   * Get a specific project by ID
   * @example await client.projects.get('68f01...')
   */
  async get(id: string): Promise<Project> {
    return this.client.request<Project>('GET', `/projects/${id}`);
  }

  /**
   * Create a new project
   * @example await client.projects.create({ name: 'My Project', key: 'MYPROJ' })
   */
  async create(data: CreateProjectData): Promise<Project> {
    return this.client.request<Project>('POST', '/projects', data);
  }

  /**
   * Update an existing project
   * @example await client.projects.update('68f01...', { name: 'Updated Name' })
   */
  async update(id: string, data: Partial<CreateProjectData>): Promise<Project> {
    return this.client.request<Project>('PUT', `/projects/${id}`, data);
  }

  /**
   * Delete a project
   * @example await client.projects.delete('68f01...')
   */
  async delete(id: string): Promise<void> {
    return this.client.request<void>('DELETE', `/projects/${id}`);
  }
}

// ============================================================================
// Wiki API
// ============================================================================

class WikiAPI {
  constructor(private client: IssueTrackerClient) {}

  /**
   * List all wiki pages
   * @example await client.wiki.list()
   */
  async list(): Promise<WikiPage[]> {
    const response = await this.client.request<{ data: WikiPage[] }>('GET', '/wiki');
    return response.data;
  }

  /**
   * Get a specific wiki page by slug
   * @example await client.wiki.get('getting-started')
   */
  async get(slug: string): Promise<WikiPage> {
    return this.client.request<WikiPage>('GET', `/wiki/${slug}`);
  }

  /**
   * Create a new wiki page
   * @example await client.wiki.create({ title: 'Guide', slug: 'guide', content: '...' })
   */
  async create(data: { title: string; slug: string; content: string; summary?: string; tags?: string[] }): Promise<WikiPage> {
    return this.client.request<WikiPage>('POST', '/wiki', data);
  }

  /**
   * Update an existing wiki page
   * @example await client.wiki.update('guide', { content: 'Updated content' })
   */
  async update(slug: string, data: Partial<{ title: string; content: string; summary?: string; tags?: string[] }>): Promise<WikiPage> {
    return this.client.request<WikiPage>('PUT', `/wiki/${slug}`, data);
  }

  /**
   * Delete a wiki page
   * @example await client.wiki.delete('guide')
   */
  async delete(slug: string): Promise<void> {
    return this.client.request<void>('DELETE', `/wiki/${slug}`);
  }
}

// ============================================================================
// Export
// ============================================================================

export default IssueTrackerClient;
