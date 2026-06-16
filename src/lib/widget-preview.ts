import type { WidgetDefinition } from "@/types/widgetLibrary"

const IMAGE_URL_PATTERN = /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i

/** Routes SPA de l'admin — à ne pas charger dans une iframe d'aperçu widget. */
const ADMIN_SPA_ROUTES = [
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

/**
 * Détecte si l'URL pointe vers l'app admin (et non vers un bundle widget hébergé).
 * Le commit 84f2e1d bloquait toute URL same-origin, ce qui cassait les previews
 * légitimes servies via l'API ou des assets statiques sur le même host.
 */
export function isAdminAppUrl(url: string): boolean {
  const parsed = parseUrl(url)
  if (!parsed) return true

  if (parsed.origin !== window.location.origin) return false

  const path = normalizePath(parsed.pathname)

  if (path.startsWith("/api/")) return false
  if (/\.(html?|js|css|mjs)(\?.*)?$/i.test(path)) return false
  if (path.includes("/widgets/") || path.includes("/widget-library/")) return false

  if (path === "/") return true

  return ADMIN_SPA_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  )
}

export function canPreviewWidgetLive(url: string | undefined): boolean {
  if (!url?.trim()) return false
  return !isAdminAppUrl(url)
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
