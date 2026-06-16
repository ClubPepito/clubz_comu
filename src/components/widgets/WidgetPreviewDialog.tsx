import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Box, Layout, Tag } from 'lucide-react';
import type { WidgetDefinition } from '@/types/widgetLibrary';
import { WidgetRunner } from './WidgetRunner';

interface Props {
  widget: WidgetDefinition | null;
  open: boolean;
  onClose: () => void;
  onInstall: () => void;
}

export function WidgetPreviewDialog({ widget, open, onClose, onInstall }: Props) {
  if (!widget) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              {widget.type === 'Page' ? <Layout className="w-5 h-5" /> : <Box className="w-5 h-5" />}
            </div>
            <DialogTitle className="text-xl">{widget.name}</DialogTitle>
            <Badge variant="outline" className="ml-auto">{widget.type}</Badge>
          </div>
          <DialogDescription>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {widget.description ?? 'Aucune description fournie par le développeur.'}
            </p>
          </DialogDescription>
        </DialogHeader>

        {/* Preview iframe via WidgetRunner */}
        {widget.remoteUrl ? (
          <div className="rounded-xl overflow-hidden border border-border bg-muted/30 h-64">
            <WidgetRunner
              widgetId={widget.id}
              remoteUrl={widget.remoteUrl}
              name={widget.name}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 h-40 flex items-center justify-center text-muted-foreground text-sm">
            Aucun aperçu disponible
          </div>
        )}

        {/* Tags */}
        {widget.tags && widget.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            {widget.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        {/* Permissions */}
        {widget.permissions && widget.permissions.length > 0 && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4 space-y-2">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Permissions requises
            </p>
            <ul className="space-y-1">
              {widget.permissions.map((p, i) => (
                <li key={i} className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                  <span className="mt-0.5">•</span> <span><strong>{p.name}</strong>{p.description ? ` — ${p.description}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          <Button onClick={onInstall} className="gap-2">
            <Download className="w-4 h-4" />
            Installer dans ma communauté
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
