import { useState, useMemo, useEffect } from 'react';
import { Search, Layout, Box, Globe, Filter, Loader2, Sparkles } from 'lucide-react';
import type { WidgetDefinition } from '@/types/widgetLibrary';
import { MarketplaceItem } from '@/components/widgets/MarketplaceItem';
import { WidgetPreviewDialog } from '@/components/widgets/WidgetPreviewDialog';
import { useWidgetLibraryStore } from '@/store/widgetLibraryStore';
import { widgetInstallationService } from '@/services/api';
import { useCommunity } from '@/context/CommunityContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AtmosphericHeader } from '@/components/layout/AtmosphericHeader';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function Marketplace() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [previewWidget, setPreviewWidget] = useState<WidgetDefinition | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { getValidated, fetchMarketplace, isLoading } = useWidgetLibraryStore();
  const { selectedCommunityId } = useCommunity();

  useEffect(() => {
    fetchMarketplace();
  }, [fetchMarketplace]);

  const widgets = getValidated();

  const counts = useMemo(() => {
    const pages = widgets.filter((w) => w.type === 'Page').length;
    return {
      all: widgets.length,
      widgets: widgets.length - pages,
      pages,
    };
  }, [widgets]);

  const filteredWidgets = useMemo(() => {
    return widgets.filter((w) => {
      const matchesSearch =
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        (w.description ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesTab =
        activeTab === 'all'
          ? true
          : activeTab === 'pages'
            ? w.type === 'Page'
            : w.type !== 'Page';
      return matchesSearch && matchesTab;
    });
  }, [widgets, search, activeTab]);

  const handlePreview = (widget: WidgetDefinition) => {
    setPreviewWidget(widget);
    setShowPreview(true);
  };

  const handleInstall = async (widget: WidgetDefinition) => {
    if (!selectedCommunityId) {
      toast.error("Sélectionnez une communauté dans la barre latérale avant d'installer un widget.");
      return;
    }
    try {
      const perms = (widget.permissions ?? []).map((p) => p.name);
      await widgetInstallationService.install(widget.id, selectedCommunityId, perms);
      toast.success(`"${widget.name}" installé dans votre communauté !`);
      setShowPreview(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Erreur lors de l'installation.");
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      <AtmosphericHeader
        title="Marketplace"
        description="Découvrez des widgets et pages créés par la communauté pour enrichir votre espace."
        meta={
          !isLoading ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              {counts.all} extension{counts.all !== 1 ? 's' : ''} disponible{counts.all !== 1 ? 's' : ''}
              {search || activeTab !== 'all'
                ? ` · ${filteredWidgets.length} résultat${filteredWidgets.length !== 1 ? 's' : ''}`
                : ''}
            </p>
          ) : undefined
        }
      >
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            className="h-11 rounded-xl border-border/80 bg-card/90 pl-9 shadow-sm backdrop-blur-sm"
            placeholder="Rechercher un widget, une page…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </AtmosphericHeader>

      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6 h-11 gap-1 rounded-xl border border-border/50 bg-muted/40 p-1">
          <TabsTrigger value="all" className="gap-2 rounded-lg px-4 data-[state=active]:shadow-sm">
            <Globe className="size-4" />
            Tout
            <span
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                activeTab === 'all' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              {counts.all}
            </span>
          </TabsTrigger>
          <TabsTrigger value="widgets" className="gap-2 rounded-lg px-4 data-[state=active]:shadow-sm">
            <Box className="size-4" />
            Widgets
            <span
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                activeTab === 'widgets' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              {counts.widgets}
            </span>
          </TabsTrigger>
          <TabsTrigger value="pages" className="gap-2 rounded-lg px-4 data-[state=active]:shadow-sm">
            <Layout className="size-4" />
            Pages
            <span
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                activeTab === 'pages' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              {counts.pages}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-sm">Chargement de la marketplace…</span>
            </div>
          ) : filteredWidgets.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredWidgets.map((widget) => (
                <div
                  key={widget.id}
                  onClick={() => handlePreview(widget)}
                  className="cursor-pointer"
                >
                  <MarketplaceItem widget={widget} onInstall={() => handleInstall(widget)} />
                </div>
              ))}
            </div>
          ) : (
            <Empty className="border-2 border-dashed border-border/80 bg-muted/20 py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="size-12 rounded-2xl bg-muted text-muted-foreground [&_svg]:size-5">
                  <Filter />
                </EmptyMedia>
                <EmptyTitle className="text-base">Aucun résultat</EmptyTitle>
                <EmptyDescription>
                  Essayez de modifier votre recherche ou vos filtres pour trouver une extension.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setActiveTab('all');
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </TabsContent>
      </Tabs>

      <WidgetPreviewDialog
        widget={previewWidget}
        open={showPreview}
        onClose={() => setShowPreview(false)}
        onInstall={() => previewWidget && handleInstall(previewWidget)}
      />
    </div>
  );
}
