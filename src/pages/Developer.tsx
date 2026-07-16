import { useState, useEffect, useMemo } from 'react';
import { useWidgetLibraryStore } from '@/store/widgetLibraryStore';
import { useAuth } from '@/context/AuthContext';
import { WidgetList } from '@/components/widgets/WidgetList';
import {
  Loader2,
  Key,
  Trash2,
  Plus,
  Copy,
  Check,
  Terminal,
  BookOpen,
  Layers,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EditWidgetModal } from '@/components/widgets/EditWidgetModal';
import { Documentation } from '@/components/developer/Documentation';
import { BRAND_NAME } from '@/constants/branding';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AtmosphericHeader } from '@/components/layout/AtmosphericHeader';
import { userService } from '@/services/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function Developer() {
  const { definitions, isLoading, fetchMyWidgets, removeDraft, submitForModeration } =
    useWidgetLibraryStore();
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
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir révoquer cette clé ? Les applications l'utilisant ne fonctionneront plus.",
      )
    )
      return;
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

  const statusCounts = useMemo(() => {
    const base = { all: userWidgets.length, draft: 0, pending: 0, validated: 0, rejected: 0 };
    for (const w of userWidgets) {
      if (w.status in base) {
        base[w.status as keyof typeof base] += 1;
      }
    }
    return base;
  }, [userWidgets]);

  useEffect(() => {
    fetchMyWidgets();
  }, [fetchMyWidgets]);

  const FILTER_BUTTONS = [
    { value: 'all', label: 'Tous' },
    { value: 'draft', label: 'Brouillons' },
    { value: 'pending', label: 'En attente' },
    { value: 'validated', label: 'Validés' },
    { value: 'rejected', label: 'Rejetés' },
  ] as const;

  return (
    <div className="flex flex-col gap-8 pb-12">
      <AtmosphericHeader
        tone="accent"
        title="Espace Développeur"
        description={`Publiez, gérez et documentez vos extensions ${BRAND_NAME} — widgets, pages et clés CLI.`}
        meta={
          !isLoading ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              {statusCounts.all} création{statusCounts.all !== 1 ? 's' : ''} ·{' '}
              {statusCounts.validated} validée{statusCounts.validated !== 1 ? 's' : ''} ·{' '}
              {statusCounts.pending} en revue
            </p>
          ) : undefined
        }
      />

      <Tabs defaultValue="widgets" className="w-full">
        <TabsList className="mb-6 h-11 gap-1 rounded-xl border border-border/50 bg-muted/40 p-1">
          <TabsTrigger
            value="widgets"
            className="gap-2 rounded-lg px-5 font-semibold data-[state=active]:shadow-sm"
          >
            <Layers className="size-4" /> Vos Créations
          </TabsTrigger>
          <TabsTrigger
            value="docs"
            className="gap-2 rounded-lg px-5 font-semibold data-[state=active]:shadow-sm"
          >
            <BookOpen className="size-4" /> Documentation
          </TabsTrigger>
          <TabsTrigger
            value="api-keys"
            className="gap-2 rounded-lg px-5 font-semibold data-[state=active]:shadow-sm"
          >
            <Key className="size-4" /> Clés API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="widgets" className="mt-0 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Vos créations</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Ouvrez un widget pour éditer le manifeste, les secrets et la validation marketplace.
              </p>
            </div>

            <div className="flex flex-wrap gap-1 rounded-xl border border-border/60 bg-muted/40 p-1">
              {FILTER_BUTTONS.map(({ value, label }) => {
                const count = statusCounts[value];
                const active = filterStatus === value;
                return (
                  <Button
                    key={value}
                    variant={active ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterStatus(value)}
                    className={cn(
                      'h-8 gap-1.5 rounded-lg text-xs font-medium',
                      active && 'shadow-sm',
                    )}
                  >
                    {label}
                    <span
                      className={cn(
                        'rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                        active ? 'bg-primary/15 text-primary' : 'bg-background/80 text-muted-foreground',
                      )}
                    >
                      {count}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-sm">Chargement de vos widgets…</span>
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
        </TabsContent>

        <TabsContent value="docs" className="mt-0">
          <Documentation />
        </TabsContent>

        <TabsContent value="api-keys" className="mt-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden shadow-klyb-sm">
                <CardHeader className="border-b border-border/60 bg-gradient-to-r from-muted/40 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Key className="size-4" />
                    </span>
                    Votre clé API CLI
                  </CardTitle>
                  <CardDescription>
                    Authentifie la CLI {BRAND_NAME} pour déployer et mettre à jour vos widgets.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {!hasApiKey ? (
                    <div className="rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
                      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Key className="size-6" />
                      </div>
                      <p className="font-medium text-foreground">Aucune clé active</p>
                      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                        Créez une clé pour commencer à développer et déployer via la CLI {BRAND_NAME}.
                      </p>
                      <form onSubmit={handleGenerate} className="mt-6">
                        <Button type="submit" disabled={isGeneratingKey} className="gap-2">
                          {isGeneratingKey ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Plus className="size-4" />
                          )}
                          Générer ma clé API
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-border/80 bg-muted/20 p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">Clé principale</span>
                            <Badge
                              variant="outline"
                              className="border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                            >
                              Active
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRevoke}
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" /> Révoquer
                          </Button>
                        </div>

                        {localApiKey ? (
                          <>
                            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                              <strong>Nouvelle clé générée.</strong> Copiez-la maintenant — elle ne
                              sera plus affichée après fermeture de cette page.
                            </div>
                            <div className="flex items-center justify-between gap-3 break-all rounded-xl border border-border bg-card px-4 py-3 font-mono text-sm text-foreground">
                              <span>{localApiKey}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(localApiKey)}
                                className="shrink-0 rounded-lg bg-muted p-2 text-muted-foreground transition-colors hover:text-primary"
                              >
                                {copiedKey === localApiKey ? (
                                  <Check className="size-4 text-emerald-500" />
                                ) : (
                                  <Copy className="size-4" />
                                )}
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="rounded-xl border border-border bg-card px-4 py-3 font-mono text-sm text-muted-foreground">
                            {apiKeyHint}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                        <p>
                          <strong>Attention :</strong> gardez votre clé secrète. Quiconque la possède
                          peut déployer des widgets en votre nom. En cas de fuite, révoquez-la
                          immédiatement.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-klyb-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Terminal className="size-4" />
                  </span>
                  Démarrage rapide
                </CardTitle>
                <CardDescription>Les 5 étapes pour publier votre premier widget.</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {[
                    {
                      title: 'Générez une clé API',
                      body: 'Créez une clé ci-contre et copiez-la.',
                    },
                    {
                      title: `Installez la CLI ${BRAND_NAME}`,
                      body: `npm install -g @${BRAND_NAME.toLowerCase()}/cli`,
                      mono: true,
                    },
                    {
                      title: 'Initialisez un projet',
                      body: `${BRAND_NAME.toLowerCase()} init mon-widget`,
                      mono: true,
                    },
                    {
                      title: 'Développez & testez',
                      body: `cd mon-widget && ${BRAND_NAME.toLowerCase()} dev`,
                      mono: true,
                    },
                    {
                      title: 'Déployez',
                      body: `Ajoutez la clé dans .env puis ${BRAND_NAME.toLowerCase()} deploy`,
                    },
                  ].map((step, i) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{step.title}</p>
                        {step.mono ? (
                          <code className="mt-1 block truncate rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-foreground">
                            {step.body}
                          </code>
                        ) : (
                          <p className="mt-0.5 text-xs text-muted-foreground">{step.body}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 rounded-xl border border-primary/15 bg-primary/5 p-4">
                  <p className="text-sm font-medium text-primary">Besoin d&apos;aide ?</p>
                  <p className="mt-1 text-xs text-primary/80">
                    Consultez l&apos;onglet Documentation ou le README inclus dans le projet généré
                    par la CLI.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <EditWidgetModal
        open={selectedWidget !== null}
        onClose={() => setSelectedWidget(null)}
        widget={selectedWidget}
      />
    </div>
  );
}
