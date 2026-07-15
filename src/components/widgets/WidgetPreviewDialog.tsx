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

function normalizePermissions(raw: WidgetDefinition['permissions']): Array<{ key: string; label: string; description: string; icon: LucideIcon }> {
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

export function WidgetPreviewDialog({ widget, open, onClose }: Props) {
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
      <DialogContent className="w-[calc(100%-2rem)] max-w-6xl p-0 gap-0 overflow-hidden sm:max-w-5xl lg:max-w-6xl">
        <DialogHeader className="px-8 pt-7 pb-5 space-y-3 border-b border-border/60 text-left">
          <div className="flex items-start gap-4 pr-10">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <TypeIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-xl font-bold tracking-tight">{widget.name}</DialogTitle>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide font-semibold">
                  {widget.type}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={resolveImageUrl(widget.author?.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorSeed}`} />
                  <AvatarFallback className="text-[9px]">{authorName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{authorName}</span>
                {widget.semanticVersion && (
                  <>
                    <span aria-hidden>·</span>
                    <span>v{widget.semanticVersion}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {widget.description ?? 'Aucune description fournie par le développeur.'}
          </DialogDescription>
        </DialogHeader>

        <div className={cn('grid', hasMeta ? 'lg:grid-cols-[1fr_360px]' : 'grid-cols-1')}>
          <div className="px-8 py-7 bg-muted/30 lg:border-r border-border/60">
            {previewUrl ? (
              <div className="mx-auto w-full max-w-[520px]">
                <div
                  className="rounded-[1.35rem] overflow-hidden border-[3px] border-foreground/10 shadow-lg bg-[#0f172a]"
                  style={{ height: Math.min(Math.max(previewHeight, 320), 540) }}
                >
                  <WidgetRunner
                    widgetId={widget.id}
                    remoteUrl={widget.remoteUrl!}
                    name={widget.name}
                    className="w-full h-full"
                    onResize={(height) => setPreviewHeight(height + 8)}
                  />
                </div>
                <p className="text-center text-[11px] text-muted-foreground mt-3">
                  Aperçu live — le rendu final dépend de la config de votre communauté
                </p>
              </div>
            ) : (
              <div className="mx-auto max-w-[520px] rounded-[1.35rem] border-2 border-dashed border-border bg-background/60 h-56 flex items-center justify-center text-muted-foreground text-sm">
                Aucun aperçu disponible
              </div>
            )}
          </div>

          {hasMeta && (
            <div className="px-8 py-7 space-y-5 bg-background">
              {widget.tags && widget.tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
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
                <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Permissions requises
                  </p>
                  <ul className="space-y-3">
                    {permissions.map((perm) => {
                      const Icon = perm.icon;
                      return (
                        <li key={perm.key} className="flex items-start gap-2.5 text-sm">
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground border border-border/60">
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <span className="min-w-0 pt-0.5">
                            <span className="font-medium text-foreground">{perm.label}</span>
                            <span className="block text-xs text-muted-foreground leading-snug mt-0.5">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
