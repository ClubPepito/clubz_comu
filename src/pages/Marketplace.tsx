import { useState, useMemo, useEffect } from 'react';
import { Layout, Box, Globe, Filter } from 'lucide-react';
import type { WidgetDefinition } from '@/types/widgetLibrary';
import { MarketplaceItem } from '@/components/widgets/MarketplaceItem';
import { WidgetPreviewDialog } from '@/components/widgets/WidgetPreviewDialog';
import { useWidgetLibraryStore } from '@/store/widgetLibraryStore';
import { widgetInstallationService } from '@/services/api';
import { useCommunity } from '@/context/CommunityContext';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageLoader } from '@/components/layout/PageLoader';
import { PageShell } from '@/components/layout/PageShell';
import { SearchField } from '@/components/layout/SearchField';
import { PageTabs, PageTabsList, PageTabsTrigger, PageTabsContent } from '@/components/layout/PageTabs';
import { toast } from 'sonner';

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
    <PageShell>
      <PageHeader
        title="Marketplace"
        description="Découvrez des widgets et pages créés par la communauté"
        actions={
          <SearchField
            placeholder="Rechercher des widgets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            containerClassName="md:w-80"
          />
        }
      />

      <PageTabs defaultValue="all" onValueChange={(v) => v && setActiveTab(v)}>
        <PageTabsList>
          <PageTabsTrigger value="all" icon={Globe}>
            Tout
          </PageTabsTrigger>
          <PageTabsTrigger value="widgets" icon={Box}>
            Widgets
          </PageTabsTrigger>
          <PageTabsTrigger value="pages" icon={Layout}>
            Pages
          </PageTabsTrigger>
        </PageTabsList>

        <PageTabsContent value={activeTab}>
          {isLoading ? (
            <PageLoader label="Chargement de la marketplace…" />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-muted">
                    <Filter className="text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">Aucun résultat</h3>
                  <p className="mt-1 text-muted-foreground">Essayez de modifier votre recherche ou vos filtres.</p>
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
        </PageTabsContent>
      </PageTabs>

      <WidgetPreviewDialog
        widget={previewWidget}
        open={showPreview}
        onClose={() => setShowPreview(false)}
        onInstall={() => previewWidget && handleInstall(previewWidget)}
      />
    </PageShell>
  );
}
