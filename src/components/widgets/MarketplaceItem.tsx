import type { WidgetDefinition } from '@/types/widgetLibrary';
import { Box, Layout, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const TYPE_COLORS: Record<string, string> = {
  Header: 'bg-gradient-to-br from-blue-400 to-indigo-500',
  Feed: 'bg-gradient-to-br from-emerald-400 to-teal-500',
  Page: 'bg-gradient-to-br from-slate-700 to-slate-900',
  EventList: 'bg-gradient-to-br from-orange-400 to-red-500',
  CoursePlayer: 'bg-gradient-to-br from-purple-400 to-pink-500',
  CustomHTML: 'bg-gradient-to-br from-gray-400 to-gray-600',
};

interface Props {
  widget: WidgetDefinition;
  onInstall: () => void;
}

export function MarketplaceItem({ widget, onInstall }: Props) {
  const bgColor = TYPE_COLORS[widget.type] ?? 'bg-gradient-to-br from-blue-400 to-indigo-500';

  return (
    <div
      className="group bg-card rounded-2xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden h-[340px]"
    >
      {/* Preview Area */}
      <div className={`h-40 ${bgColor} relative flex items-center justify-center p-6`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative bg-white/20 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/30 transform group-hover:scale-110 transition-transform duration-500">
          {widget.type === 'Page'
            ? <Layout className="w-10 h-10 text-white" />
            : <Box className="w-10 h-10 text-white" />}
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-black/40 backdrop-blur text-white border-white/10">
            {widget.type.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-foreground line-clamp-1 mb-2" title={widget.name}>
          {widget.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed flex-1">
          {widget.description ?? 'Aucune description fournie.'}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${widget.authorId}`} />
              <AvatarFallback>CB</AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-muted-foreground truncate max-w-[80px]">
              Développeur
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
