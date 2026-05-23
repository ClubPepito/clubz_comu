import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import { Toolbox } from '@/components/page-builder/Toolbox';
import { Canvas } from '@/components/page-builder/Canvas';
import { PropertiesPanel } from '@/components/page-builder/PropertiesPanel';
import type { PageWidget, WidgetType } from '@/types/layout';
import { pageService } from '@/services/api';
import { useCommunity } from '@/context/CommunityContext';
import {
  Smartphone, Home as HomeIcon, Search as SearchIcon, Bell as BellIcon, User as UserIcon,
  Menu, Share2, Settings, PenSquare, Wifi, Signal, Battery,
  Save, Loader2, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

function getDefaultConfig(type: WidgetType): any {
  switch (type) {
    case 'Header': return { communityName: 'Ma Communauté', showJoinButton: true };
    case 'Feed': return { limit: 5, showAuthor: true };
    case 'EventList': return { limit: 3, showPastEvents: false };
    case 'CustomHTML': return { html: '<div class="p-4"><h3>Hello</h3></div>' };
    default: return {};
  }
}

export default function PageBuilderPage() {
  const [widgets, setWidgets] = useState<PageWidget[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [pageId, setPageId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);

  const { selectedCommunityId } = useCommunity();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Load existing page from backend when community changes
  useEffect(() => {
    if (!selectedCommunityId) {
      setWidgets([]);
      setPageId(null);
      return;
    }
    const load = async () => {
      setLoadingPage(true);
      try {
        const res = await pageService.getByCommunity(selectedCommunityId, 'draft');
        const pages = res.data;
        if (pages && pages.length > 0) {
          const page = pages[0];
          setPageId(page.id);
          setWidgets(page.layout?.widgets ?? []);
        } else {
          setPageId(null);
          setWidgets([]);
        }
      } catch {
        // No page yet — start fresh
        setPageId(null);
        setWidgets([]);
      } finally {
        setLoadingPage(false);
      }
    };
    load();
  }, [selectedCommunityId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) { setActiveId(null); return; }

    if (active.data.current?.isToolboxItem) {
      const type = active.data.current.type as WidgetType;
      const newWidget: PageWidget = {
        id: uuidv4(),
        type,
        order: widgets.length,
        config: getDefaultConfig(type),
      } as PageWidget;
      setWidgets([...widgets, newWidget]);
    } else if (active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
    setSaved(false);
  };

  const handleDelete = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id));
    if (selectedWidgetId === id) setSelectedWidgetId(null);
    setSaved(false);
  };

  const handleUpdateConfig = (id: string, newConfig: any) => {
    setWidgets(widgets.map((w) => (w.id === id ? { ...w, config: newConfig } : w)));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedCommunityId) {
      toast.error('Sélectionnez une communauté avant de sauvegarder.');
      return;
    }
    setSaving(true);
    try {
      const layout = { widgets };
      if (pageId) {
        await pageService.update(pageId, { layout });
      } else {
        const res = await pageService.create({
          name: 'Page principale',
          layout,
          communityId: selectedCommunityId,
          status: 'draft',
        });
        setPageId(res.data.id);
      }
      setSaved(true);
      toast.success('Page sauvegardée !');
    } catch {
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const selectedWidget = widgets.find((w) => w.id === selectedWidgetId);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/80 backdrop-blur">
        <div>
          <h1 className="text-lg font-bold text-foreground">Page Builder</h1>
          <p className="text-xs text-muted-foreground">
            {selectedCommunityId ? 'Composez la page mobile de votre communauté.' : 'Sélectionnez une communauté pour commencer.'}
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !selectedCommunityId}
          className="gap-2"
          variant={saved ? 'outline' : 'default'}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...</>
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4 text-green-500" /> Sauvegardé</>
          ) : (
            <><Save className="w-4 h-4" /> Sauvegarder</>
          )}
        </Button>
      </div>

      {!selectedCommunityId ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground gap-3 flex-col">
          <Smartphone className="w-12 h-12 opacity-30" />
          <p className="font-medium">Sélectionnez une communauté dans la barre latérale</p>
          <p className="text-sm">Le Page Builder chargera automatiquement la page de votre communauté.</p>
        </div>
      ) : loadingPage ? (
        <div className="flex-1 flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Chargement de la page...</span>
        </div>
      ) : (
        <div className="flex-1 flex bg-slate-100 dark:bg-slate-950 overflow-hidden">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {/* Left: Toolbox */}
            <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 overflow-y-auto flex-shrink-0">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Blocs disponibles</h3>
              <Toolbox />
            </div>

            {/* Center: Canvas (Mobile View) */}
            <div className="flex-1 flex justify-center items-start p-8 bg-slate-100 dark:bg-slate-950 overflow-y-auto">
              <div className="relative">
                {/* Mobile Frame */}
                <div className="w-[375px] h-[812px] bg-white rounded-[3rem] shadow-2xl border-8 border-slate-900 overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="absolute top-0 left-0 right-0 h-14 z-30 flex justify-between items-start px-6 pt-2 text-slate-900 dark:text-white">
                    <span className="text-sm font-semibold tracking-wider">9:41</span>
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full z-30" />
                    <div className="flex gap-1.5 items-center">
                      <Signal className="w-4 h-4" />
                      <Wifi className="w-4 h-4" />
                      <Battery className="w-5 h-5 rotate-90" />
                    </div>
                  </div>

                  {/* App Header */}
                  <div className="absolute top-0 left-0 right-0 h-32 bg-white dark:bg-slate-900 z-20 pt-14 px-4 flex flex-col justify-between text-slate-900 dark:text-white shadow-sm border-b border-slate-100 dark:border-transparent">
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Menu className="w-6 h-6 flex-shrink-0" />
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/20 flex-shrink-0" />
                          <span className="font-bold text-lg truncate">Ma Communauté</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <BellIcon className="w-5 h-5" />
                        <PenSquare className="w-5 h-5" />
                        <Share2 className="w-5 h-5" />
                        <Settings className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex gap-6 text-sm font-medium mt-auto px-1">
                      <div className="pb-3 border-b-2 border-indigo-600 text-indigo-900 dark:text-white dark:border-indigo-400">À propos</div>
                      <div className="pb-3 text-slate-500 dark:text-slate-400">Événements</div>
                      <div className="pb-3 text-slate-500 dark:text-slate-400">Membres</div>
                    </div>
                  </div>

                  {/* Screen Content */}
                  <div className="h-full w-full overflow-y-auto pt-36 pb-20 bg-slate-50 dark:bg-slate-950">
                    <Canvas
                      widgets={widgets}
                      onSelect={setSelectedWidgetId}
                      selectedId={selectedWidgetId}
                      onDelete={handleDelete}
                    />
                  </div>

                  {/* Bottom Nav */}
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center px-2 pb-4 text-slate-400">
                    {[
                      { icon: <HomeIcon className="w-6 h-6" />, label: 'Accueil', active: true },
                      { icon: <SearchIcon className="w-6 h-6" />, label: 'Explorer' },
                      { icon: <BellIcon className="w-6 h-6" />, label: 'Notifs' },
                      { icon: <UserIcon className="w-6 h-6" />, label: 'Profil' },
                    ].map(({ icon, label, active }) => (
                      <div key={label} className={`flex flex-col items-center gap-1 p-2 rounded-xl ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {icon}
                        <span className="text-[10px] font-medium">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Properties Panel */}
            <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 overflow-y-auto flex-shrink-0">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Propriétés</h3>
              {selectedWidget ? (
                <PropertiesPanel
                  widget={selectedWidget}
                  onChange={(cfg) => handleUpdateConfig(selectedWidget.id, cfg)}
                />
              ) : (
                <div className="text-slate-400 text-center mt-10 text-sm">
                  Sélectionnez un bloc pour l'éditer
                </div>
              )}
            </div>

            <DragOverlay>
              {activeId ? (
                <div className="px-4 py-2 bg-primary text-primary-foreground rounded shadow-lg opacity-80">
                  Déplacement en cours...
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  );
}
