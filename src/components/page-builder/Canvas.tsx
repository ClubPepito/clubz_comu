import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PageWidget } from '@/types/layout';
import { Trash, GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function Canvas({
  widgets,
  onSelect,
  selectedId,
  onDelete,
}: {
  widgets: PageWidget[];
  onSelect: (id: string) => void;
  selectedId: string | null;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: 'canvas' });

  return (
    <div ref={setNodeRef} className="min-h-full p-2 pb-20 space-y-2">
      <SortableContext items={widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
        {widgets.map((widget) => (
          <SortableWidget
            key={widget.id}
            widget={widget}
            isSelected={selectedId === widget.id}
            onSelect={() => onSelect(widget.id)}
            onDelete={() => onDelete(widget.id)}
          />
        ))}
      </SortableContext>

      {widgets.length === 0 && (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl h-40 flex items-center justify-center text-slate-400 text-sm bg-slate-50/50 dark:bg-slate-800/50">
          Déposez des widgets ici
        </div>
      )}
    </div>
  );
}

function SortableWidget({
  widget,
  isSelected,
  onSelect,
  onDelete,
}: {
  widget: PageWidget;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`relative overflow-hidden group cursor-pointer transition-all bg-white dark:bg-slate-900 dark:border-slate-800 ${
        isSelected ? 'ring-2 ring-primary border-primary shadow-lg' : 'hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 p-1.5 text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur rounded-md cursor-grab active:cursor-grabbing border border-border/50"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Content Preview */}
      <CardContent className="p-4 pt-10 select-none">
        <div className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
          {widget.type}
        </div>
        {renderPreview(widget)}
      </CardContent>

      {/* Delete Button */}
      <Button
        variant="destructive"
        size="icon"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className={`absolute top-2 right-2 h-7 w-7 transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <Trash className="w-3 h-3" />
      </Button>
    </Card>
  );
}

function renderPreview(widget: PageWidget) {
  const cfg = widget.config as any;
  switch (widget.type) {
    case 'Header':
      return <div className="text-lg font-bold text-foreground">{cfg.communityName || 'Ma Communauté'}</div>;
    case 'Feed':
      return (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-2 bg-muted rounded w-full" />)}
        </div>
      );
    case 'EventList':
      return <div className="text-muted-foreground text-xs italic">Liste d'événements ({cfg.limit ?? 3} max)</div>;
    case 'CustomHTML':
      return <div className="text-muted-foreground font-mono text-xs truncate">{cfg.html?.substring(0, 60) ?? '...'}</div>;
    default:
      return <div className="text-muted-foreground italic text-sm">Contenu du widget</div>;
  }
}
