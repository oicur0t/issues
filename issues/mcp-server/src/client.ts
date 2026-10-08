import { ClientConfig, Issue, Project, User, WikiPage, Comment, CreateIssueData, UpdateIssueData, CreateProjectData, UpdateProjectData, CreateWikiData, UpdateWikiData, CreateCommentData, UpdateCommentData, IssueFilter, WikiFilter, Feature, CreateFeatureData, UpdateFeatureData, FeatureFilter, Asset, CreateAssetData, UpdateAssetData, AssetFilter } from './types.js';

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
      if (filter.featureId) params.append('featureId', filter.featureId);
      if (filter.mine) params.append('mine', 'true');
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

  async claimIssue(id: string): Promise<Issue> {
    const response = await this.request<{ data: Issue }>('POST', `/issues/${id}/claim`);
    return response.data;
  }

  async releaseIssue(id: string): Promise<Issue> {
    const response = await this.request<{ data: Issue }>('DELETE', `/issues/${id}/claim`);
    return response.data;
  }

  // Returns null when no work is available. claim=true atomically claims the issue.
  async getNextWork(options: { projectId?: string; featureId?: string; claim?: boolean }): Promise<Issue | null> {
    if (options.claim) {
      const response = await this.request<{ data: Issue | null }>('POST', '/issues/next', {
        projectId: options.projectId,
        featureId: options.featureId,
      });
      return response.data;
    }

    const params = new URLSearchParams();
    if (options.projectId) params.append('projectId', options.projectId);
    if (options.featureId) params.append('featureId', options.featureId);
    const queryString = params.toString();
    const response = await this.request<{ data: Issue | null }>('GET', `/issues/next${queryString ? `?${queryString}` : ''}`);
    return response.data;
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

  // Features API
  async listFeatures(filter?: FeatureFilter): Promise<Feature[]> {
    let path = '/features';

    if (filter) {
      const params = new URLSearchParams();

      if (filter.projectId) params.append('projectId', filter.projectId);
      if (filter.status) params.append('status', filter.status.join(','));
      if (filter.priority) params.append('priority', filter.priority.join(','));
      if (filter.ownerId) params.append('ownerId', filter.ownerId);
      if (filter.tags) params.append('tags', filter.tags.join(','));
      if (filter.search) params.append('search', filter.search);

      const queryString = params.toString();
      if (queryString) path += `?${queryString}`;
    }

    const response = await this.request<{ data: Feature[] }>('GET', path);
    return response.data;
  }

  async getFeature(id: string): Promise<Feature> {
    const response = await this.request<{ data: Feature }>('GET', `/features/${id}`);
    return response.data;
  }

  async createFeature(data: CreateFeatureData): Promise<Feature> {
    const response = await this.request<{ data: Feature }>('POST', '/features', data);
    return response.data;
  }

  async updateFeature(id: string, data: UpdateFeatureData): Promise<Feature> {
    const response = await this.request<{ data: Feature }>('PUT', `/features/${id}`, data);
    return response.data;
  }

  async deleteFeature(id: string): Promise<void> {
    return this.request<void>('DELETE', `/features/${id}`);
  }

  async getFeatureIssues(id: string): Promise<Issue[]> {
    const response = await this.request<{ data: Issue[] }>('GET', `/features/${id}/issues`);
    return response.data;
  }

  async linkIssueToFeature(featureId: string, issueId: string): Promise<void> {
    return this.request<void>('POST', `/features/${featureId}/issues`, { issueId });
  }

  async unlinkIssueFromFeature(featureId: string, issueId: string): Promise<void> {
    return this.request<void>('DELETE', `/features/${featureId}/issues/${issueId}`);
  }

  // Assets API
  async listAssets(filter?: AssetFilter): Promise<Asset[]> {
    let path = '/assets';

    if (filter) {
      const params = new URLSearchParams();

      if (filter.type) params.append('type', filter.type.join(','));
      if (filter.status) params.append('status', filter.status.join(','));
      if (filter.projectId) params.append('projectId', filter.projectId);
      if (filter.tags) params.append('tags', filter.tags.join(','));
      if (filter.provider) params.append('provider', filter.provider);
      if (filter.location) params.append('location', filter.location);
      if (filter.search) params.append('search', filter.search);

      const queryString = params.toString();
      if (queryString) path += `?${queryString}`;
    }

    const response = await this.request<{ data: Asset[] }>('GET', path);
    return response.data;
  }

  async getAsset(id: string): Promise<Asset> {
    const response = await this.request<{ data: Asset }>('GET', `/assets/${id}`);
    return response.data;
  }

  async createAsset(data: CreateAssetData): Promise<Asset> {
    const response = await this.request<{ data: Asset }>('POST', '/assets', data);
    return response.data;
  }

  async updateAsset(id: string, data: UpdateAssetData): Promise<Asset> {
    const response = await this.request<{ data: Asset }>('PUT', `/assets/${id}`, data);
    return response.data;
  }

  async deleteAsset(id: string): Promise<void> {
    return this.request<void>('DELETE', `/assets/${id}`);
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
