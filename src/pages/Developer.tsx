import { useState, useEffect } from 'react';
import { useWidgetLibraryStore } from '@/store/widgetLibraryStore';
import { useDeveloperStore } from '@/store/developerStore';
import { useAuth } from '@/context/AuthContext';
import { WidgetList } from '@/components/widgets/WidgetList';
import { Key, Trash2, Plus, Copy, Check, Terminal, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function Developer() {
  const { apiKeys, generateKey, revokeKey } = useDeveloperStore();
  const { definitions, isLoading, fetchMyWidgets, removeDraft, submitForModeration } = useWidgetLibraryStore();
  const { user } = useAuth();

  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter only widgets belonging to current user
  const userWidgets = definitions.filter((w) => user && w.authorId === user.id);
  const displayedWidgets =
    filterStatus === 'all' ? userWidgets : userWidgets.filter((w) => w.status === filterStatus);

  useEffect(() => {
    fetchMyWidgets();
  }, [fetchMyWidgets]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    generateKey(newKeyName.trim());
    setNewKeyName('');
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const FILTER_BUTTONS = [
    { value: 'all', label: 'Tous' },
    { value: 'draft', label: 'Brouillons' },
    { value: 'pending', label: 'En attente' },
    { value: 'validated', label: 'Validés' },
    { value: 'rejected', label: 'Rejetés' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      {/* Page Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Espace Développeur</h1>
          <p className="text-muted-foreground mt-2 text-lg">Gérez vos widgets et vos clés API CLI.</p>
        </div>
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-none text-white shadow-lg shadow-blue-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div>
              <div className="text-xs font-semibold opacity-80 uppercase tracking-wider mb-1">Status du service</div>
              <div className="flex items-center gap-2 font-bold text-lg">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>
                API Opérationnelle
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="widgets" className="space-y-8">
        <TabsList>
          <TabsTrigger value="widgets" className="gap-2">
            <Package className="w-4 h-4" /> Mes Widgets
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="w-4 h-4" /> Clés API
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: Mes Widgets ── */}
        <TabsContent value="widgets" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Vos Créations</h2>
              <p className="text-muted-foreground">Widgets développés via la CLI Clubz.</p>
            </div>

            <div className="flex bg-muted/50 p-1 rounded-lg border border-border flex-wrap gap-1">
              {FILTER_BUTTONS.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={filterStatus === value ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterStatus(value)}
                  className="text-xs"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              Chargement de vos widgets...
            </div>
          ) : (
            <WidgetList
              widgets={displayedWidgets}
              onDelete={(id) => removeDraft(id)}
              onSubmit={(id) => submitForModeration(id)}
              readOnly={false}
            />
          )}
        </TabsContent>

        {/* ── TAB: Clés API ── */}
        <TabsContent value="api-keys">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: API Keys List */}
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader className="border-b border-border bg-muted/30">
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-500" /> Vos Clés API
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleGenerate} className="flex gap-3 mb-8">
                    <Input
                      type="text"
                      placeholder="Nom de la clé (ex: MacBook Pro)"
                      className="flex-1"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                    <Button type="submit" disabled={!newKeyName.trim()} className="gap-2">
                      <Plus className="w-4 h-4" /> Générer
                    </Button>
                  </form>

                  <div className="space-y-4">
                    {apiKeys.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                        <Key className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">Aucune clé active.</p>
                        <p className="text-muted-foreground text-sm">Créez-en une pour commencer à développer.</p>
                      </div>
                    ) : (
                      apiKeys.map((key) => (
                        <div
                          key={key.id}
                          className="group flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border transition-all hover:border-indigo-200 hover:shadow-sm"
                        >
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-foreground">{key.name}</span>
                              <Badge variant="outline" className="text-xs font-normal">
                                {new Date(key.createdAt).toLocaleDateString('fr-FR')}
                              </Badge>
                            </div>
                            <div className="font-mono text-sm text-muted-foreground truncate bg-background px-3 py-2 rounded border border-border flex items-center justify-between">
                              <span className="truncate">{key.key}</span>
                              <button
                                onClick={() => handleCopy(key.key)}
                                className="ml-2 text-muted-foreground hover:text-indigo-600 transition-colors flex-shrink-0"
                              >
                                {copiedKey === key.key ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => revokeKey(key.id)}
                            className="text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Révoquer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Quick Start Guide */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Terminal className="w-5 h-5 text-muted-foreground" />
                    Guide de Démarrage Rapide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal pl-4 space-y-4 text-muted-foreground text-sm">
                    <li>
                      <strong className="text-foreground">Générez une clé API</strong>
                      <p className="text-xs mt-1">Créez une clé ci-contre et copiez-la.</p>
                    </li>
                    <li>
                      <strong className="text-foreground">Installez la CLI Clubz</strong>
                      <p className="text-xs mt-1 font-mono bg-muted p-1 rounded">npm install -g @clubz/cli</p>
                    </li>
                    <li>
                      <strong className="text-foreground">Initialisez un projet</strong>
                      <p className="text-xs mt-1">
                        <code className="bg-muted p-0.5 rounded">clubz init mon-widget</code>
                      </p>
                    </li>
                    <li>
                      <strong className="text-foreground">Développez &amp; Testez</strong>
                      <p className="text-xs mt-1">
                        <code className="bg-muted p-0.5 rounded">cd mon-widget &amp;&amp; clubz dev</code>
                      </p>
                    </li>
                    <li>
                      <strong className="text-foreground">Déployez</strong>
                      <p className="text-xs mt-1">
                        Ajoutez la clé dans le <code className="bg-muted p-0.5 rounded">.env</code> puis :
                        <br />
                        <code className="bg-muted p-0.5 rounded">clubz deploy</code>
                      </p>
                    </li>
                  </ol>
                  <div className="mt-6 pt-4 border-t border-border p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-primary font-medium mb-1">💡 Besoin d'aide ?</p>
                    <p className="text-xs text-primary/80">
                      Consultez le <code>README.md</code> inclus dans le projet pour un guide détaillé.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
