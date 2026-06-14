import { useState, useMemo, useEffect } from 'react';
import { Search, Layout, Box, Globe, Filter, Loader2 } from 'lucide-react';
import type { WidgetDefinition } from '@/types/widgetLibrary';
import { MarketplaceItem } from '@/components/widgets/MarketplaceItem';
import { WidgetPreviewDialog } from '@/components/widgets/WidgetPreviewDialog';
import { useWidgetLibraryStore } from '@/store/widgetLibraryStore';
import { widgetInstallationService } from '@/services/api';
import { useCommunity } from '@/context/CommunityContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
      toast.error('Sélectionnez une communauté dans la barre latérale avant d\'installer un widget.');
      return;
    }
    try {
      const perms = (widget.permissions ?? []).map((p) => p.name);
      await widgetInstallationService.install(widget.id, selectedCommunityId, perms);
      toast.success(`"${widget.name}" installé dans votre communauté !`);
      setShowPreview(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de l\'installation.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      {/* Header + Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Découvrez des widgets et pages créés par la communauté.
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="text"
            className="pl-9"
            placeholder="Rechercher des widgets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Globe className="w-4 h-4" /> Tout
          </TabsTrigger>
          <TabsTrigger value="widgets" className="flex items-center gap-2">
            <Box className="w-4 h-4" /> Widgets
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <Layout className="w-4 h-4" /> Pages
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Chargement de la marketplace...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredWidgets.length > 0 ? (
                filteredWidgets.map((widget) => (
                  <div
                    key={widget.id}
                    onClick={() => handlePreview(widget)}
                    className="cursor-pointer"
                  >
                    <MarketplaceItem
                      widget={widget}
                      onInstall={() => handleInstall(widget)}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Filter className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">Aucun résultat</h3>
                  <p className="text-muted-foreground mt-1">Essayez de modifier votre recherche ou vos filtres.</p>
                  <Button
                    variant="link"
                    onClick={() => { setSearch(''); setActiveTab('all'); }}
                    className="mt-2"
                  >
                    Tout effacer
                  </Button>
                </div>
              )}
            </div>
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
