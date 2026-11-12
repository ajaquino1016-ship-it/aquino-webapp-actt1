export type FileCategory =
  | 'Deliverables'
  | 'Contracts & Invoices'
  | 'Brand Assets'
  | 'Drafts & Revisions'
  | 'Source Files'
  | 'General';

export interface VaultFile {
  id: string;
  userId: string;
  name: string;
  size: number;
  type: string;
  category: FileCategory | string;
  clientName: string;
  notes?: string;
  isStarred?: boolean;
  downloadCount: number;
  previewDataUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  role?: string;
  companyOrStudio?: string;
  storageUsedBytes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientProject {
  id: string;
  userId: string;
  clientName: string;
  projectName: string;
  createdAt: string;
}

export type ViewMode = 'list' | 'grid';
export type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc';
