import { getRuntimeEnv } from '@/lib/runtimeEnv';

const STORAGE_PATH_REGEX = /\/storage\/([^/]+)\/(.+?)(\?.*)?$/;

/** CDN R2 public en production (objets à la racine : images/xxx.jpg). */
const PRODUCTION_S3_PUBLIC_URL =
  "https://pub-647e664a4adc41af8da9d2eb040ae18a.r2.dev";

function getS3PublicUrl(): string {
  const configured = (getRuntimeEnv('VITE_S3_PUBLIC_URL') || "").replace(
    /\/$/,
    "",
  );
  if (configured) return configured;
  if (getRuntimeEnv('VITE_ENV') === "production") {
    return PRODUCTION_S3_PUBLIC_URL;
  }
  return "";
}

function getApiBaseUrl(): string {
  const configured = (
    getRuntimeEnv('VITE_API_BASE_URL') || "http://localhost:3000/api"
  ).replace(/\/$/, "");
  return configured.endsWith("/api") ? configured : `${configured}/api`;
}

function extractStoragePath(
  url: string,
): { bucket: string; objectName: string } | null {
  const match = url.match(STORAGE_PATH_REGEX);
  if (!match) return null;
  return { bucket: match[1], objectName: match[2] };
}

function extractObjectKey(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const storage = extractStoragePath(trimmed);
  if (storage) return storage.objectName;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      const fromPath = extractStoragePath(parsed.pathname);
      if (fromPath) return fromPath.objectName;

      const productionBase = getS3PublicUrl().replace(/\/$/, "");
      if (productionBase && trimmed.startsWith(`${productionBase}/`)) {
        return trimmed.slice(productionBase.length + 1).split("?")[0];
      }
    } catch {
      return null;
    }
  }

  const path = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  const fromStorage = extractStoragePath(`/${path}`);
  if (fromStorage) return fromStorage.objectName;

  return path.split("?")[0] || null;
}

function buildStorageUrl(bucket: string, objectName: string): string {
  const s3PublicUrl = getS3PublicUrl();
  if (s3PublicUrl) {
    const base = s3PublicUrl.replace(/\/$/, "");
    if (base.endsWith("/api")) {
      return `${base}/storage/${bucket}/${objectName}`;
    }
    return `${base}/${objectName}`;
  }

  return `${getApiBaseUrl()}/storage/${bucket}/${objectName}`;
}

/**
 * Résout un chemin de stockage relatif ou une URL absolue en URL affichable.
 * Production : CDN R2 (VITE_S3_PUBLIC_URL ou fallback).
 * Local : proxy API /api/storage/:bucket/:object.
 */
export function resolveImageUrl(input?: string | null): string | null {
  if (!input) return null;

  const value = input.trim();
  if (!value || value.startsWith("file://")) return null;

  if (/^https?:\/\//i.test(value)) {
    const s3PublicUrl = getS3PublicUrl();
    if (s3PublicUrl) {
      const productionBase = s3PublicUrl.replace(/\/$/, "");
      if (
        value.startsWith(`${productionBase}/`) ||
        value === productionBase
      ) {
        return value;
      }

      const objectKey = extractObjectKey(value);
      if (objectKey) {
        return buildStorageUrl(
          extractStoragePath(value)?.bucket || "production",
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

  const path = value.startsWith("/") ? value : `/${value}`;
  const storage = extractStoragePath(path);
  if (storage) {
    return buildStorageUrl(storage.bucket, storage.objectName);
  }

  return `${getApiBaseUrl()}${path}`;
}
