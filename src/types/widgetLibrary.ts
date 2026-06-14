import type { PageWidget, WidgetType } from './layout';

/**
 * Statut d'un widget dans le flux Draft → Submit → Marketplace
 * 'blocked' = Kill Switch activé (widget malveillant)
 */
export type WidgetStatus = 'draft' | 'pending' | 'validated' | 'rejected' | 'blocked';

export interface WidgetPermission {
  name: string;
  description?: string;
  required?: boolean;
}

/**
 * Définition d'un widget dans la bibliothèque
 * (créé par un dev, modéré, puis disponible pour les admins).
 */
export interface WidgetHistoryEntry {
  id: string;
  status: WidgetStatus;
  version: string;
  reviewComment?: string;
  remoteUrl?: string;
  manifestUrl?: string;
  createdAt: string;
}

export interface WidgetDefinition {
  id: string;
  type: WidgetType;
  name: string;
  description?: string;
  tags?: string[];
  status: WidgetStatus;
  defaultConfig: PageWidget['config'];
  config?: any;
  authorId?: string;
  author?: {
    username: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  remoteUrl?: string;
  manifestUrl?: string;
  version: string;
  semanticVersion?: string;
  envData?: string;
  isKilled?: boolean;
  isPublic?: boolean;
  reviewComments?: string[];
  history?: WidgetHistoryEntry[];
  permissions?: WidgetPermission[];
  configSchema?: {
    props: Array<{
      name: string;
      type: 'string' | 'number' | 'boolean' | 'color' | 'select' | 'json';
      label: string;
      default?: any;
      options?: Array<{ label: string; value: string }>;
    }>;
  };
}
