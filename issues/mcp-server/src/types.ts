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
  featureId?: string;
  claimedBy?: string;
  claimedAt?: string;
  claimExpired?: boolean;
  claimer?: {
    _id: string;
    name: string;
    email: string;
  };
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
  featureId?: string;
}

export interface UpdateIssueData {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: string | null; // null unassigns
  tags?: string[];
  dueDate?: string;
  featureId?: string | null; // null unlinks the issue from its feature
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
  featureId?: string;
  mine?: boolean; // open issues assigned to, or claimed by, the caller
  tags?: string[];
  search?: string;
}

export interface WikiFilter {
  tags?: string[];
  authorId?: string;
  isPublished?: boolean;
  search?: string;
}

export type FeatureStatus = 'proposed' | 'planned' | 'in_progress' | 'shipped' | 'dropped';

export interface FeatureProgress {
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  percent: number;
}

export interface Feature {
  _id: string;
  projectId: string;
  featureNumber: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  status: FeatureStatus;
  priority: IssuePriority;
  ownerId?: string;
  wikiSlug?: string;
  tags: string[];
  targetDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  project?: {
    _id: string;
    name: string;
    key: string;
  };
  owner?: {
    _id: string;
    name: string;
    email: string;
  };
  progress?: FeatureProgress;
  warnings?: string[];
}

export interface CreateFeatureData {
  projectId: string;
  title: string;
  description: string;
  acceptanceCriteria?: string;
  status?: FeatureStatus;
  priority?: IssuePriority;
  ownerId?: string;
  wikiSlug?: string;
  tags?: string[];
  targetDate?: string;
}

export interface UpdateFeatureData {
  title?: string;
  description?: string;
  acceptanceCriteria?: string;
  status?: FeatureStatus;
  priority?: IssuePriority;
  ownerId?: string | null; // null clears the owner
  wikiSlug?: string;
  tags?: string[];
  targetDate?: string | null; // null clears the date
}

export interface FeatureFilter {
  projectId?: string;
  status?: FeatureStatus[];
  priority?: IssuePriority[];
  ownerId?: string;
  tags?: string[];
  search?: string;
}

export type AssetStatus = 'active' | 'maintenance' | 'decommissioned' | 'removed';

export interface AssetWarning {
  code: string;
  message: string;
}

export interface TailscaleInfo {
  nodeId: string;
  name: string;
  hostname: string;
  addresses: string[];
  os?: string;
  clientVersion?: string;
  updateAvailable: boolean;
  authorized: boolean;
  connectedToControl?: boolean;
  lastSeen: string | null;
  expires: string | null;
  keyExpiryDisabled: boolean;
  lastSyncedAt: string;
  warnings: AssetWarning[];
}

export interface TailscaleSyncSummary {
  devices: number;
  added: number;
  adopted: number;
  updated: number;
  reactivated: number;
  removed: number;
  withWarnings: number;
}

export interface TailscaleSyncStatus {
  configured: boolean;
  intervalMinutes: number;
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  lastError?: string | null;
  summary?: TailscaleSyncSummary;
}

export interface AssetAccount {
  key: string;
  value: string;
}

export interface Asset {
  _id: string;
  name: string;
  hostname?: string;
  ipAddresses: string[];
  type: string;
  status: AssetStatus;
  os?: string;
  provider?: string;
  location?: string;
  cost?: number;
  vendorUrl?: string;
  accounts: AssetAccount[];
  description?: string;
  projects: Array<{
    _id: string;
    name: string;
    key: string;
    role: string;
  }>;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastCheckIn?: string;
  systemInfo?: Record<string, unknown>;
  tailscale?: TailscaleInfo;
  removedAt?: string;
  needsReview?: boolean;
  creator?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface CreateAssetData {
  name: string;
  hostname?: string;
  ipAddresses?: string[];
  type: string;
  status: AssetStatus;
  os?: string;
  provider?: string;
  location?: string;
  cost?: number;
  vendorUrl?: string;
  accounts?: AssetAccount[];
  description?: string;
  projects?: Array<{ projectId: string; role: string }>;
  tags?: string[];
}

export interface UpdateAssetData {
  name?: string;
  hostname?: string;
  ipAddresses?: string[];
  type?: string;
  status?: AssetStatus;
  os?: string;
  provider?: string;
  location?: string;
  cost?: number;
  vendorUrl?: string;
  accounts?: AssetAccount[];
  description?: string;
  projects?: Array<{ projectId: string; role: string }>;
  tags?: string[];
}

export interface AssetFilter {
  type?: string[];
  status?: AssetStatus[];
  projectId?: string;
  tags?: string[];
  provider?: string;
  location?: string;
  search?: string;
}

export interface ClientConfig {
  baseURL: string;
  apiKey: string;
  timeout?: number;
}
