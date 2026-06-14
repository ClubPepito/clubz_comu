import { useState, useEffect } from 'react';
import { Loader2, Eye, FileJson, Settings, Info, MonitorPlay, Lock, Trash2, Plus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useWidgetLibraryStore } from '@/store/widgetLibraryStore';
import type { WidgetDefinition } from '@/types/widgetLibrary';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { widgetLibraryService } from '@/services/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  widget: WidgetDefinition | null;
}

export function EditWidgetModal({ open, onClose, widget }: Props) {
  const { updateWidget, fetchMyWidgets } = useWidgetLibraryStore();
  
  const [manifestData, setManifestData] = useState<any>({});
  const [configSchema, setConfigSchema] = useState<any[]>([]);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});
  const [envVars, setEnvVars] = useState<{key: string, value: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Validation state
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (widget && open) {
      setManifestData({
        name: widget.name,
        version: widget.semanticVersion || '1.0.0',
        description: widget.description || '',
        description: widget.description || '',
      });

      let initialEnv: {key: string, value: string}[] = [];
      if (widget.envData) {
        try {
          const parsed = JSON.parse(widget.envData);
          if (typeof parsed === 'object' && !Array.isArray(parsed)) {
            initialEnv = Object.entries(parsed).map(([k, v]) => ({ key: k, value: String(v) }));
          } else if (Array.isArray(parsed)) {
             initialEnv = parsed;
          }
        } catch (e) {
          // ignore
        }
      }
      setEnvVars(initialEnv);

      // Parse settingsSchema from widget.config.
      if (Array.isArray(widget.config)) {
        setConfigSchema(widget.config);
      } else if (widget.config && typeof widget.config === 'object') {
        const parsed = Array.isArray((widget.config as any).settingsSchema) 
          ? (widget.config as any).settingsSchema 
          : Array.isArray((widget.config as any).props)
          ? (widget.config as any).props
          : [];
        if (parsed.length > 0) {
          setConfigSchema(parsed);
        } else {
          // Fallback if stored as object properties
          setConfigSchema(Object.entries(widget.config).map(([key, val]: [string, any]) => ({
            key,
            type: val.type || 'string',
            label: val.label || key,
            description: val.description || '',
            default: val.default ?? '',
            required: !!val.required
          })));
        }
      } else {
        setConfigSchema([]);
      }
    }
  }, [widget, open]);

  // Synchronize dynamic preview values when schema changes
  useEffect(() => {
    setPreviewValues(prev => {
      const next = { ...prev };
      configSchema.forEach(field => {
        if (field.key && !(field.key in next)) {
          next[field.key] = field.default ?? (field.type === 'boolean' ? false : field.type === 'number' ? 0 : '');
        }
      });
      // Cleanup deleted keys
      Object.keys(next).forEach(key => {
        if (!configSchema.some(f => f.key === key)) {
          delete next[key];
        }
      });
      return next;
    });
  }, [configSchema]);

  const handleSave = async () => {
    if (!widget) return;
    setIsSaving(true);
    try {
      const envDataStr = JSON.stringify(envVars.reduce((acc, curr) => {
        if (curr.key.trim()) acc[curr.key.trim()] = curr.value;
        return acc;
      }, {} as Record<string, string>));

      const payload: any = {
        name: manifestData.name,
        semanticVersion: manifestData.version,
        description: manifestData.description,
        envData: envDataStr,
      };
      
      await updateWidget(widget.id, payload);
      onClose();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidationRequest = async (status: 'pending' | 'draft') => {
    if (!widget) return;
    setIsSubmitting(true);
    try {
      await updateWidget(widget.id, { status });
      toast.success(status === 'pending' ? 'Widget soumis pour validation' : 'Soumission annulée');
      fetchMyWidgets();
    } catch (err: any) {
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!widget) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[850px] h-[85vh] max-h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle>Paramétrage du Widget : {widget.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-muted/50 p-1 rounded-xl overflow-x-auto">
              <TabsTrigger value="info" className="gap-2 rounded-lg data-[state=active]:bg-background"><Info className="w-4 h-4"/> Infos</TabsTrigger>
              <TabsTrigger value="validation" className="gap-2 rounded-lg data-[state=active]:bg-background"><ShieldCheck className="w-4 h-4"/> Validation</TabsTrigger>
              <TabsTrigger value="preview" className="gap-2 rounded-lg data-[state=active]:bg-background"><MonitorPlay className="w-4 h-4"/> Aperçu</TabsTrigger>
              <TabsTrigger value="manifest" className="gap-2 rounded-lg data-[state=active]:bg-background"><FileJson className="w-4 h-4"/> Manifeste</TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 rounded-lg data-[state=active]:bg-background"><Settings className="w-4 h-4"/> Réglages</TabsTrigger>
              <TabsTrigger value="env" className="gap-2 rounded-lg data-[state=active]:bg-background"><Lock className="w-4 h-4"/> Env</TabsTrigger>
            </TabsList>

            {/* TAB: Informations */}
            <TabsContent value="info" className="mt-4 space-y-4">
              <div className="bg-muted/30 border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Aperçu Marketplace</h3>
                <div className="bg-background rounded-lg border border-border p-5 shadow-sm text-left">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-foreground">{manifestData.name || 'Widget Sans Nom'}</h4>
                      <p className="text-sm text-muted-foreground mt-1">Par {widget.author?.name || 'vous'}</p>
                    </div>
                    <Badge variant="secondary" className="font-mono">{manifestData.version || '1.0.0'}</Badge>
                  </div>
                  <p className="text-sm text-foreground line-clamp-3">
                    {manifestData.description || 'Aucune description fournie pour ce widget.'}
                  </p>
                </div>
              </div>

              <div className="bg-muted/30 border border-border rounded-xl p-6 text-left">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Détails Techniques</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">ID du Widget</span>
                    <span className="font-mono text-xs">{widget.id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Statut</span>
                    <Badge variant={widget.status === 'validated' ? 'default' : 'secondary'} className="mt-1 capitalize">
                      {widget.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Créé le</span>
                    <span>{new Date(widget.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Dernière mise à jour</span>
                    <span>{new Date(widget.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {widget.tags && widget.tags.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-xs mb-1">Tags</span>
                      <div className="flex gap-1 flex-wrap">
                        {widget.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB: Aperçu (Sandbox) */}
            <TabsContent value="preview" className="mt-4">
              <div className="bg-muted/30 border border-border rounded-xl p-4 overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                {widget.remoteUrl ? (
                  <iframe 
                    src={widget.remoteUrl} 
                    className="w-full h-[500px] border border-border/50 rounded-lg shadow-inner bg-white" 
                    title="Widget Sandbox Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                ) : (
                  <div className="text-center space-y-3">
                    <MonitorPlay className="w-12 h-12 text-muted-foreground/50 mx-auto" />
                    <p className="text-muted-foreground text-sm max-w-sm">
                      Aucun aperçu disponible. <br/>
                      Vous devez déployer votre widget au moins une fois via la CLI pour générer un lien d'aperçu.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB: Manifeste */}
            <TabsContent value="manifest" className="mt-4 space-y-4 text-left">
              <div>
                <Label className="text-sm font-medium mb-1 block">Nom du Widget</Label>
                <Input 
                  value={manifestData.name || ''} 
                  onChange={e => setManifestData({...manifestData, name: e.target.value})}
                  placeholder="Mon Super Widget"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Version (SemVer)</Label>
                <Input 
                  value={manifestData.version || ''} 
                  onChange={e => setManifestData({...manifestData, version: e.target.value})}
                  placeholder="1.0.0"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Description</Label>
                <Textarea 
                  value={manifestData.description || ''} 
                  onChange={e => setManifestData({...manifestData, description: e.target.value})}
                  placeholder="Description de votre widget..."
                  rows={4}
                />
              </div>
            </TabsContent>

            {/* TAB: Réglages */}
            <TabsContent value="settings" className="mt-4 space-y-4">
              <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 border-b border-border/50 pb-2">
                  <Eye className="w-4 h-4 text-indigo-500" /> Aperçu du formulaire de configuration
                </h3>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Ceci est un aperçu en lecture seule. La configuration finale sera effectuée par l'administrateur de chaque communauté lors de l'installation.
                </p>
                <div className="bg-background rounded-lg border border-border p-4 space-y-4 shadow-sm text-left max-h-[50vh] overflow-y-auto">
                  {configSchema.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground italic">
                      Aucun paramètre défini dans le fichier klyb.json (settingsSchema).
                    </div>
                  ) : (
                    configSchema.map((field, idx) => {
                      if (!field.key) return null;
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-bold text-foreground">
                              {field.label || field.key} {field.required && <span className="text-red-500">*</span>}
                            </Label>
                            <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 uppercase scale-90">
                              {field.type}
                            </Badge>
                          </div>
                          {field.description && (
                            <p className="text-[10px] text-muted-foreground leading-normal mb-1">
                              {field.description}
                            </p>
                          )}
                          {field.type === 'boolean' ? (
                            <div className="flex items-center space-x-2 py-1 opacity-70">
                              <Switch
                                checked={!!previewValues[field.key]}
                                disabled
                              />
                              <span className="text-xs text-muted-foreground">{previewValues[field.key] ? 'Oui' : 'Non'}</span>
                            </div>
                          ) : field.type === 'number' ? (
                            <Input
                              type="number"
                              value={previewValues[field.key] ?? ''}
                              disabled
                              className="h-8 text-xs bg-muted/50"
                            />
                          ) : (
                            <Input
                              type="text"
                              value={previewValues[field.key] ?? ''}
                              disabled
                              className="h-8 text-xs bg-muted/50"
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB: Env */}
            <TabsContent value="env" className="mt-4 space-y-4">
              <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-4 text-left">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-500" /> Variables d'environnement
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Définissez ici des secrets ou variables nécessaires au bon fonctionnement de votre widget côté serveur (clés d'API, tokens, etc.).
                    Elles seront cryptées en base de données.
                  </p>
                </div>
                
                <div className="space-y-3 mt-4">
                  {envVars.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground italic bg-background rounded-lg border border-border">
                      Aucune variable définie.
                    </div>
                  ) : (
                    envVars.map((env, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder="CLÉ (ex: API_KEY)"
                          value={env.key}
                          onChange={(e) => {
                            const newVars = [...envVars];
                            newVars[idx].key = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
                            setEnvVars(newVars);
                          }}
                          className="font-mono text-xs h-9 w-1/3"
                        />
                        <Input
                          type="password"
                          placeholder="Valeur cryptée..."
                          value={env.value}
                          onChange={(e) => {
                            const newVars = [...envVars];
                            newVars[idx].value = e.target.value;
                            setEnvVars(newVars);
                          }}
                          className="font-mono text-xs h-9 flex-1"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                          onClick={() => {
                            const newVars = [...envVars];
                            newVars.splice(idx, 1);
                            setEnvVars(newVars);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2 text-xs h-9 border-dashed border-2"
                    onClick={() => setEnvVars([...envVars, { key: '', value: '' }])}
                  >
                    <Plus className="w-3 h-3" /> Ajouter une variable
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB: Validation */}
            {/* TAB: Validation */}
            <TabsContent value="validation" className="mt-4 space-y-4">
              <div className="bg-muted/30 border border-border rounded-xl p-6 text-left">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" /> Validation Marketplace
                </h3>
                
                <div className="space-y-6">
                  <div className="bg-background rounded-lg border border-border p-4 shadow-sm">
                    <h4 className="text-sm font-bold text-foreground mb-2">Statut actuel du widget</h4>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={
                          widget.status === 'validated' ? 'default' : 
                          widget.status === 'rejected' ? 'destructive' : 
                          widget.status === 'pending' ? 'secondary' : 'outline'
                        } 
                        className="capitalize px-3 py-1 text-xs"
                      >
                        {widget.status === 'draft' ? 'Brouillon' : 
                         widget.status === 'pending' ? 'En attente de validation' :
                         widget.status === 'validated' ? 'Validé' :
                         widget.status === 'rejected' ? 'Rejeté' : widget.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {widget.status === 'draft' && "Votre widget n'est pas encore visible sur le Marketplace."}
                        {widget.status === 'pending' && "Votre widget est en cours d'examen par nos équipes."}
                        {widget.status === 'validated' && "Votre widget est approuvé et prêt à être distribué."}
                        {widget.status === 'rejected' && "Votre widget a été refusé. Veuillez consulter les retours ci-dessous."}
                      </p>
                    </div>
                  </div>

                  {widget.status === 'rejected' && widget.reviewComments && widget.reviewComments.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-red-800 mb-2">Commentaires de modération</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {widget.reviewComments.map((comment, idx) => (
                          <li key={idx} className="text-xs text-red-700">{comment}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    {(widget.status === 'draft' || widget.status === 'rejected') && (
                      <Button 
                        className="w-full gap-2" 
                        onClick={() => handleValidationRequest('pending')}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        Soumettre pour validation
                      </Button>
                    )}
                    
                    {widget.status === 'pending' && (
                      <Button 
                        className="w-full gap-2" 
                        variant="outline"
                        onClick={() => handleValidationRequest('draft')}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Annuler la soumission
                      </Button>
                    )}

                    {widget.status === 'validated' && (
                      <div className="text-center py-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg font-medium">
                        Félicitations ! Votre widget est validé.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 bg-muted/10">
          <Button 
            className="w-full gap-2" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...
              </>
            ) : (
              <>
                Sauvegarder les paramètres
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
