import type { PageWidget } from '@/types/layout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface Props {
  widget: PageWidget;
  onChange: (cfg: any) => void;
}

export function PropertiesPanel({ widget, onChange }: Props) {
  const config = widget.config as any;

  const set = (key: string, value: any) => onChange({ ...config, [key]: value });

  return (
    <div className="space-y-6">
      {/* Type header */}
      <div className="pb-4 border-b border-border">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Type</div>
        <div className="font-semibold text-foreground">{widget.type}</div>
      </div>

      {/* Header Widget */}
      {widget.type === 'Header' && (
        <>
          <div className="space-y-2">
            <Label>Nom de la communauté</Label>
            <Input
              type="text"
              value={config.communityName ?? ''}
              onChange={(e) => set('communityName', e.target.value)}
              placeholder="Ma Communauté"
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-4">
            <Label className="text-sm font-medium">Bouton Rejoindre</Label>
            <Switch
              checked={config.showJoinButton ?? true}
              onCheckedChange={(v) => set('showJoinButton', v)}
            />
          </div>
          <div className="space-y-2">
            <Label>URL de la bannière</Label>
            <Input
              type="url"
              value={config.bannerUrl ?? ''}
              onChange={(e) => set('bannerUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </>
      )}

      {/* Feed Widget */}
      {widget.type === 'Feed' && (
        <>
          <div className="space-y-2">
            <Label>Nombre de posts à afficher</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={config.limit ?? 5}
              onChange={(e) => set('limit', parseInt(e.target.value))}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-4">
            <Label className="text-sm font-medium">Afficher l'auteur</Label>
            <Switch
              checked={config.showAuthor ?? true}
              onCheckedChange={(v) => set('showAuthor', v)}
            />
          </div>
        </>
      )}

      {/* EventList Widget */}
      {widget.type === 'EventList' && (
        <>
          <div className="space-y-2">
            <Label>Nombre d'événements</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={config.limit ?? 3}
              onChange={(e) => set('limit', parseInt(e.target.value))}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-4">
            <Label className="text-sm font-medium">Afficher les événements passés</Label>
            <Switch
              checked={config.showPastEvents ?? false}
              onCheckedChange={(v) => set('showPastEvents', v)}
            />
          </div>
        </>
      )}

      {/* CustomHTML Widget */}
      {widget.type === 'CustomHTML' && (
        <div className="space-y-2">
          <Label>Code HTML personnalisé</Label>
          <Textarea
            className="min-h-[150px] font-mono text-xs"
            value={config.html ?? ''}
            onChange={(e) => set('html', e.target.value)}
            placeholder='<div class="p-4"><h3>Hello</h3></div>'
          />
        </div>
      )}

      {/* Default fallback */}
      {!['Header', 'Feed', 'EventList', 'CustomHTML'].includes(widget.type) && (
        <div className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded-lg text-center">
          Aucune propriété configurable pour ce type.
        </div>
      )}
    </div>
  );
}
