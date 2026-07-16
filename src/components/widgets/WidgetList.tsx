import type { WidgetDefinition } from '@/types/widgetLibrary';
import { BRAND_NAME } from '@/constants/branding';
import { Trash2, Box, Layout, Terminal, Clock, CheckCircle2, XCircle, FileEdit, Ban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { WidgetRunner } from './WidgetRunner';
import { resolveWidgetRemoteUrl } from '@/utils/resolveWidgetRemoteUrl';
import { resolveImageUrl } from '@/lib/imageUrl';
import { cn } from '@/lib/utils';

interface Props {
  widgets: WidgetDefinition[];
  onSelect?: (widget: WidgetDefinition) => void;
  onDelete?: (id: string) => void;
  onSubmit?: (id: string) => void;
  readOnly?: boolean;
}

const STATUS_META: Record<
  string,
  { label: string; className: string; icon: typeof FileEdit }
> = {
  draft: {
    label: 'Brouillon',
    className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    icon: FileEdit,
  },
  pending: {
    label: 'En attente',
    className: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    icon: Clock,
  },
  validated: {
    label: 'Validé',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejeté',
    className: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    icon: XCircle,
  },
  blocked: {
    label: 'Bloqué',
    className: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    icon: Ban,
  },
};

export function WidgetList({ widgets, onSelect, onDelete, readOnly = false }: Props) {
  if (widgets.length === 0) {
    return (
      <Empty className="border-2 border-dashed border-border/80 bg-muted/20 py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-12 rounded-2xl bg-primary/10 text-primary [&_svg]:size-5">
            <Terminal />
          </EmptyMedia>
          <EmptyTitle className="text-base">Aucun widget trouvé</EmptyTitle>
          <EmptyDescription>
            Développez votre premier widget via la CLI {BRAND_NAME}, puis déployez-le pour le voir apparaître ici.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <code className="rounded-lg bg-muted px-3 py-1.5 font-mono text-xs text-foreground">
            npx @{BRAND_NAME.toLowerCase()}/cli init mon-widget
          </code>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {widgets.map((widget) => {
        const statusInfo = STATUS_META[widget.status] ?? STATUS_META.draft;
        const StatusIcon = statusInfo.icon;
        const previewUrl = resolveWidgetRemoteUrl(widget.remoteUrl);
        const isPage = widget.type === 'Page';
        const TypeIcon = isPage ? Layout : Box;
        const authorName = widget.author?.username || widget.author?.name || 'Développeur';
        const authorSeed = widget.author?.username || widget.authorId || 'dev';

        return (
          <article
            key={widget.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect?.(widget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.(widget);
              }
            }}
            className={cn(
              'group relative flex h-[320px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/80 bg-card',
              'shadow-klyb-sm transition-all duration-300 outline-none',
              'hover:-translate-y-1 hover:border-primary/25 hover:shadow-klyb',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            )}
          >
            <div className="relative h-[168px] overflow-hidden bg-gradient-to-br from-secondary via-accent to-muted">
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, rgba(255,255,255,.35) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,.35) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,.35) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,.35) 75%)',
                  backgroundSize: '12px 12px',
                  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
                }}
              />

              {previewUrl ? (
                <WidgetRunner
                  widgetId={widget.id}
                  remoteUrl={widget.remoteUrl!}
                  name={widget.name}
                  variant="thumbnail"
                  className="relative z-[1] h-full w-full"
                />
              ) : (
                <img
                  src={resolveImageUrl(widget.previewUrl) || '/default-widget-preview.png'}
                  alt={`Aperçu de ${widget.name}`}
                  className="relative z-[1] h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}

              <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-card/90 via-transparent to-transparent opacity-80" />

              <div className="absolute left-3 top-3 z-[3] flex flex-wrap items-center gap-1.5">
                <Badge
                  className={cn(
                    'gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold shadow-sm',
                    statusInfo.className,
                  )}
                >
                  <StatusIcon className="size-3" />
                  {statusInfo.label}
                </Badge>
              </div>

              <div className="absolute right-3 top-3 z-[3]">
                <Badge
                  variant="secondary"
                  className="gap-1 rounded-md border border-white/20 bg-foreground/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-md"
                >
                  <TypeIcon className="size-3" />
                  {isPage ? 'Page' : 'Widget'}
                </Badge>
              </div>

              {widget.semanticVersion && (
                <div className="absolute bottom-3 right-3 z-[3]">
                  <span className="rounded-md bg-card/90 px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                    v{widget.semanticVersion}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
              <h3 className="truncate text-base font-semibold tracking-tight text-foreground" title={widget.name}>
                {widget.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {widget.description?.trim() || 'Aucune description fournie.'}
              </p>

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar className="size-6 ring-1 ring-border/60">
                    <AvatarImage
                      src={
                        resolveImageUrl(widget.author?.avatar) ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorSeed}`
                      }
                    />
                    <AvatarFallback className="text-[9px]">{authorName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="truncate text-xs font-medium text-muted-foreground">{authorName}</span>
                </div>

                {!readOnly && onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Supprimer"
                    className="size-8 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Supprimer ce widget définitivement ?')) onDelete(widget.id);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
