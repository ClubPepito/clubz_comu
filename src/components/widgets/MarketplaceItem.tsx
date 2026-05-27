import type { WidgetDefinition } from '@/types/widgetLibrary';
import { Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';



interface Props {
  widget: WidgetDefinition;
  onInstall: () => void;
}

export function MarketplaceItem({ widget, onInstall }: Props) {
  return (
    <div
      className="group bg-card rounded-2xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden h-[280px]"
    >
      {/* Preview Area */}
      <div className="h-40 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden">
        <img 
          src={widget.previewUrl || '/default-widget-preview.png'} 
          alt={`Aperçu de ${widget.name}`} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-black/50 backdrop-blur-md text-white border-white/20 rounded-full px-3 py-1 font-semibold tracking-wide shadow-sm">
            WIDGET
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-foreground line-clamp-1 mb-1" title={widget.name}>
          {widget.name}
        </h3>

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
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); onInstall(); }}
            className="font-bold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}
