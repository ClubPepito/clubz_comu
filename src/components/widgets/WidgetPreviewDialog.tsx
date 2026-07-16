import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Box,
  Layout,
  Tag,
  Shield,
  Wifi,
  Camera,
  MapPin,
  HardDrive,
  Bell,
  Mic,
  Download,
  type LucideIcon,
} from 'lucide-react';
import type { WidgetDefinition, WidgetPermission } from '@/types/widgetLibrary';
import { WidgetRunner } from './WidgetRunner';
import { resolveWidgetRemoteUrl } from '@/utils/resolveWidgetRemoteUrl';
import { resolveImageUrl } from '@/lib/imageUrl';
import { cn } from '@/lib/utils';

interface Props {
  widget: WidgetDefinition | null;
  open: boolean;
  onClose: () => void;
  onInstall: () => void;
}

const PERMISSION_META: Record<
  string,
  { label: string; description: string; icon: LucideIcon }
> = {
  network: {
    label: 'Réseau',
    description: 'Requêtes HTTP vers des API externes',
    icon: Wifi,
  },
  camera: {
    label: 'Appareil photo',
    description: 'Accès à la caméra de l’appareil',
    icon: Camera,
  },
  geolocation: {
    label: 'Géolocalisation',
    description: 'Position GPS de l’utilisateur',
    icon: MapPin,
  },
  storage: {
    label: 'Stockage local',
    description: 'Lecture/écriture en local',
    icon: HardDrive,
  },
  notifications: {
    label: 'Notifications',
    description: 'Envoi de notifications push',
    icon: Bell,
  },
  microphone: {
    label: 'Microphone',
    description: 'Accès au micro',
    icon: Mic,
  },
};

function normalizePermissions(
  raw: WidgetDefinition['permissions'],
): Array<{ key: string; label: string; description: string; icon: LucideIcon }> {
  if (!raw) return [];

  let keys: string[] = [];

  if (Array.isArray(raw)) {
    keys = raw.flatMap((entry) => {
      if (typeof entry === 'string') return [entry];
      const perm = entry as WidgetPermission;
      return perm.name ? [perm.name] : [];
    });
  } else if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.features)) {
      keys = obj.features as string[];
    } else {
      keys = Object.entries(obj)
        .filter(([, value]) => value === true)
        .map(([key]) => key);
    }
  }

  return [...new Set(keys)].map((key) => {
    const meta = PERMISSION_META[key];
    return {
      key,
      label: meta?.label ?? key,
      description: meta?.description ?? 'Permission demandée par le widget',
      icon: meta?.icon ?? Shield,
    };
  });
}

export function WidgetPreviewDialog({ widget, open, onClose, onInstall }: Props) {
  const [previewHeight, setPreviewHeight] = useState(320);

  useEffect(() => {
    setPreviewHeight(320);
  }, [widget?.id]);

  const permissions = useMemo(
    () => (widget ? normalizePermissions(widget.permissions) : []),
    [widget],
  );

  const previewUrl = widget ? resolveWidgetRemoteUrl(widget.remoteUrl) : null;
  const authorName = widget?.author?.username || widget?.author?.name || 'Développeur';
  const authorSeed = widget?.author?.username || widget?.authorId || 'dev';

  if (!widget) return null;

  const TypeIcon = widget.type === 'Page' ? Layout : Box;
  const hasMeta = (widget.tags?.length ?? 0) > 0 || permissions.length > 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-6xl gap-0 overflow-hidden p-0 sm:max-w-5xl lg:max-w-6xl">
        <DialogHeader className="space-y-3 border-b border-border/60 bg-gradient-to-br from-secondary/40 via-card to-accent/30 px-8 pb-5 pt-7 text-left">
          <div className="flex items-start gap-4 pr-10">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-klyb-sm">
              <TypeIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-xl font-bold tracking-tight">{widget.name}</DialogTitle>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold uppercase tracking-wide"
                >
                  {widget.type}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Avatar className="size-5 ring-1 ring-border/50">
                  <AvatarImage
                    src={
                      resolveImageUrl(widget.author?.avatar) ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorSeed}`
                    }
                  />
                  <AvatarFallback className="text-[9px]">
                    {authorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{authorName}</span>
                {widget.semanticVersion && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="font-mono">v{widget.semanticVersion}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {widget.description ?? 'Aucune description fournie par le développeur.'}
          </DialogDescription>
        </DialogHeader>

        <div className={cn('grid', hasMeta ? 'lg:grid-cols-[1fr_340px]' : 'grid-cols-1')}>
          <div className="border-border/60 bg-muted/25 px-8 py-7 lg:border-r">
            {previewUrl ? (
              <div className="mx-auto w-full max-w-[520px]">
                <div
                  className="overflow-hidden rounded-[1.35rem] border border-border/80 bg-gradient-to-br from-secondary via-accent to-muted shadow-klyb"
                  style={{ height: Math.min(Math.max(previewHeight, 320), 540) }}
                >
                  <WidgetRunner
                    widgetId={widget.id}
                    remoteUrl={widget.remoteUrl!}
                    name={widget.name}
                    className="h-full w-full"
                    onResize={(height) => setPreviewHeight(height + 8)}
                  />
                </div>
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  Aperçu live — le rendu final dépend de la config de votre communauté
                </p>
              </div>
            ) : (
              <div className="mx-auto flex h-56 max-w-[520px] items-center justify-center rounded-[1.35rem] border-2 border-dashed border-border bg-background/60 text-sm text-muted-foreground">
                Aucun aperçu disponible
              </div>
            )}
          </div>

          {hasMeta && (
            <div className="space-y-5 bg-background px-8 py-7">
              {widget.tags && widget.tags.length > 0 && (
                <div className="space-y-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Tag className="size-3.5" />
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {widget.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {permissions.length > 0 && (
                <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Shield className="size-3.5" />
                    Permissions requises
                  </p>
                  <ul className="space-y-3">
                    {permissions.map((perm) => {
                      const Icon = perm.icon;
                      return (
                        <li key={perm.key} className="flex items-start gap-2.5 text-sm">
                          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground shadow-sm">
                            <Icon className="size-3.5" />
                          </span>
                          <span className="min-w-0 pt-0.5">
                            <span className="font-medium text-foreground">{perm.label}</span>
                            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                              {perm.description}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border/60 bg-muted/20 px-8 py-5 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Fermer
          </Button>
          <Button onClick={onInstall} className="w-full gap-2 sm:w-auto">
            <Download className="size-4" />
            Installer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
