import type { WidgetDefinition } from "@/types/widgetLibrary"

const IMAGE_URL_PATTERN = /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i

/** Segments d'URL typiques d'un bundle widget hébergé (MinIO / S3). */
const WIDGET_URL_MARKERS = [
  "/widgets/drafts/",
  "/widgets/published/",
  "/widgets/",
  "klyb-widgets",
]

const OBJECT_STORAGE_HOST_HINTS = [
  "minio",
  "s3",
  "amazonaws",
  "digitaloceanspaces",
  "blob.core.windows.net",
]

function parseUrl(url: string): URL | null {
  try {
    return new URL(url, window.location.origin)
  } catch {
    return null
  }
}

function normalizePath(pathname: string): string {
  return pathname.replace(/\/$/, "") || "/"
}

export function isImagePreviewUrl(url: string): boolean {
  const parsed = parseUrl(url)
  if (!parsed) return false
  return IMAGE_URL_PATTERN.test(parsed.pathname)
}

function hasWidgetStorageMarker(href: string, path: string): boolean {
  const lowerHref = href.toLowerCase()
  const lowerPath = path.toLowerCase()
  return WIDGET_URL_MARKERS.some(
    (marker) => lowerHref.includes(marker) || lowerPath.includes(marker)
  )
}

function isObjectStorageHost(hostname: string, port: string): boolean {
  const host = hostname.toLowerCase()
  if (OBJECT_STORAGE_HOST_HINTS.some((hint) => host.includes(hint))) return true
  // MinIO local par défaut
  if (port === "9000") return true
  return false
}

/**
 * Allowlist stricte : seules les URLs de bundles widget (CDN / MinIO / S3) peuvent
 * être chargées en iframe. Évite d'embarquer index.html de l'admin (même origine).
 */
export function isWidgetBundleUrl(url: string): boolean {
  const parsed = parseUrl(url)
  if (!parsed) return false

  // Jamais d'iframe same-origin : Vite sert index.html (SPA admin) pour toute route inconnue
  if (parsed.origin === window.location.origin) return false

  const path = parsed.pathname
  const href = parsed.href

  if (hasWidgetStorageMarker(href, path)) return true

  if (
    isObjectStorageHost(parsed.hostname, parsed.port) &&
    /\.html?(\?.*)?$/i.test(path)
  ) {
    return true
  }

  return false
}

/** URL qui chargerait l'app admin dans l'iframe (erreur de config remoteUrl). */
export function isAdminAppUrl(url: string): boolean {
  const parsed = parseUrl(url)
  if (!parsed) return true

  if (parsed.origin !== window.location.origin) return false

  const path = normalizePath(parsed.pathname)
  if (path === "/" || path === "/index.html") return true

  const adminRoutes = [
    "/login",
    "/cli-auth",
    "/marketplace",
    "/developer",
    "/moderation",
    "/events",
    "/members",
    "/settings",
    "/analytics",
    "/membership",
    "/create",
  ]

  return adminRoutes.some((route) => path === route || path.startsWith(`${route}/`))
}

export function canPreviewWidgetLive(url: string | undefined): boolean {
  if (!url?.trim()) return false
  return isWidgetBundleUrl(url.trim())
}

/** @deprecated Préférer canPreviewWidgetLive */
export function isEmbeddableWidgetUrl(url: string): boolean {
  return canPreviewWidgetLive(url)
}

export function getWidgetPreviewImage(widget: WidgetDefinition): string {
  const candidates = [widget.thumbnailUrl, widget.previewUrl].filter(Boolean) as string[]

  for (const url of candidates) {
    if (isImagePreviewUrl(url)) return url
  }

  return "/default-widget-preview.png"
}
