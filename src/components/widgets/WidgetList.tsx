import type { WidgetDefinition } from '@/types/widgetLibrary';
import { Trash2, Globe, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

export function WidgetList({ widgets, onSelect, onDelete, onSubmit, readOnly = false }: Props) {
  if (widgets.length === 0) {
    return (
      <div className="border-2 border-dashed border-border rounded-2xl py-16 text-center text-muted-foreground">
        <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Aucun widget trouvé.</p>
        <p className="text-sm mt-1">Développez votre premier widget via la CLI Clubz.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {widgets.map((widget) => {
        const statusInfo = STATUS_LABELS[widget.status] ?? STATUS_LABELS.draft;
        return (
          <Card
            key={widget.id}
            onClick={() => onSelect?.(widget)}
            className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden border-border bg-white dark:bg-slate-900 dark:border-slate-800"
          >
            <div className={`h-1 w-full ${widget.isPublic ? 'bg-purple-500' : 'bg-blue-500'}`} />

            <CardHeader className="p-5 pb-2">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className={widget.type === 'Page' ? 'bg-teal-50 text-teal-700' : ''}>
                  {widget.type === 'Page' ? 'PAGE' : widget.type}
                </Badge>
                <Badge className={`text-[10px] px-1.5 py-0 ${statusInfo.className}`}>
                  {statusInfo.label}
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-foreground dark:text-slate-100 mb-1 group-hover:text-primary transition-colors line-clamp-1">
                {widget.name}
              </h3>
            </CardHeader>

            <CardContent className="p-5 pt-0">
              <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-2 h-10 font-medium leading-relaxed">
                {widget.description ?? 'Pas de description'}
              </p>
              {widget.tags && widget.tags.length > 0 && (
                <div className="flex gap-1 mt-2 overflow-hidden h-5">
                  {widget.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter className="p-5 pt-0 mt-auto flex justify-between items-center border-t border-border/50">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Clock className="w-3.5 h-3.5" />
                {new Date(widget.updatedAt).toLocaleDateString('fr-FR')}
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!readOnly && onSubmit && widget.status === 'draft' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Soumettre pour validation"
                    className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    onClick={(e) => { e.stopPropagation(); onSubmit(widget.id); }}
                  >
                    <Globe className="w-4 h-4" />
                  </Button>
                )}
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
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
