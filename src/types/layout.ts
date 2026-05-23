/**
 * Schéma JSON des pages de communauté.
 * Chaque page est une suite de Widgets (blocs).
 */

export type WidgetType =
  | 'Header'
  | 'Feed'
  | 'EventList'
  | 'CoursePlayer'
  | 'CustomHTML'
  | 'Page';

export interface ThemeConfig {
  primary?: string;
  primaryForeground?: string;
  card?: string;
  cardBorder?: string;
  background?: string;
  foreground?: string;
  radiusButton?: number;
  radiusCard?: number;
}

export interface BaseWidget {
  id: string;
  type: WidgetType;
  order: number;
}

export interface HeaderWidget extends BaseWidget {
  type: 'Header';
  config: {
    bannerUrl?: string;
    avatarUrl?: string;
    communityName: string;
    memberCount?: number;
    showJoinButton: boolean;
  };
}

export interface FeedWidget extends BaseWidget {
  type: 'Feed';
  config: {
    communityId?: string;
    limit?: number;
    showAuthor?: boolean;
  };
}

export interface EventListWidget extends BaseWidget {
  type: 'EventList';
  config: {
    communityId?: string;
    limit?: number;
    showPastEvents?: boolean;
  };
}

export interface CoursePlayerWidget extends BaseWidget {
  type: 'CoursePlayer';
  config: {
    courseId?: string;
    lessonId?: string;
    showTranscript?: boolean;
  };
}

export interface CustomHTMLWidget extends BaseWidget {
  type: 'CustomHTML';
  config: {
    html: string;
    sandbox?: boolean;
  };
}

export interface PageItem extends BaseWidget {
  type: 'Page';
  config: {
    html: string;
    path?: string;
  };
}

export type PageWidget =
  | HeaderWidget
  | FeedWidget
  | EventListWidget
  | CoursePlayerWidget
  | CustomHTMLWidget
  | PageItem;

export interface CommunityPageSchema {
  id: string;
  communityId: string;
  theme: ThemeConfig;
  widgets: PageWidget[];
  updatedAt: string;
}

export type ViewMode = 'edit' | 'view';
