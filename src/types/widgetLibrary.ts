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
export interface WidgetDefinition {
  id: string;
  type: WidgetType;
  name: string;
  description?: string;
  tags?: string[];
  status: WidgetStatus;
  defaultConfig: PageWidget['config'];
  authorId?: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  remoteUrl?: string;
  manifestUrl?: string;
  version: string;
  semanticVersion?: string;
  isKilled?: boolean;
  isPublic?: boolean;
  reviewComments?: string[];
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
