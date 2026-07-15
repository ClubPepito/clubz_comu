type RuntimeEnv = {
  VITE_API_BASE_URL?: string;
  VITE_S3_PUBLIC_URL?: string;
  VITE_S3_WIDGET_PUBLIC_URL?: string;
  VITE_ENV?: string;
};

function getWindowEnv(): RuntimeEnv | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as Window & { ENV?: RuntimeEnv }).ENV;
}

/** Lit une variable Vite au runtime (env-config.js) puis au build (import.meta.env). */
export function getRuntimeEnv(key: keyof RuntimeEnv): string | undefined {
  const fromWindow = getWindowEnv()?.[key];
  if (fromWindow) return fromWindow;
  return import.meta.env[key] as string | undefined;
}
