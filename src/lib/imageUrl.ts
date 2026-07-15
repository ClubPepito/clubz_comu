import { getRuntimeEnv } from '@/lib/runtimeEnv';

const STORAGE_PATH_REGEX = /\/storage\/([^/]+)\/(.+?)(\?.*)?$/;
const DEFAULT_IMAGE_BUCKET = 'klyb-images';

/** CDN R2 public en production (objets à la racine : events/xxx.jpg). */
const PRODUCTION_S3_PUBLIC_URL =
  'https://pub-647e664a4adc41af8da9d2eb040ae18a.r2.dev';

/** Hôtes front qui ne servent pas /storage (404 si utilisé comme CDN). */
const INVALID_MEDIA_HOSTS = new Set([
  'app.klyb.app',
  'www.klyb.app',
  'klyb.app',
  'commu.klyb.app',
  'admin.klyb.app',
]);

function isProduction(): boolean {
  return getRuntimeEnv('VITE_ENV') === 'production';
}

function getS3PublicUrl(): string {
  const configured = (getRuntimeEnv('VITE_S3_PUBLIC_URL') || '').replace(/\/$/, '');
  if (configured) return configured;
  if (isProduction()) {
    return PRODUCTION_S3_PUBLIC_URL;
  }
  return '';
}

function getApiBaseUrl(): string {
  const configured = (
    getRuntimeEnv('VITE_API_BASE_URL') || 'http://localhost:3000/api'
  ).replace(/\/$/, '');
  return configured.endsWith('/api') ? configured : `${configured}/api`;
}

function extractStoragePath(
  url: string,
): { bucket: string; objectName: string } | null {
  const match = url.match(STORAGE_PATH_REGEX);
  if (!match) return null;
  return { bucket: match[1], objectName: match[2] };
}

function extractObjectKey(url: string, productionBase?: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const storage = extractStoragePath(trimmed);
  if (storage) return storage.objectName;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      const fromPath = extractStoragePath(parsed.pathname);
      if (fromPath) return fromPath.objectName;

      const base = (productionBase ?? getS3PublicUrl()).replace(/\/$/, '');
      if (base && trimmed.startsWith(`${base}/`)) {
        return trimmed.slice(base.length + 1).split('?')[0];
      }
    } catch {
      return null;
    }
    return null;
  }

  const path = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  const fromStorage = extractStoragePath(`/${path}`);
  if (fromStorage) return fromStorage.objectName;

  return path.split('?')[0] || null;
}

function buildStorageUrl(bucket: string, objectName: string): string {
  const s3PublicUrl = getS3PublicUrl();
  if (s3PublicUrl) {
    const base = s3PublicUrl.replace(/\/$/, '');
    if (base.endsWith('/api')) {
      return `${base}/storage/${bucket}/${objectName}`;
    }
    return `${base}/${objectName}`;
  }

  return `${getApiBaseUrl()}/storage/${bucket}/${objectName}`;
}

function rewriteInvalidAbsoluteMediaUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!INVALID_MEDIA_HOSTS.has(parsed.hostname)) return null;

    const objectKey = extractObjectKey(url);
    if (!objectKey) return null;

    const bucket = extractStoragePath(url)?.bucket || DEFAULT_IMAGE_BUCKET;
    return buildStorageUrl(bucket, objectKey);
  } catch {
    return null;
  }
}

function resolveAbsoluteUrl(value: string): string | null {
  const rewritten = rewriteInvalidAbsoluteMediaUrl(value);
  if (rewritten) return rewritten;

  const s3PublicUrl = getS3PublicUrl();
  if (s3PublicUrl) {
    const productionBase = s3PublicUrl.replace(/\/$/, '');
    if (value.startsWith(`${productionBase}/`) || value === productionBase) {
      return value;
    }

    const objectKey = extractObjectKey(value, productionBase);
    if (objectKey) {
      return buildStorageUrl(
        extractStoragePath(value)?.bucket || DEFAULT_IMAGE_BUCKET,
        objectKey,
      );
    }
  }

  const storage = extractStoragePath(value);
  if (storage) {
    return `${getApiBaseUrl()}/storage/${storage.bucket}/${storage.objectName}`;
  }

  return value;
}

/**
 * Résout un chemin de stockage relatif ou une URL absolue en URL affichable.
 * Production : CDN R2 (VITE_S3_PUBLIC_URL ou fallback).
 * Local : proxy API /api/storage/:bucket/:object.
 */
export function resolveImageUrl(input?: string | null): string | null {
  if (!input) return null;

  const value = input.trim();
  if (!value || value.startsWith('file://')) return null;

  if (
    value.startsWith('data:') ||
    value.startsWith('blob:')
  ) {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    return resolveAbsoluteUrl(value);
  }

  const path = value.startsWith('/') ? value : `/${value}`;
  const storage = extractStoragePath(path);
  if (storage) {
    return buildStorageUrl(storage.bucket, storage.objectName);
  }

  if (value.startsWith('events/') || value.startsWith('images/')) {
    return buildStorageUrl(DEFAULT_IMAGE_BUCKET, value.replace(/^\//, ''));
  }

  return `${getApiBaseUrl()}${path}`;
}
