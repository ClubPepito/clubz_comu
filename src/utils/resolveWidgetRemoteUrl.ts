import { getRuntimeEnv } from '@/lib/runtimeEnv';

const STORAGE_PATH_REGEX = /\/storage\/([^/]+)\/(.+?)(\?.*)?$/;

/** CDN R2 widgets en production (bucket klyb-widgets). */
const PRODUCTION_WIDGET_S3_PUBLIC_URL =
  'https://pub-253329bc107943b39b61d217fe45a798.r2.dev';

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('thomasgllt.fr')) {
      const protocol = window.location.protocol;
      return `${protocol}//api-klyb.thomasgllt.fr/api`;
    }
  }
  const fromEnv = getRuntimeEnv('VITE_API_BASE_URL');
  return (fromEnv || 'http://localhost:3000/api').replace(/\/$/, '');
};

function getWidgetCdnUrl(): string {
  const configured = (getRuntimeEnv('VITE_S3_WIDGET_PUBLIC_URL') || '').replace(/\/$/, '');
  if (configured) return configured;
  if (getRuntimeEnv('VITE_ENV') === 'production') {
    return PRODUCTION_WIDGET_S3_PUBLIC_URL;
  }
  return '';
}

function extractStoragePath(
  url: string,
): { bucket: string; objectName: string } | null {
  const match = url.match(STORAGE_PATH_REGEX);
  if (!match) return null;
  return { bucket: match[1], objectName: match[2] };
}

function buildWidgetStorageUrl(bucket: string, objectName: string): string {
  const widgetCdn = getWidgetCdnUrl();
  if (widgetCdn) {
    const base = widgetCdn.replace(/\/$/, '');
    if (base.endsWith('/api')) {
      return `${base}/storage/${bucket}/${objectName}`;
    }
    return `${base}/${objectName}`;
  }

  return `${getApiBaseUrl()}/storage/${bucket}/${objectName}`;
}

/**
 * Convertit un remoteUrl widget (souvent relatif `/storage/klyb-widgets/...` en base)
 * en URL absolue utilisable dans une iframe.
 * Utilise VITE_S3_WIDGET_PUBLIC_URL (CDN widgets), distinct de VITE_S3_PUBLIC_URL (images).
 */
export function resolveWidgetRemoteUrl(url?: string | null): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const widgetCdn = getWidgetCdnUrl();
    if (widgetCdn) {
      const base = widgetCdn.replace(/\/$/, '');
      if (trimmed.startsWith(`${base}/`) || trimmed === base) {
        return trimmed;
      }

      const storage = extractStoragePath(trimmed);
      if (storage) {
        return buildWidgetStorageUrl(storage.bucket, storage.objectName);
      }
    }

    const storage = extractStoragePath(trimmed);
    if (storage) {
      return `${getApiBaseUrl()}/storage/${storage.bucket}/${storage.objectName}`;
    }

    return trimmed;
  }

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const storage = extractStoragePath(path);
  if (storage) {
    return buildWidgetStorageUrl(storage.bucket, storage.objectName);
  }

  const objectKey = trimmed.replace(/^\//, '');
  const widgetCdn = getWidgetCdnUrl();
  if (widgetCdn) {
    const base = widgetCdn.replace(/\/$/, '');
    if (base.endsWith('/api')) {
      return `${base}/storage/klyb-widgets/${objectKey}`;
    }
    return `${base}/${objectKey}`;
  }

  return `${getApiBaseUrl()}/${objectKey}`;
}
