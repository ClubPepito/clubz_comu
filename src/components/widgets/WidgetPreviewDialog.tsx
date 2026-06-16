import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Download, Box, Layout, Info, MonitorPlay } from "lucide-react"
import type { WidgetDefinition } from "@/types/widgetLibrary"
import { PageTabs, PageTabsList, PageTabsTrigger, PageTabsContent } from "@/components/layout/PageTabs"
import { WidgetLivePreview } from "./WidgetLivePreview"

interface Props {
  widget: WidgetDefinition | null
  open: boolean
  onClose: () => void
  onInstall: () => void
}

export function WidgetPreviewDialog({ widget, open, onClose, onInstall }: Props) {
  if (!widget) return null

  const authorName = widget.author?.name || widget.author?.username || "Développeur"
  const authorAvatar =
    widget.author?.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${widget.author?.username || widget.authorId || "dev"}`

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="flex max-h-[min(90vh,800px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <div className="flex items-start gap-3 pr-8">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              {widget.type === "Page" ? <Layout /> : <Box />}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-lg">{widget.name}</DialogTitle>
                <Badge variant="outline">{widget.type}</Badge>
                <Badge variant="secondary" className="font-mono">
                  v{widget.version}
                </Badge>
              </div>
              <DialogDescription>
                {widget.description ?? "Aucune description fournie par le développeur."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <PageTabs defaultValue="info">
            <PageTabsList fullWidth columns={2} className="mb-4 w-full">
              <PageTabsTrigger value="info" icon={Info}>
                Infos
              </PageTabsTrigger>
              <PageTabsTrigger value="preview" icon={MonitorPlay}>
                Aperçu
              </PageTabsTrigger>
            </PageTabsList>

            <PageTabsContent value="info" className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/30 p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={authorAvatar} />
                      <AvatarFallback>{authorName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{authorName}</p>
                      <p className="text-sm text-muted-foreground">Développeur</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {widget.status}
                  </Badge>
                </div>

                <p className="text-sm leading-relaxed text-foreground">
                  {widget.description ?? "Aucune description fournie pour ce widget."}
                </p>
              </div>

              {widget.tags && widget.tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {widget.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {widget.permissions && widget.permissions.length > 0 && (
                <div className="space-y-2 rounded-lg border border-warning/20 bg-warning/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-warning">
                    Permissions requises
                  </p>
                  <ul className="space-y-1">
                    {widget.permissions.map((permission) => (
                      <li
                        key={permission.name}
                        className="flex items-start gap-1.5 text-xs text-muted-foreground"
                      >
                        <span className="mt-0.5">•</span>
                        <span>
                          <strong>{permission.name}</strong>
                          {permission.description ? ` — ${permission.description}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </PageTabsContent>

            <PageTabsContent value="preview">
              <WidgetLivePreview widget={widget} />
            </PageTabsContent>
          </PageTabs>
        </div>

        <DialogFooter className="shrink-0 border-t border-border bg-muted/30 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={onInstall}>
            <Download data-icon="inline-start" />
            Installer dans ma communauté
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
