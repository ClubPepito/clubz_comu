import type { WidgetDefinition } from "@/types/widgetLibrary"
import { MonitorPlay } from "lucide-react"
import { WidgetRunner } from "./WidgetRunner"
import {
  canPreviewWidgetLive,
  getWidgetPreviewImage,
  isAdminAppUrl,
} from "@/lib/widget-preview"

interface WidgetLivePreviewProps {
  widget: WidgetDefinition
  className?: string
  iframeClassName?: string
}

export function WidgetLivePreview({
  widget,
  className = "flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-4",
  iframeClassName = "h-[min(500px,55vh)] w-full rounded-lg border border-border bg-background",
}: WidgetLivePreviewProps) {
  if (widget.remoteUrl && canPreviewWidgetLive(widget.remoteUrl)) {
    return (
      <div className={className}>
        <WidgetRunner
          widgetId={widget.id}
          remoteUrl={widget.remoteUrl}
          name={widget.name}
          className={iframeClassName}
        />
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="w-full space-y-4 text-center">
        {widget.remoteUrl || widget.previewUrl || widget.thumbnailUrl ? (
          <img
            src={getWidgetPreviewImage(widget)}
            alt={`Aperçu de ${widget.name}`}
            className="mx-auto aspect-video w-full max-w-xl rounded-lg border border-border object-cover"
          />
        ) : (
          <MonitorPlay className="mx-auto text-muted-foreground/50" />
        )}
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {widget.remoteUrl && isAdminAppUrl(widget.remoteUrl)
            ? "Cette URL pointe vers l'application admin et non vers le bundle du widget. Le développeur doit redéployer le widget via la CLI pour générer une URL MinIO/S3 valide."
            : widget.remoteUrl
              ? "Aperçu interactif indisponible. Vérifiez que le widget a bien été déployé sur le stockage widget (MinIO/S3)."
              : "Aucun aperçu disponible. Le développeur doit déployer le widget via la CLI."}
        </p>
      </div>
    </div>
  )
}
