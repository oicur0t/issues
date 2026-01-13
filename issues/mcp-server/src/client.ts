import { ClientConfig, Issue, Project, User, WikiPage, Comment, CreateIssueData, UpdateIssueData, CreateProjectData, UpdateProjectData, CreateWikiData, UpdateWikiData, CreateCommentData, UpdateCommentData, IssueFilter, WikiFilter } from './types.js';

export class IssueTrackerClient {
  private baseURL: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: ClientConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  async request<T>(method: string, path: string, body?: any): Promise<T> {
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

  // Issues API
  async listIssues(filter?: IssueFilter): Promise<Issue[]> {
    let path = '/issues';

    if (filter) {
      const params = new URLSearchParams();

      if (filter.projectId) params.append('projectId', filter.projectId);
      if (filter.status) params.append('status', filter.status.join(','));
      if (filter.priority) params.append('priority', filter.priority.join(','));
      if (filter.assigneeId) params.append('assigneeId', filter.assigneeId);
      if (filter.reporterId) params.append('reporterId', filter.reporterId);
      if (filter.tags) params.append('tags', filter.tags.join(','));
      if (filter.search) params.append('search', filter.search);

      const queryString = params.toString();
      if (queryString) path += `?${queryString}`;
    }

    const response = await this.request<{ data: Issue[] }>('GET', path);
    return response.data;
  }

  async getIssue(id: string): Promise<Issue> {
    const response = await this.request<{ data: Issue }>('GET', `/issues/${id}`);
    return response.data;
  }

  async createIssue(data: CreateIssueData): Promise<Issue> {
    const response = await this.request<{ data: Issue }>('POST', '/issues', data);
    return response.data;
  }

  async updateIssue(id: string, data: UpdateIssueData): Promise<Issue> {
    const response = await this.request<{ data: Issue }>('PUT', `/issues/${id}`, data);
    return response.data;
  }

  async deleteIssue(id: string): Promise<void> {
    return this.request<void>('DELETE', `/issues/${id}`);
  }

  async getIssueComments(id: string): Promise<Comment[]> {
    const response = await this.request<{ data: Comment[] }>('GET', `/issues/${id}/comments`);
    return response.data;
  }

  async addIssueComment(id: string, data: CreateCommentData): Promise<Comment> {
    const response = await this.request<{ data: Comment }>('POST', `/issues/${id}/comments`, data);
    return response.data;
  }

  // Projects API
  async listProjects(): Promise<Project[]> {
    const response = await this.request<{ data: Project[] }>('GET', '/projects');
    return response.data;
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.request<{ data: Project }>('GET', `/projects/${id}`);
    return response.data;
  }

  async createProject(data: CreateProjectData): Promise<Project> {
    const response = await this.request<{ data: Project }>('POST', '/projects', data);
    return response.data;
  }

  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    const response = await this.request<{ data: Project }>('PUT', `/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>('DELETE', `/projects/${id}`);
  }

  // Users API
  async listUsers(): Promise<User[]> {
    const response = await this.request<{ data: User[] }>('GET', '/users');
    return response.data;
  }

  async getUser(id: string): Promise<User> {
    const response = await this.request<{ data: User }>('GET', `/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, data: Partial<{ name: string; email: string; role: string; avatar?: string; isActive: boolean }>): Promise<User> {
    const response = await this.request<{ data: User }>('PUT', `/users/${id}`, data);
    return response.data;
  }

  // Wiki API
  async listWikiPages(filter?: WikiFilter): Promise<WikiPage[]> {
    let path = '/wiki';

    if (filter) {
      const params = new URLSearchParams();

      if (filter.tags) params.append('tags', filter.tags.join(','));
      if (filter.authorId) params.append('authorId', filter.authorId);
      if (filter.isPublished !== undefined) params.append('isPublished', filter.isPublished.toString());
      if (filter.search) params.append('search', filter.search);

      const queryString = params.toString();
      if (queryString) path += `?${queryString}`;
    }

    const response = await this.request<{ data: WikiPage[] }>('GET', path);
    return response.data;
  }

  async getWikiPage(slug: string): Promise<WikiPage> {
    const response = await this.request<{ data: WikiPage }>('GET', `/wiki/${slug}`);
    return response.data;
  }

  async createWikiPage(data: CreateWikiData): Promise<WikiPage> {
    const response = await this.request<{ data: WikiPage }>('POST', '/wiki', data);
    return response.data;
  }

  async updateWikiPage(slug: string, data: UpdateWikiData): Promise<WikiPage> {
    const response = await this.request<{ data: WikiPage }>('PUT', `/wiki/${slug}`, data);
    return response.data;
  }

  async deleteWikiPage(slug: string): Promise<void> {
    return this.request<void>('DELETE', `/wiki/${slug}`);
  }

  // Comments API
  async updateComment(id: string, data: UpdateCommentData): Promise<Comment> {
    const response = await this.request<{ data: Comment }>('PUT', `/comments/${id}`, data);
    return response.data;
  }

  async deleteComment(id: string): Promise<void> {
    return this.request<void>('DELETE', `/comments/${id}`);
  }
}
