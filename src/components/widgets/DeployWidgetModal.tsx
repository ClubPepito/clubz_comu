import { useState, useRef } from 'react';
import JSZip from 'jszip';
import { Upload, FileArchive, Check, Loader2, X, Eye, FileJson, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageTabs, PageTabsList, PageTabsTrigger, PageTabsContent } from '@/components/layout/PageTabs';
import { Badge } from '@/components/ui/badge';
import { useWidgetLibraryStore } from '@/store/widgetLibraryStore';
import { toast } from 'sonner';

export function DeployWidgetModal() {
  const { deployWidget } = useWidgetLibraryStore();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [manifestPath, setManifestPath] = useState<string | null>(null);
  const [manifestData, setManifestData] = useState<any>(null);
  const [envData, setEnvData] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFiles(null);
    setManifestPath(null);
    setManifestData(null);
    setEnvData('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(resetState, 200);
    }
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setFiles(selectedFiles);

    // Look for manifest
    let foundManifest: File | null = null;
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.name === 'klyb.json' || file.name === 'widget.json') {
        foundManifest = file;
        break;
      }
    }

    if (foundManifest) {
      setManifestPath(foundManifest.webkitRelativePath);
      try {
        const text = await foundManifest.text();
        const json = JSON.parse(text);
        setManifestData(json);
      } catch (err) {
        toast.error("Le fichier manifest n'est pas un JSON valide.");
        setManifestData(null);
      }
    } else {
      toast.error("Aucun fichier klyb.json ou widget.json trouvé dans le dossier.");
      setManifestData(null);
    }
  };

  const handleDeploy = async () => {
    if (!files || !manifestData) return;
    setIsDeploying(true);

    try {
      const zip = new JSZip();

      // Add all files to ZIP
      let rootDir = manifestPath ? manifestPath.substring(0, manifestPath.lastIndexOf('/') + 1) : '';

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Skip macos hidden folders
        if (file.webkitRelativePath.includes('__MACOSX')) continue;

        // Skip local .env files to avoid leaking secrets
        if (file.name === '.env' || file.name === '.env.local') {
          console.log(`Skipped local environment file: ${file.name}`);
          continue;
        }

        // If it's the manifest, inject the modified one
        if (file.webkitRelativePath === manifestPath) {
          zip.file(file.webkitRelativePath, JSON.stringify(manifestData, null, 2));
        } else {
          zip.file(file.webkitRelativePath, file);
        }
      }

      // Inject the production .env file if provided
      if (envData.trim()) {
        zip.file(`${rootDir}.env`, envData.trim());
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      await deployWidget(zipBlob, JSON.stringify(manifestData));
      
      setOpen(false);
    } catch (err: any) {
      console.error(err);
      // Toast is handled in the store
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
        <Upload className="w-4 h-4" /> Déployer un Widget
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Déployer un nouveau Widget</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {!files ? (
            <div 
              className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileArchive className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-1">Sélectionnez le dossier de votre widget</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Le dossier doit contenir un fichier <code className="bg-muted px-1 rounded">klyb.json</code> et vos fichiers buildés. Les fichiers <code className="bg-muted px-1 rounded">.env</code> locaux seront ignorés.
              </p>
              <Button variant="outline">Parcourir...</Button>
            </div>
          ) : !manifestData ? (
            <div className="text-center py-8">
              <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="font-semibold text-red-600">Fichier de configuration introuvable.</p>
              <p className="text-sm text-muted-foreground mt-2 mb-4">Veuillez sélectionner un dossier contenant klyb.json ou widget.json.</p>
              <Button variant="outline" onClick={resetState}>Réessayer</Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-green-50 text-green-700 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-sm">Dossier et configuration prêts</span>
                </div>
                <Button variant="ghost" size="sm" onClick={resetState} className="text-green-700 hover:bg-green-100 h-8">
                  Changer
                </Button>
              </div>

              <PageTabs defaultValue="preview" className="w-full">
                <PageTabsList fullWidth columns={3}>
                  <PageTabsTrigger value="preview" icon={Eye}>Aperçu</PageTabsTrigger>
                  <PageTabsTrigger value="manifest" icon={FileJson}>Manifeste</PageTabsTrigger>
                  <PageTabsTrigger value="env" icon={Settings2}>Variables (.env)</PageTabsTrigger>
                </PageTabsList>

                {/* TAB: Aperçu */}
                <PageTabsContent value="preview" className="mt-4">
                  <div className="bg-muted/30 border border-border rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Aperçu Marketplace</h3>
                    <div className="bg-background rounded-lg border border-border p-5 shadow-sm">
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
                </PageTabsContent>

                {/* TAB: Manifeste */}
                <PageTabsContent value="manifest" className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nom du Widget</label>
                    <Input 
                      value={manifestData.name || ''} 
                      onChange={e => setManifestData({...manifestData, name: e.target.value})}
                      placeholder="Mon Super Widget"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Version (SemVer)</label>
                    <Input 
                      value={manifestData.version || '1.0.0'} 
                      onChange={e => setManifestData({...manifestData, version: e.target.value})}
                      placeholder="1.0.0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Description</label>
                    <Textarea 
                      value={manifestData.description || ''} 
                      onChange={e => setManifestData({...manifestData, description: e.target.value})}
                      placeholder="Description de votre widget..."
                      rows={4}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Toute modification ici mettra à jour le fichier <code>{manifestPath?.split('/').pop()}</code> dans l'archive envoyée.
                  </p>
                </PageTabsContent>

                {/* TAB: Environnement */}
                <PageTabsContent value="env" className="mt-4 space-y-4">
                  <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 p-3 rounded-lg text-sm">
                    <strong>Sécurité :</strong> Les fichiers <code>.env</code> locaux trouvés dans votre dossier sont automatiquement ignorés lors du déploiement. Renseignez ci-dessous les variables nécessaires pour l'environnement de production.
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Variables d'environnement (.env)</label>
                    <Textarea 
                      value={envData} 
                      onChange={e => setEnvData(e.target.value)}
                      placeholder="API_KEY=sk_test_12345&#10;NEXT_PUBLIC_API_URL=https://api.klyb.co"
                      className="font-mono text-sm"
                      rows={6}
                    />
                  </div>
                </PageTabsContent>
              </PageTabs>

              <div className="pt-4 border-t border-border">
                <Button 
                  className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" 
                  onClick={handleDeploy}
                  disabled={isDeploying}
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Déploiement en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Publier le Widget
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Hidden folder input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            // @ts-ignore - React types might not fully support webkitdirectory yet
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleFolderSelect}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
