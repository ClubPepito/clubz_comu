import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  QrCode,
  MoreVertical,
  Filter,
  CheckCircle2,
  MapPin,
  Calendar as CalendarIcon,
  Loader2,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageShell } from '@/components/layout/PageShell'
import { PageTabs, PageTabsList, PageTabsTrigger, PageTabsContent } from '@/components/layout/PageTabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { eventService } from '@/services/api'
import { usePermissions } from '@/hooks/usePermissions'
import { CheckInScanner } from '@/components/events/CheckInScanner'
import { PromoCodeManager } from '@/components/events/PromoCodeManager'
import { toast } from 'sonner'
import type { Event, EventAnalytics } from '@/types/event'
import { resolveImageUrl } from '@/lib/imageUrl'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

const EventDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { permissions } = usePermissions()
  const [tab, setTab] = useState('analytics')
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null)
  const [attendees, setAttendees] = useState<any[]>([])
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [guestSearch, setGuestSearch] = useState('')
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      try {
        const [eventRes, analyticsRes, attendeesRes] = await Promise.all([
          eventService.getOne(id),
          eventService.getStats(id).catch(() => ({ data: null })),
          eventService.getAttendees(id).catch(() => ({ data: [] })),
        ])
        setEvent(eventRes.data)
        setAnalytics(analyticsRes.data)
        setAttendees(attendeesRes.data || [])
      } catch (err: any) {
        if (err?.response?.status === 403) {
          setAccessDenied(true)
        } else {
          toast.error('Erreur lors du chargement')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleCheckIn = async (ticketId: string) => {
    if (!id) return
    setCheckingIn(ticketId)
    try {
      await eventService.checkIn(id, ticketId)
      toast.success('Check-in réussi !')
      setAttendees((prev) =>
        prev.map((a) => (a.id === ticketId ? { ...a, checkedIn: true } : a))
      )
    } catch (err: any) {
      if (err?.response?.status === 403) {
        toast.error('Accès refusé — droits insuffisants')
      } else {
        toast.error('Erreur check-in')
      }
    } finally {
      setCheckingIn(null)
    }
  }

  const handleScannerSuccess = (token: string) => {
    setAttendees((prev) =>
      prev.map((a) => (a.id === token || a.qrToken === token ? { ...a, checkedIn: true } : a))
    )
  }

  const handleExportCalendar = async () => {
    if (!id) return
    try {
      const res = await eventService.getCalendar(id)
      const blob = new Blob([res.data], { type: 'text/calendar' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${event?.title || 'event'}.ics`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Exporté !')
    } catch {
      toast.error('Erreur export')
    }
  }

  const handleDeleteEvent = async () => {
    if (!id || !confirm('Voulez-vous vraiment supprimer cet événement ?')) return
    try {
      await eventService.delete(id)
      toast.success('Événement supprimé')
      navigate('/events')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const filteredAttendees = useMemo(() => {
    if (!guestSearch.trim()) return attendees
    const q = guestSearch.toLowerCase()
    return attendees.filter(
      (a) =>
        (a.user?.name || '').toLowerCase().includes(q) ||
        (a.user?.email || '').toLowerCase().includes(q)
    )
  }, [attendees, guestSearch])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary opacity-40" />
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Empty className="max-w-md border-2 border-dashed border-border/80 bg-muted/20 py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-12 rounded-2xl bg-destructive/10 text-destructive [&_svg]:size-5">
              <ArrowLeft />
            </EmptyMedia>
            <EmptyTitle className="text-base">Accès refusé</EmptyTitle>
            <EmptyDescription>
              Vous n&apos;avez pas les droits pour consulter cet événement.
            </EmptyDescription>
          </EmptyHeader>
          <Link to="/events">
            <Button variant="outline" size="sm">
              <ArrowLeft size={14} data-icon="inline-start" /> Retour aux événements
            </Button>
          </Link>
        </Empty>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Empty className="max-w-md border-2 border-dashed border-border/80 bg-muted/20 py-16">
          <EmptyHeader>
            <EmptyTitle className="text-base">Événement introuvable</EmptyTitle>
            <EmptyDescription>Cet événement n&apos;existe pas ou a été supprimé.</EmptyDescription>
          </EmptyHeader>
          <Link to="/events">
            <Button variant="outline" size="sm">Retour aux événements</Button>
          </Link>
        </Empty>
      </div>
    )
  }

  const revenueChange = analytics?.revenueChange
  const hasRevenueChange = typeof revenueChange === 'number'

  const totalRevenue =
    analytics?.totalRevenue ?? analytics?.summary?.revenue ?? 0
  const checkInCount =
    analytics?.checkInCount ?? analytics?.summary?.totalCheckedIn ?? 0
  const waitlistCount = analytics?.waitlistCount ?? 0
  const capacity =
    analytics?.totalCapacity ?? event.capacity ?? event.maxAttendees ?? 0
  const salesHistory = analytics?.salesHistory ?? []

  return (
    <PageShell>
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all hover:text-primary"
      >
        <ArrowLeft size={14} /> Retour
      </Link>

      {resolveImageUrl(event.image) && (
        <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-border/60 shadow-klyb-sm md:h-64">
          <img
            src={resolveImageUrl(event.image)!}
            alt={event.title}
            className="size-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
        </div>
      )}

      <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-border/60 bg-gradient-to-br from-secondary/40 via-card to-accent/30 px-5 py-5 shadow-klyb-sm sm:px-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 rounded-2xl border border-border/80 shadow-klyb-sm">
              <AvatarImage src={resolveImageUrl(event.image) || undefined} className="object-cover" />
              <AvatarFallback>EV</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-lg border-2 border-card bg-success shadow-sm">
              <CheckCircle2 size={12} className="text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{event.title}</h2>
              <Badge
                variant="outline"
                className="border-success/20 bg-success/5 px-1.5 py-0 text-xs font-semibold uppercase tracking-wider text-success"
              >
                {event.visibility === 'public' ? 'Publié' : 'Privé'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarIcon size={12} className="text-primary" />
                {new Date(event.startDate).toLocaleDateString('fr-FR')}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={12} className="text-primary" /> {event.location}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          {permissions.edit_events && (
            <Link to={`/create/${event.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-xl border-border bg-card px-3 text-xs font-semibold uppercase tracking-wider"
              >
                <Pencil size={14} /> Éditer
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCalendar}
            className="h-9 gap-2 rounded-xl border-border bg-card px-3 text-xs font-semibold uppercase tracking-wider"
          >
            <CalendarIcon size={14} /> iCal
          </Button>
          {permissions.delete_events && (
            <Button
              onClick={handleDeleteEvent}
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/5"
            >
              <Trash2 size={14} />
            </Button>
          )}
          {permissions.manage_event_checkin && (
            <Button
              size="sm"
              className="h-9 gap-2 rounded-xl px-4 text-xs font-semibold uppercase tracking-wider shadow-md shadow-primary/10"
              onClick={() => setScannerOpen(true)}
            >
              <QrCode size={14} /> Scanner
            </Button>
          )}
        </div>
      </div>

      <PageTabs value={tab} onValueChange={(v) => v && setTab(v)}>
        <PageTabsList>
          <PageTabsTrigger value="analytics">Analytics</PageTabsTrigger>
          <PageTabsTrigger value="attendees">Invités ({attendees.length})</PageTabsTrigger>
          <PageTabsTrigger value="promo">Codes promo</PageTabsTrigger>
        </PageTabsList>

        {/* ─── Analytics ─── */}
        <PageTabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Card className="rounded-2xl border border-border/80 bg-card shadow-klyb-sm">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Revenu
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl font-bold tabular-nums tracking-tight">
                  {totalRevenue.toLocaleString('fr-FR')} €
                </div>
                {hasRevenueChange && (
                  <div className="mt-2 flex items-center gap-1">
                    {revenueChange! >= 0 ? (
                      <TrendingUp size={12} className="text-success" />
                    ) : (
                      <TrendingDown size={12} className="text-destructive" />
                    )}
                    <span
                      className={`text-[10px] font-bold ${
                        revenueChange! >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {revenueChange! >= 0 ? '+' : ''}
                      {revenueChange}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-border/80 bg-card shadow-klyb-sm">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Check-ins
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl font-bold tabular-nums tracking-tight">
                  {checkInCount}{' '}
                  <span className="text-xs text-muted-foreground font-medium">
                    / {capacity || 0}
                  </span>
                </div>
                <div className="mt-3 h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${Math.min(
                        100,
                        (checkInCount / (capacity || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-border/80 bg-card shadow-klyb-sm">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Waitlist
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl font-bold tabular-nums tracking-tight text-warning">
                  {waitlistCount}
                </div>
                <p className="mt-1 text-xs font-medium text-muted-foreground italic">
                  {waitlistCount > 0 ? 'Demande forte' : 'Aucune attente'}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-border/80 bg-card shadow-klyb-sm">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Billets vendus
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl font-bold tabular-nums tracking-tight">
                  {analytics?.ticketsSold ?? analytics?.summary?.totalRegistered ?? 0}
                </div>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  Remplissage {analytics?.fillRate ?? '-'}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-border/80 bg-card shadow-klyb-sm">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Taux check-in
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl font-bold tabular-nums tracking-tight text-success">
                  {analytics?.checkInRate ?? '0%'}
                </div>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  No-show {analytics?.summary?.noShowRate ?? '-'}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-border/80 bg-card shadow-klyb-sm">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Conversion
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl font-bold tabular-nums tracking-tight">
                  {analytics?.conversionRate ?? '-'}
                </div>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {analytics?.interestedCount ?? 0} intéressés
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border border-border/80 bg-card shadow-klyb-sm">
            <CardHeader className="border-b border-border/40 bg-gradient-to-r from-muted/30 to-transparent p-5 pb-2">
              <CardTitle className="text-sm font-bold">Ventes Live</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 h-[280px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesHistory.length > 0 ? salesHistory : [{ name: '-', sales: 0 }]}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)', fontWeight: 'bold' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)', fontWeight: 'bold' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '1rem',
                      border: 'none',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                      background: 'var(--color-card)',
                      fontSize: '10px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {analytics?.statsByTicketType && analytics.statsByTicketType.length > 0 && (
            <Card className="rounded-2xl border border-border/80 bg-card shadow-klyb-sm">
              <CardHeader className="border-b border-border/40 bg-gradient-to-r from-muted/30 to-transparent p-5 pb-2">
                <CardTitle className="text-sm font-bold">Performance par billet</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {analytics.statsByTicketType.map((tt) => (
                    <div
                      key={tt.name}
                      className="rounded-xl border border-border/60 bg-muted/30 p-4"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {tt.name}
                      </p>
                      <p className="mt-1 text-lg font-bold tabular-nums">
                        {tt.revenue.toLocaleString('fr-FR')} €
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{tt.sold} / {tt.total} vendus</span>
                        <span>
                          {tt.total > 0
                            ? `${Math.round((tt.sold / tt.total) * 100)}%`
                            : '-'}
                        </span>
                      </div>
                      <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${tt.total > 0 ? Math.min(100, (tt.sold / tt.total) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </PageTabsContent>

        {/* ─── Attendees ─── */}
        <PageTabsContent value="attendees">
          <Card className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-klyb-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/40 bg-gradient-to-r from-muted/30 to-transparent p-5 pb-4">
              <div className="relative w-48 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un invité…"
                  className="pl-9"
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-xl border-border text-xs font-semibold uppercase tracking-wider"
              >
                <Filter size={14} /> Filtre
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="h-10 px-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Participant
                    </TableHead>
                    <TableHead className="h-10 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Billet
                    </TableHead>
                    <TableHead className="h-10 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Check-in
                    </TableHead>
                    <TableHead className="px-5 h-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="p-0">
                        <Empty className="border-0 bg-transparent py-12">
                          <EmptyHeader>
                            <EmptyMedia variant="icon" className="size-10 rounded-xl bg-muted text-muted-foreground">
                              <Search />
                            </EmptyMedia>
                            <EmptyTitle>
                              {guestSearch ? 'Aucun résultat' : 'Aucun participant'}
                            </EmptyTitle>
                            <EmptyDescription>
                              {guestSearch
                                ? 'Aucun invité ne correspond à cette recherche.'
                                : 'Aucun participant inscrit pour le moment.'}
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAttendees.map((a) => (
                      <TableRow
                        key={a.id}
                        className="group hover:bg-muted/50 transition-colors border-border"
                      >
                        <TableCell className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 rounded-lg border border-border shadow-sm shrink-0">
                              {a.user?.avatar && <AvatarImage src={resolveImageUrl(a.user.avatar) || undefined} />}
                              <AvatarFallback className="bg-primary/5 text-primary font-bold text-[10px]">
                                {(a.user?.name || 'U').substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-[12px] font-bold leading-tight truncate">
                                {a.user?.name || 'Utilisateur'}
                              </p>
                              <p className="text-[9px] text-muted-foreground opacity-60 truncate">
                                {a.user?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="rounded-md bg-muted text-foreground border-border font-bold uppercase text-[8px] px-1.5 py-0"
                          >
                            {a.ticketType?.name || 'Standard'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {a.checkedIn ? (
                            <CheckCircle2 size={18} className="text-success mx-auto" />
                          ) : permissions.manage_event_checkin ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={checkingIn === a.id}
                              onClick={() => handleCheckIn(a.id)}
                              className="h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all"
                            >
                              {checkingIn === a.id ? (
                                <Loader2 className="animate-spin h-3 w-3" />
                              ) : (
                                <QrCode size={14} />
                              )}
                            </Button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right px-5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <MoreVertical size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </PageTabsContent>

        {/* ─── Promo codes ─── */}
        <PageTabsContent value="promo">
          <Card className="rounded-2xl border border-border/80 bg-card p-6 shadow-klyb-sm">
            <PromoCodeManager eventId={event.id} />
          </Card>
        </PageTabsContent>
      </PageTabs>

      {/* QR Scanner modal */}
      {id && (
        <CheckInScanner
          eventId={id}
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onSuccess={handleScannerSuccess}
        />
      )}
    </PageShell>
  )
}

export default EventDetails
