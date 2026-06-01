import { useState, useEffect } from 'react';
import { Loader2, Eye, FileJson, Settings, Info, MonitorPlay } from 'lucide-react';
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

interface Props {
  open: boolean;
  onClose: () => void;
  widget: WidgetDefinition | null;
}

export function EditWidgetModal({ open, onClose, widget }: Props) {
  const { updateWidget } = useWidgetLibraryStore();
  
  const [manifestData, setManifestData] = useState<any>({});
  const [configSchema, setConfigSchema] = useState<any[]>([]);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (widget && open) {
      setManifestData({
        name: widget.name,
        version: widget.semanticVersion || '1.0.0',
        description: widget.description || '',
      });

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
      const payload: any = {
        name: manifestData.name,
        semanticVersion: manifestData.version,
        description: manifestData.description,
      };
      
      await updateWidget(widget.id, payload);
      onClose();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSaving(false);
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
            <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="info" className="gap-2 rounded-lg data-[state=active]:bg-background"><Info className="w-4 h-4"/> Infos</TabsTrigger>
              <TabsTrigger value="preview" className="gap-2 rounded-lg data-[state=active]:bg-background"><MonitorPlay className="w-4 h-4"/> Aperçu</TabsTrigger>
              <TabsTrigger value="manifest" className="gap-2 rounded-lg data-[state=active]:bg-background"><FileJson className="w-4 h-4"/> Manifeste</TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 rounded-lg data-[state=active]:bg-background"><Settings className="w-4 h-4"/> Réglages</TabsTrigger>
            </TabsList>

            {/* TAB: Informations */}
            <TabsContent value="info" className="mt-4">
              <div className="bg-muted/30 border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Aperçu Marketplace</h3>
                <div className="bg-background rounded-lg border border-border p-5 shadow-sm text-left">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-foreground">{manifestData.name || 'Widget Sans Nom'}</h4>
                      <p className="text-sm text-muted-foreground mt-1">Par vous</p>
                    </div>
                    <Badge variant="secondary" className="font-mono">{manifestData.version || '1.0.0'}</Badge>
                  </div>
                  <p className="text-sm text-foreground mb-6 line-clamp-3">
                    {manifestData.description || 'Aucune description fournie pour ce widget.'}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="w-full" disabled>Installer (Démo)</Button>
                  </div>
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
                      Aucun paramètre défini dans le fichier clubz.json (settingsSchema).
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
                
                {configSchema.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-[10px] font-bold text-muted-foreground mb-1 flex items-center gap-1">
                      <FileJson className="w-3 h-3 text-indigo-500" /> Schéma de configuration (défini dans clubz.json)
                    </h4>
                    <pre className="bg-slate-950 text-slate-100 p-2 rounded-lg text-[9px] font-mono overflow-x-auto border border-slate-800 text-left max-h-24">
                      {JSON.stringify(configSchema, null, 2)}
                    </pre>
                  </div>
                )}
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
