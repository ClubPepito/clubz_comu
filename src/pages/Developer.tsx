import { useState, useEffect } from 'react';
import { useWidgetLibraryStore } from '@/store/widgetLibraryStore';
import { useAuth } from '@/context/AuthContext';
import { WidgetList } from '@/components/widgets/WidgetList';
import { Loader2, Key, Trash2, Plus, Copy, Check, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EditWidgetModal } from '@/components/widgets/EditWidgetModal';
import { Documentation } from '@/components/developer/Documentation';
import { BRAND_NAME } from '@/constants/branding';
import { BookOpen, Layers } from 'lucide-react';
import { userService } from '@/services/api';
import { toast } from 'sonner';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTabs, PageTabsList, PageTabsTrigger, PageTabsContent } from '@/components/layout/PageTabs';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { FilterBar } from '@/components/layout/FilterBar';

const FILTER_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'pending', label: 'En attente' },
  { value: 'validated', label: 'Validés' },
  { value: 'rejected', label: 'Rejetés' },
];

export default function Developer() {
  const { definitions, isLoading, fetchMyWidgets, removeDraft, submitForModeration } = useWidgetLibraryStore();
  const { user, refreshUser } = useAuth();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedWidget, setSelectedWidget] = useState<any | null>(null);

  const [localApiKey, setLocalApiKey] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyHint, setApiKeyHint] = useState<string | null>(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (user?.apiKeyHint) {
      setHasApiKey(true);
      setApiKeyHint(user.apiKeyHint);
    } else {
      setHasApiKey(false);
      setApiKeyHint(null);
    }
  }, [user]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingKey(true);
    try {
      const res = await userService.generateApiKey();
      setLocalApiKey(res.data.apiKey);
      setHasApiKey(true);
      setApiKeyHint(`klyb_***${res.data.apiKey.slice(-4)}`);
      if (refreshUser) await refreshUser();
      toast.success('Clé API générée avec succès');
    } catch {
      toast.error('Erreur lors de la génération de la clé API');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleRevoke = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir révoquer cette clé ? Les applications l\'utilisant ne fonctionneront plus.')) return;
    try {
      await userService.revokeApiKey();
      setLocalApiKey(null);
      setHasApiKey(false);
      setApiKeyHint(null);
      if (refreshUser) await refreshUser();
      toast.success('Clé API révoquée');
    } catch {
      toast.error('Erreur lors de la révocation');
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const userWidgets = definitions.filter((w) => user && w.authorId === user.id);
  const displayedWidgets =
    filterStatus === 'all' ? userWidgets : userWidgets.filter((w) => w.status === filterStatus);

  useEffect(() => {
    fetchMyWidgets();
  }, [fetchMyWidgets]);

  return (
    <PageShell>
      <PageHeader
        title="Espace Développeur"
        description={`Gérez vos widgets et vos clés API CLI pour ${BRAND_NAME}.`}
      />

      <PageTabs defaultValue="widgets">
        <PageTabsList>
          <PageTabsTrigger value="widgets" icon={Layers}>
            Vos Créations
          </PageTabsTrigger>
          <PageTabsTrigger value="docs" icon={BookOpen}>
            Documentation
          </PageTabsTrigger>
          <PageTabsTrigger value="api-keys" icon={Key}>
            Clés API
          </PageTabsTrigger>
        </PageTabsList>

        <PageTabsContent value="widgets" className="space-y-6">
          <SectionHeader
            title="Vos Créations"
            description="Déployez et gérez vos widgets depuis l'interface web."
            actions={
              <FilterBar
                options={FILTER_OPTIONS}
                value={filterStatus}
                onChange={setFilterStatus}
                className="border-none bg-transparent p-0"
              />
            }
          />

          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
              <Loader2 className="animate-spin" />
              Chargement de vos widgets...
            </div>
          ) : (
            <WidgetList
              widgets={displayedWidgets}
              onSelect={(widget) => setSelectedWidget(widget)}
              onDelete={(id) => removeDraft(id)}
              onSubmit={(id) => submitForModeration(id)}
              readOnly={false}
            />
          )}
        </PageTabsContent>

        <PageTabsContent value="docs">
          <Documentation />
        </PageTabsContent>

        <PageTabsContent value="api-keys">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <Card>
                <CardHeader className="border-b border-border bg-muted/30">
                  <CardTitle className="flex items-center gap-2">
                    <Key className="text-primary" />
                    Votre Clé API CLI
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {!hasApiKey ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
                        <Key className="mx-auto mb-3 text-muted-foreground" />
                        <p className="font-medium text-muted-foreground">Aucune clé active.</p>
                        <p className="mb-6 text-sm text-muted-foreground">
                          Créez-en une pour commencer à développer via la CLI Klyb.
                        </p>
                        <form onSubmit={handleGenerate}>
                          <Button type="submit" disabled={isGeneratingKey}>
                            {isGeneratingKey ? (
                              <Loader2 data-icon="inline-start" className="animate-spin" />
                            ) : (
                              <Plus data-icon="inline-start" />
                            )}
                            Générer ma clé API
                          </Button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="group flex flex-col rounded-xl border border-border bg-muted/30 p-4 transition-all">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">Clé Principale</span>
                            <Badge variant="outline" className="border-success/20 bg-success/10 text-xs font-normal text-success">
                              Active
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRevoke}
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 data-icon="inline-start" />
                            Révoquer
                          </Button>
                        </div>

                        {localApiKey ? (
                          <>
                            <div className="mb-4 rounded-xl border border-success/20 bg-success/10 p-4 text-sm text-success">
                              <strong>Nouvelle clé générée !</strong> Copiez-la maintenant. Pour des raisons de sécurité, vous ne pourrez plus la voir une fois cette page fermée.
                            </div>
                            <div className="flex items-center justify-between break-all rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm text-muted-foreground">
                              <span>{localApiKey}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(localApiKey)}
                                className="ml-4 shrink-0 rounded-md bg-muted/50 p-2 text-muted-foreground transition-colors hover:text-primary"
                              >
                                {copiedKey === localApiKey ? (
                                  <Check className="text-success" />
                                ) : (
                                  <Copy />
                                )}
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm text-muted-foreground">
                            <span>{apiKeyHint}</span>
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-warning/20 bg-warning/10 p-4 text-sm text-warning">
                        <strong>Attention :</strong> Gardez votre clé secrète. Toute personne la possédant peut déployer des widgets en votre nom. Si elle est compromise, révoquez-la immédiatement.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Terminal className="text-muted-foreground" />
                    Guide de Démarrage Rapide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal space-y-4 pl-4 text-sm text-muted-foreground">
                    <li>
                      <strong className="text-foreground">Générez une clé API</strong>
                      <p className="mt-1 text-xs">Créez une clé ci-contre et copiez-la.</p>
                    </li>
                    <li>
                      <strong className="text-foreground">Installez la CLI {BRAND_NAME}</strong>
                      <p className="mt-1 rounded bg-muted p-1 font-mono text-xs">npm install -g @{BRAND_NAME.toLowerCase()}/cli</p>
                    </li>
                    <li>
                      <strong className="text-foreground">Initialisez un projet</strong>
                      <p className="mt-1">
                        <code className="rounded bg-muted p-0.5">{BRAND_NAME.toLowerCase()} init mon-widget</code>
                      </p>
                    </li>
                    <li>
                      <strong className="text-foreground">Développez &amp; Testez</strong>
                      <p className="mt-1">
                        <code className="rounded bg-muted p-0.5">cd mon-widget && {BRAND_NAME.toLowerCase()} dev</code>
                      </p>
                    </li>
                    <li>
                      <strong className="text-foreground">Déployez</strong>
                      <p className="mt-1">
                        Ajoutez la clé dans le <code className="rounded bg-muted p-0.5">.env</code> puis :
                        <br />
                        <code className="rounded bg-muted p-0.5">{BRAND_NAME.toLowerCase()} deploy</code>
                      </p>
                    </li>
                  </ol>
                  <div className="mt-6 rounded-lg border-t border-border p-4 bg-primary/5">
                    <p className="mb-1 text-sm font-medium text-primary">Besoin d'aide ?</p>
                    <p className="text-xs text-primary/80">
                      Consultez le <code>README.md</code> inclus dans le projet pour un guide détaillé.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </PageTabsContent>
      </PageTabs>

      <EditWidgetModal
        open={selectedWidget !== null}
        onClose={() => setSelectedWidget(null)}
        widget={selectedWidget}
      />
    </PageShell>
  );
}
