import { useEffect, useRef, useMemo } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { resolveWidgetRemoteUrl } from '@/utils/resolveWidgetRemoteUrl';
import { cn } from '@/lib/utils';

/** Viewport mobile simulé pour les miniatures de grille */
const THUMBNAIL_VIEWPORT = { width: 390, height: 780 };
const THUMBNAIL_SCALE = 0.24;
const THUMBNAIL_SCALED = {
  width: THUMBNAIL_VIEWPORT.width * THUMBNAIL_SCALE,
  height: THUMBNAIL_VIEWPORT.height * THUMBNAIL_SCALE,
};

const DEFAULT_PREVIEW_THEME = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  background: '#0f172a',
  surface: '#1e293b',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  border: '#334155',
};

interface WidgetRunnerProps {
  widgetId: string;
  remoteUrl: string;
  name: string;
  className?: string;
  config?: Record<string, unknown>;
  env?: Record<string, unknown>;
  onResize?: (height: number) => void;
  variant?: 'default' | 'thumbnail';
}

export function WidgetRunner({
  widgetId,
  remoteUrl,
  name,
  className,
  config,
  env,
  onResize,
  variant = 'default',
}: WidgetRunnerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user } = useAuth();
  const configRef = useRef({ config, env });
  configRef.current = { config, env };
  const resolvedRemoteUrl = useMemo(() => resolveWidgetRemoteUrl(remoteUrl), [remoteUrl]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return;
      }

      let message: {
        source?: string;
        id?: string;
        action?: string;
        payload?: unknown;
        data?: unknown;
      };

      try {
        message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      if (message.source !== 'klyb-widget' || !message.id || !message.action) {
        return;
      }

      const reply = (payload: { success: boolean; data?: unknown; error?: string }) => {
        iframeRef.current?.contentWindow?.postMessage(
          { id: message.id, ...payload },
          '*',
        );
      };

      try {
        let responseData: unknown = null;

        switch (message.action) {
          case 'GET_USER':
            responseData = user
              ? { id: user.id, name: user.username || user.name || user.email }
              : null;
            break;

          case 'GET_SESSION_TOKEN':
          case 'GET_IDENTITY_TOKEN': {
            const res = await api.post('/auth/widget-token', { widgetId });
            responseData = res.data.token;
            break;
          }

          case 'GET_CONFIG':
            responseData = {
              env: configRef.current.env || {},
              props: configRef.current.config || {},
              theme: DEFAULT_PREVIEW_THEME,
            };
            break;

          case 'RESIZE': {
            const resizeData = (message.payload || message.data) as { height?: number } | undefined;
            if (resizeData?.height) {
              onResize?.(resizeData.height);
            }
            return;
          }

          case 'FETCH_EXTERNAL': {
            const fetchParams = (message.payload || message.data) as
              | { url?: string; options?: RequestInit }
              | undefined;
            if (!fetchParams?.url) {
              throw new Error('Paramètres URL manquants pour FETCH_EXTERNAL');
            }
            const fetchResponse = await fetch(fetchParams.url, fetchParams.options || {});
            const contentType = fetchResponse.headers.get('content-type') || '';
            let body: unknown = null;
            if (contentType.includes('application/json')) {
              body = await fetchResponse.json();
            } else {
              body = await fetchResponse.text();
            }
            responseData = {
              status: fetchResponse.status,
              statusText: fetchResponse.statusText,
              headers: Object.fromEntries(fetchResponse.headers.entries()),
              body,
            };
            break;
          }

          default:
            console.warn(`[WidgetRunner] Action non supportée : ${message.action}`);
            throw new Error(`Action non supportée : ${message.action}`);
        }

        reply({ success: true, data: responseData });
      } catch (error: unknown) {
        reply({
          success: false,
          error: error instanceof Error ? error.message : 'Erreur interne du bridge',
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user, widgetId, onResize]);

  if (!resolvedRemoteUrl) {
    return (
      <div className={className} aria-label={`Aperçu indisponible — ${name}`} />
    );
  }

  if (variant === 'thumbnail') {
    return (
      <div
        className={cn(
          'w-full h-full overflow-hidden pointer-events-none bg-[#0f172a] flex items-center justify-center',
          className,
        )}
        aria-hidden
      >
        <div
          className="relative overflow-hidden shrink-0"
          style={{
            width: THUMBNAIL_SCALED.width,
            height: THUMBNAIL_SCALED.height,
          }}
        >
          <iframe
            ref={iframeRef}
            key={resolvedRemoteUrl}
            src={resolvedRemoteUrl}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            className="absolute top-0 left-0 border-0 bg-transparent"
            style={{
              width: THUMBNAIL_VIEWPORT.width,
              height: THUMBNAIL_VIEWPORT.height,
              transform: `scale(${THUMBNAIL_SCALE})`,
              transformOrigin: 'top left',
            }}
            title={`Widget — ${name}`}
          />
        </div>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      key={resolvedRemoteUrl}
      src={resolvedRemoteUrl}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      className={className}
      title={`Widget — ${name}`}
    />
  );
}
