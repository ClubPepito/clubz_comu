const getApiBaseUrl = (): string => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  return (fromEnv || 'http://localhost:3000/api').replace(/\/$/, '');
};

/**
 * Convertit un remoteUrl widget (souvent relatif `/storage/...` en base)
 * en URL absolue utilisable dans une iframe — même logique que le mobile (`getImageUrl`).
 */
export function resolveWidgetRemoteUrl(url?: string | null): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const widgetCdn = (import.meta.env.VITE_S3_WIDGET_PUBLIC_URL as string | undefined)?.replace(/\/$/, '');

  if (trimmed.startsWith('/storage/')) {
    return `${getApiBaseUrl()}${trimmed}`;
  }

  if (trimmed.startsWith('storage/')) {
    return `${getApiBaseUrl()}/${trimmed}`;
  }

  const objectKey = trimmed.replace(/^\//, '');
  if (widgetCdn) {
    return widgetCdn.endsWith('/api')
      ? `${widgetCdn}/storage/klyb-widgets/${objectKey}`
      : `${widgetCdn}/${objectKey}`;
  }

  return `${getApiBaseUrl()}/${objectKey}`;
}
