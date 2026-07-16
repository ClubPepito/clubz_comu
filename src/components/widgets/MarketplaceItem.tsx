import type { WidgetDefinition } from '@/types/widgetLibrary';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Box, Layout } from 'lucide-react';
import { WidgetRunner } from './WidgetRunner';
import { resolveWidgetRemoteUrl } from '@/utils/resolveWidgetRemoteUrl';
import { resolveImageUrl } from '@/lib/imageUrl';
import { cn } from '@/lib/utils';

interface Props {
  widget: WidgetDefinition;
  onInstall: () => void;
}

export function MarketplaceItem({ widget }: Props) {
  const previewUrl = resolveWidgetRemoteUrl(widget.remoteUrl);
  const isPage = widget.type === 'Page';
  const TypeIcon = isPage ? Layout : Box;
  const authorName = widget.author?.username || widget.author?.name || 'Développeur';
  const authorSeed = widget.author?.username || widget.authorId || 'dev';

  return (
    <article
      className={cn(
        'group relative flex h-[320px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card',
        'shadow-klyb-sm transition-all duration-300',
        'hover:-translate-y-1 hover:border-primary/25 hover:shadow-klyb',
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

        <div className="absolute left-3 top-3 z-[3] flex items-center gap-1.5">
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

          {widget.tags && widget.tags.length > 0 && (
            <span className="shrink-0 rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {widget.tags[0]}
              {widget.tags.length > 1 ? ` +${widget.tags.length - 1}` : ''}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
