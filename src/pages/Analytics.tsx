import { useState, useEffect, useCallback } from "react"
import {
  ArrowUpRight,
  Calendar,
  Download,
  ChevronRight,
  Calendar as CalendarIcon,
  Euro,
  Users,
  Ticket,
  TrendingUp,
  UserCheck,
  UserX,
  Percent,
  Clock,
  Tag,
  BarChart3,
  Activity,
} from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
  ComposedChart,
  Line,
} from "recharts"
import { Link } from "react-router-dom"
import { eventService } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageLoader } from "@/components/layout/PageLoader"
import { StatCard } from "@/components/layout/StatCard"
import { KLYB_COLORS } from "@/constants/colors"
import { toast } from "sonner"
import { useCommunity } from "@/context/CommunityContext"
import type { AdvancedStats } from "@/types/analytics"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const PERIOD_OPTIONS = [
  { value: "7", label: "7 jours" },
  { value: "30", label: "30 jours" },
  { value: "90", label: "90 jours" },
] as const

const FUNNEL_COLORS = [
  KLYB_COLORS.info,
  KLYB_COLORS.primary,
  KLYB_COLORS.success,
  KLYB_COLORS.warning,
  KLYB_COLORS.destructive,
]

const STATUS_COLORS: Record<string, string> = {
  draft: "#94A3B8",
  published: KLYB_COLORS.primary,
  cancelled: KLYB_COLORS.destructive,
  finished: KLYB_COLORS.success,
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
  cancelled: "Annulé",
  finished: "Terminé",
}

function trendFromChange(change?: string): "up" | "down" {
  if (!change || change === "-") return "up"
  return change.startsWith("-") ? "down" : "up"
}

const Analytics = () => {
  const { selectedCommunityId } = useCommunity()
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState("30")
  const [data, setData] = useState<AdvancedStats | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await eventService.getAdvancedStats(
        selectedCommunityId,
        parseInt(days, 10)
      )
      setData(res.data)
    } catch (err) {
      console.error("Failed to fetch analytics", err)
      toast.error("Erreur lors du chargement des statistiques")
    } finally {
      setLoading(false)
    }
  }, [selectedCommunityId, days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = () => {
    if (!data) return

    const rows: string[][] = [
      ["Rapport statistiques événements", `Période: ${days} jours`],
      [],
      ["Vue d'ensemble"],
      ["Revenu total", `${data.overview.totalRevenue}€`],
      ["Revenu période", `${data.overview.periodRevenue}€`],
      ["Inscriptions totales", String(data.overview.totalAttendees)],
      ["Billets vendus", String(data.overview.ticketsSold)],
      ["Taux check-in", data.overview.checkInRate],
      ["Taux no-show", data.overview.noShowRate],
      ["Prix moyen billet", `${data.overview.avgTicketPrice}€`],
      [],
      ["Top événements", "Revenus", "Inscrits", "Check-in", "Remplissage"],
      ...data.topEvents.map((e) => [
        e.title,
        `${e.revenue}€`,
        String(e.attendeesCount),
        e.checkInRate,
        e.fillRate,
      ]),
    ]

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `stats-evenements-${days}j.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Rapport exporté")
  }

  if (loading && !data) return <PageLoader />

  const overview = data?.overview
  const funnelData = data
    ? [
        { name: "Intéressés", value: data.funnel.interested },
        { name: "Inscrits", value: data.funnel.going },
        { name: "Check-in", value: data.funnel.checkedIn },
        { name: "Liste d'attente", value: data.funnel.waitlisted },
        { name: "Annulés", value: data.funnel.cancelled },
      ].filter((d) => d.value > 0)
    : []

  const statusData = data
    ? Object.entries(data.statusBreakdown)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({
          name: STATUS_LABELS[key] || key,
          value,
          key,
        }))
    : []

  const combinedHistory =
    data?.salesHistory.map((s, i) => ({
      name: s.name,
      revenue: s.value,
      registrations: data.registrationHistory[i]?.value ?? 0,
      tickets: s.registrations ?? 0,
    })) ?? []

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="Statistiques événements"
        description="Dashboard analytique complet de vos événements"
        actions={
          <>
            <Select value={days} onValueChange={(v) => v && setDays(v)}>
              <SelectTrigger size="sm" className="w-[130px]">
                <Calendar className="size-3.5 opacity-60" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleExport} disabled={!data}>
              <Download data-icon="inline-start" />
              Exporter CSV
            </Button>
          </>
        }
      />

      {/* KPI principaux */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenu total"
          value={`${(overview?.totalRevenue ?? 0).toLocaleString("fr-FR")} €`}
          change={overview?.revenueChange}
          trend={trendFromChange(overview?.revenueChange)}
          icon={Euro}
          loading={loading}
        />
        <StatCard
          title="Inscriptions"
          value={(overview?.totalAttendees ?? 0).toLocaleString("fr-FR")}
          change={overview?.attendeesChange}
          trend={trendFromChange(overview?.attendeesChange)}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Billets vendus"
          value={(overview?.ticketsSold ?? 0).toLocaleString("fr-FR")}
          change={overview?.ticketsSoldChange}
          trend={trendFromChange(overview?.ticketsSoldChange)}
          icon={Ticket}
          loading={loading}
        />
        <StatCard
          title="Événements actifs"
          value={`${overview?.activeEvents ?? 0} / ${overview?.totalEvents ?? 0}`}
          icon={CalendarIcon}
          loading={loading}
        />
      </div>

      {/* KPI secondaires */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Taux check-in"
          value={overview?.checkInRate ?? "0%"}
          icon={UserCheck}
          loading={loading}
        />
        <StatCard
          title="Taux no-show"
          value={overview?.noShowRate ?? "0%"}
          icon={UserX}
          loading={loading}
        />
        <StatCard
          title="Prix moyen billet"
          value={`${(overview?.avgTicketPrice ?? 0).toLocaleString("fr-FR")} €`}
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          title="Conversion intérêt → inscription"
          value={overview?.conversionRate ?? "-"}
          icon={Percent}
          loading={loading}
        />
      </div>

      {/* Revenus + inscriptions combinés */}
      <Card className="shadow-klyb-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            Évolution revenus & inscriptions
          </CardTitle>
          <CardDescription>
            Revenus, billets vendus et nouvelles inscriptions sur {days} jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combinedHistory.length > 0 ? combinedHistory : [{ name: "-", revenue: 0, registrations: 0, tickets: 0 }]}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={KLYB_COLORS.primary} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={KLYB_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    fontSize: "12px",
                  }}
                  formatter={(value, name) => {
                    const v = Number(value) || 0
                    if (name === "revenue") return [`${v.toLocaleString("fr-FR")} €`, "Revenus"]
                    if (name === "registrations") return [v, "Inscriptions"]
                    return [v, "Billets"]
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke={KLYB_COLORS.primary}
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
                <Bar
                  yAxisId="right"
                  dataKey="registrations"
                  fill={KLYB_COLORS.chartSecondary}
                  radius={[3, 3, 0, 0]}
                  opacity={0.7}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="tickets"
                  stroke={KLYB_COLORS.tertiary}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Entonnoir de conversion */}
        <Card className="shadow-klyb-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              Entonnoir de conversion
            </CardTitle>
            <CardDescription>Parcours participant de l'intérêt au check-in</CardDescription>
          </CardHeader>
          <CardContent>
            {funnelData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Aucune donnée</p>
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      width={100}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "0.75rem",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {funnelData.map((_, i) => (
                        <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Répartition par statut */}
        <Card className="shadow-klyb-sm">
          <CardHeader>
            <CardTitle>Répartition par statut</CardTitle>
            <CardDescription>État de vos événements</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Aucun événement</p>
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || KLYB_COLORS.primary} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "0.75rem",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs text-muted-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance par type de billet */}
        <Card className="shadow-klyb-sm">
          <CardHeader>
            <CardTitle>Performance par type de billet</CardTitle>
            <CardDescription>Revenus par catégorie de billet</CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.ticketTypePerformance?.length ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Aucun billet configuré</p>
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.ticketTypePerformance}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "0.75rem",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        fontSize: "12px",
                      }}
                      formatter={(value, name) => {
                        const v = Number(value) || 0
                        if (name === "revenue") return [`${v.toLocaleString("fr-FR")} €`, "Revenus"]
                        if (name === "sold") return [v, "Vendus"]
                        return [v, String(name)]
                      }}
                    />
                    <Bar dataKey="revenue" fill={KLYB_COLORS.primary} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sold" fill={KLYB_COLORS.chartSecondary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vélocité check-in */}
        <Card className="shadow-klyb-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Vélocité check-in
            </CardTitle>
            <CardDescription>Répartition horaire des arrivées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.checkInVelocity ?? []}>
                  <defs>
                    <linearGradient id="checkinGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={KLYB_COLORS.success} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={KLYB_COLORS.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    interval={2}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={KLYB_COLORS.success}
                    strokeWidth={2}
                    fill="url(#checkinGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Codes promo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-klyb-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Tag className="size-4 text-primary" />
              Codes promo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{data?.promoStats.totalCodes ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total créés</p>
          </CardContent>
        </Card>
        <Card className="shadow-klyb-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Codes actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-success">
              {data?.promoStats.activeCodes ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Encore valides</p>
          </CardContent>
        </Card>
        <Card className="shadow-klyb-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Utilisations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {data?.promoStats.totalUses ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Codes appliqués</p>
          </CardContent>
        </Card>
      </div>

      {/* Top événements */}
      <Card className="shadow-klyb-sm">
        <CardHeader>
          <CardTitle>Classement événements</CardTitle>
          <CardDescription>Performance détaillée par événement</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.topEvents?.length ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Aucune donnée</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.topEvents.map((event, i) => (
                <div
                  key={event.id}
                  className="group flex items-center justify-between rounded-xl border border-transparent bg-muted/40 p-4 transition-colors hover:border-border"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="w-6 text-sm font-bold text-primary/30">#{i + 1}</div>
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10">
                      {event.image ? (
                        <img src={event.image} alt="" className="size-full object-cover" />
                      ) : (
                        <CalendarIcon className="text-primary/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate text-sm font-semibold group-hover:text-primary">
                          {event.title}
                        </h4>
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {STATUS_LABELS[event.status] || event.status}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {event.location} ·{" "}
                        {new Date(event.startDate).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 sm:gap-6">
                    <div className="hidden text-right sm:block">
                      <p className="text-[10px] text-muted-foreground">Inscrits</p>
                      <p className="text-sm font-semibold tabular-nums">{event.attendeesCount}</p>
                    </div>
                    <div className="hidden text-right md:block">
                      <p className="text-[10px] text-muted-foreground">Check-in</p>
                      <p className="text-sm font-semibold tabular-nums">{event.checkInRate}</p>
                    </div>
                    <div className="hidden text-right md:block">
                      <p className="text-[10px] text-muted-foreground">Remplissage</p>
                      <p className="text-sm font-semibold tabular-nums">{event.fillRate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Revenus</p>
                      <p className="text-sm font-semibold text-primary tabular-nums">
                        {event.revenue.toLocaleString("fr-FR")} €
                      </p>
                    </div>
                    <Link to={`/events/${event.id}`}>
                      <Button variant="ghost" size="icon">
                        <ChevronRight />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activité récente */}
      <Card className="shadow-klyb-sm">
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>Dernières inscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.recentActivity?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucune activité récente</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      {activity.user?.avatar && (
                        <AvatarImage src={activity.user.avatar} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {(activity.user?.name || "U").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {activity.user?.name || "Utilisateur"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.event?.title || "Événement"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {activity.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {activity.event?.id && (
                      <div
                        className={`flex items-center gap-0.5 text-xs font-medium ${
                          trendFromChange("+") === "up" ? "text-success" : "text-destructive"
                        }`}
                      >
                        <ArrowUpRight className="size-3" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Analytics
