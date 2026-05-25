import { useDraggable } from '@dnd-kit/core';
import { Layout, MessageSquare, Calendar, PlayCircle, Code } from 'lucide-react';
import type { WidgetType } from '@/types/layout';
import { Button } from '@/components/ui/button';

const TOOLS: { type: WidgetType; label: string; icon: React.ReactNode }[] = [
  { type: 'Header', label: 'En-tête', icon: <Layout className="w-5 h-5" /> },
  { type: 'Feed', label: 'Actualités', icon: <MessageSquare className="w-5 h-5" /> },
  { type: 'EventList', label: 'Événements', icon: <Calendar className="w-5 h-5" /> },
  { type: 'CoursePlayer', label: 'Cours Vidéo', icon: <PlayCircle className="w-5 h-5" /> },
  { type: 'CustomHTML', label: 'Code HTML', icon: <Code className="w-5 h-5" /> },
];

export function Toolbox() {
  return (
    <div className="space-y-3">
      {TOOLS.map((tool) => (
        <DraggableTool key={tool.type} tool={tool} />
      ))}
    </div>
  );
}

function DraggableTool({ tool }: { tool: (typeof TOOLS)[0] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `toolbox-${tool.type}`,
    data: { type: tool.type, isToolboxItem: true },
  });

  return (
    <Button
      variant="outline"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`w-full justify-start gap-3 h-14 text-base font-normal shadow-sm hover:shadow-md hover:border-indigo-200 transition-all ${
        isDragging
          ? 'opacity-50 ring-2 ring-indigo-500'
          : 'bg-white dark:bg-slate-800 dark:border-slate-700 dark:hover:border-indigo-500/50'
      }`}
    >
      <div className="text-muted-foreground dark:text-slate-400">{tool.icon}</div>
      <span className="text-foreground dark:text-slate-200">{tool.label}</span>
    </Button>
  );
}
