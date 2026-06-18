import { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, Tag, Loader2, Check, X } from 'lucide-react'
import { promoCodeService } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import type { PromoCode } from '@/types/event'

interface PromoCodeManagerProps {
  eventId: string
}

const EMPTY_FORM = {
  code: '',
  discountType: 'percentage' as 'percentage' | 'fixed',
  discountValue: 10,
  maxUses: '' as string | number,
  expiresAt: '',
}

export function PromoCodeManager({ eventId }: PromoCodeManagerProps) {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const fetchCodes = async () => {
    try {
      setLoading(true)
      const res = await promoCodeService.getAll(eventId)
      setCodes(res.data || [])
    } catch {
      toast.error('Erreur lors du chargement des codes promo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCodes()
  }, [eventId])

  const openCreate = () => {
    setEditingCode(null)
    setForm({ ...EMPTY_FORM })
    setDialogOpen(true)
  }

  const openEdit = (code: PromoCode) => {
    setEditingCode(code)
    setForm({
      code: code.code,
      discountType: code.discountType,
      discountValue: code.discountValue,
      maxUses: code.maxUses ?? '',
      expiresAt: code.expiresAt ? code.expiresAt.slice(0, 16) : '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast.error('Le code promo est requis')
      return
    }
    if (form.discountValue <= 0) {
      toast.error('La valeur de réduction doit être positive')
      return
    }
    if (form.discountType === 'percentage' && form.discountValue > 100) {
      toast.error('La réduction en pourcentage ne peut pas dépasser 100%')
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxUses: form.maxUses !== '' ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
      }

      if (editingCode) {
        await promoCodeService.update(eventId, editingCode.id, payload)
        toast.success('Code promo mis à jour')
      } else {
        await promoCodeService.create(eventId, payload)
        toast.success('Code promo créé')
      }
      setDialogOpen(false)
      fetchCodes()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors de l\'enregistrement'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce code promo ?')) return
    try {
      await promoCodeService.delete(eventId, id)
      setCodes((prev) => prev.filter((c) => c.id !== id))
      toast.success('Code promo supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleToggleActive = async (code: PromoCode) => {
    try {
      await promoCodeService.update(eventId, code.id, { active: !code.active })
      setCodes((prev) =>
        prev.map((c) => (c.id === code.id ? { ...c, active: !c.active } : c))
      )
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {codes.length} code{codes.length !== 1 ? 's' : ''} promo
          </span>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} data-icon="inline-start" />
          Nouveau code
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-primary opacity-40" />
        </div>
      ) : codes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
          <Tag size={28} className="text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">Aucun code promo pour l'instant</p>
          <Button size="sm" variant="outline" onClick={openCreate}>
            <Plus size={14} data-icon="inline-start" />
            Créer le premier code
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Réduction</TableHead>
              <TableHead>Utilisations</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead className="text-center">Actif</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.map((code) => (
              <TableRow key={code.id}>
                <TableCell>
                  <Badge variant="outline" className="font-mono font-bold uppercase text-xs">
                    {code.code}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold">
                  {code.discountType === 'percentage'
                    ? `${code.discountValue}%`
                    : `${code.discountValue} €`}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {code.usedCount ?? 0}
                  {code.maxUses ? ` / ${code.maxUses}` : ''}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {code.expiresAt
                    ? new Date(code.expiresAt).toLocaleDateString('fr-FR')
                    : '—'}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={code.active}
                    onCheckedChange={() => handleToggleActive(code)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(code)}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/5"
                      onClick={() => handleDelete(code.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingCode ? 'Modifier le code promo' : 'Nouveau code promo'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promo-code">Code *</Label>
              <Input
                id="promo-code"
                placeholder="SUMMER25"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="font-mono uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) =>
                    setForm({ ...form, discountType: v as 'percentage' | 'fixed' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="promo-value">
                  Valeur {form.discountType === 'percentage' ? '(%)' : '(€)'} *
                </Label>
                <Input
                  id="promo-value"
                  type="number"
                  min={0}
                  max={form.discountType === 'percentage' ? 100 : undefined}
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="promo-max-uses">Utilisations max</Label>
                <Input
                  id="promo-max-uses"
                  type="number"
                  min={1}
                  placeholder="Illimité"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="promo-expires">Expiration</Label>
                <Input
                  id="promo-expires"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              <X size={14} data-icon="inline-start" />
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 size={14} className="animate-spin" data-icon="inline-start" />
              ) : (
                <Check size={14} data-icon="inline-start" />
              )}
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
