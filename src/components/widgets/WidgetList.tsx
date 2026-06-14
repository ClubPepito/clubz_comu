import type { WidgetDefinition } from '@/types/widgetLibrary';
import { BRAND_NAME } from '@/constants/branding';
import { Trash2, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Props {
  widgets: WidgetDefinition[];
  onSelect?: (widget: WidgetDefinition) => void;
  onDelete?: (id: string) => void;
  onSubmit?: (id: string) => void;
  readOnly?: boolean;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  pending: { label: 'En attente', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' },
  validated: { label: 'Validé', className: 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400' },
  rejected: { label: 'Rejeté', className: 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' },
  blocked: { label: 'Bloqué', className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' },
};

export function WidgetList({ widgets, onSelect, onDelete, readOnly = false }: Props) {
  if (widgets.length === 0) {
    return (
      <div className="border-2 border-dashed border-border rounded-2xl py-16 text-center text-muted-foreground">
        <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Aucun widget trouvé.</p>
        <p className="text-sm mt-1">Développez votre premier widget via la CLI ${BRAND_NAME}.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {widgets.map((widget) => {
        const statusInfo = STATUS_LABELS[widget.status] ?? STATUS_LABELS.draft;
        return (
          <div
            key={widget.id}
            onClick={() => onSelect?.(widget)}
            className="group bg-card rounded-2xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-[280px]"
          >
            {/* Zone d'aperçu de l'image */}
            <div className="h-40 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden">
              <img 
                src={widget.previewUrl || '/default-widget-preview.png'} 
                alt={`Aperçu de ${widget.name}`} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-3 right-3 flex gap-2">
                <Badge className={`text-[10px] px-1.5 py-0 ${statusInfo.className}`}>
                  {statusInfo.label}
                </Badge>
                <Badge variant="secondary" className="bg-black/50 backdrop-blur-md text-white border-white/20 rounded-full px-3 py-1 font-semibold tracking-wide shadow-sm">
                  WIDGET
                </Badge>
              </div>
            </div>

            {/* Informations du widget */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-xl font-bold text-foreground line-clamp-1 flex-1" title={widget.name}>
                  {widget.name}
                </h3>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={widget.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${widget.author?.username || widget.authorId}`} />
                    <AvatarFallback>{widget.author?.username?.charAt(0)?.toUpperCase() || 'D'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-muted-foreground truncate max-w-[100px]">
                    {widget.author?.username || widget.author?.name || 'Développeur'}
                  </span>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">

                {!readOnly && onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Supprimer"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Supprimer ce widget définitivement ?')) onDelete(widget.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
