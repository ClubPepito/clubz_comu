import type { WidgetDefinition } from "@/types/widgetLibrary"

const IMAGE_URL_PATTERN = /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i

function parseUrl(url: string): URL | null {
  try {
    return new URL(url, window.location.origin)
  } catch {
    return null
  }
}

export function isImagePreviewUrl(url: string): boolean {
  const parsed = parseUrl(url)
  if (!parsed) return false
  return IMAGE_URL_PATTERN.test(parsed.pathname)
}

/** Évite d'embarquer l'admin ou la racine de l'app dans une iframe. */
export function isEmbeddableWidgetUrl(url: string): boolean {
  const parsed = parseUrl(url)
  if (!parsed) return false

  if (parsed.origin === window.location.origin) return false

  const blockedPaths = ["/", "/login", "/cli-auth", "/marketplace", "/developer", "/moderation"]
  if (blockedPaths.includes(parsed.pathname)) return false

  return true
}

export function getWidgetPreviewImage(widget: WidgetDefinition): string {
  const candidates = [widget.thumbnailUrl, widget.previewUrl].filter(Boolean) as string[]

  for (const url of candidates) {
    if (isImagePreviewUrl(url)) return url
  }

  return "/default-widget-preview.png"
}
