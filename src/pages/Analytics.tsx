import { useState, useEffect } from "react"
import {
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  ChevronRight,
  Calendar as CalendarIcon,
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
} from "recharts"
import { Link } from "react-router-dom"
import { eventService } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageLoader } from "@/components/layout/PageLoader"
import { KLYB_COLORS } from "@/constants/colors"
import { toast } from "sonner"
import { useCommunity } from "@/context/CommunityContext"

const Analytics = () => {
  const { selectedCommunityId } = useCommunity()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true)
        const [statsRes, historyRes, eventsRes] = await Promise.all([
          eventService.getGlobalStats(selectedCommunityId),
          eventService.getGlobalHistory(selectedCommunityId),
          eventService.getAll(selectedCommunityId),
        ])

        setStats(statsRes.data)
        setHistory(historyRes.data || [])

        const sortedEvents = (eventsRes.data || []).sort(
          (a: any, b: any) => (b.totalRevenue || 0) - (a.totalRevenue || 0)
        )
        setEvents(sortedEvents.slice(0, 5))
      } catch (err) {
        console.error("Failed to fetch analytics", err)
        toast.error("Erreur lors du chargement des statistiques")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [selectedCommunityId])

  if (loading) return <PageLoader />

  const statItems = [
    {
      title: "Revenu Brut",
      value: `${stats?.totalRevenue?.toLocaleString() ?? 0}€`,
      change: stats?.revenueChange,
    },
    {
      title: "Inscriptions",
      value: stats?.totalAttendees?.toLocaleString() ?? "0",
      change: stats?.attendeesChange,
    },
    {
      title: "Engagement",
      value: stats?.engagementRate ?? "0%",
      change: stats?.engagementChange,
    },
    {
      title: "Événements",
      value: String(stats?.activeEvents || "0"),
      change: null,
    },
  ]

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="Statistiques"
        description="Analyse de la performance globale"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Calendar data-icon="inline-start" />
              30 jours
            </Button>
            <Button size="sm">
              <Download data-icon="inline-start" />
              Rapport
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => (
          <Card key={item.title} className="shadow-klyb-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{item.value}</div>
              {item.change && (
                <div
                  className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                    item.change.startsWith("-") ? "text-destructive" : "text-success"
                  }`}
                >
                  {item.change.startsWith("-") ? (
                    <ArrowDownRight className="size-3" />
                  ) : (
                    <ArrowUpRight className="size-3" />
                  )}
                  {item.change}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-klyb-sm">
          <CardHeader>
            <CardTitle>Courbe de ventes</CardTitle>
            <CardDescription>Évolution quotidienne</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-4 h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history.length > 0 ? history : [{ name: "-", value: 0 }]}>
                  <defs>
                    <linearGradient id="klybArea" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="value"
                    stroke={KLYB_COLORS.primary}
                    strokeWidth={2}
                    fill="url(#klybArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-klyb-sm">
          <CardHeader>
            <CardTitle>Performance volumétrique</CardTitle>
            <CardDescription>Répartition journalière</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-4 h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history.length > 0 ? history : [{ name: "-", value: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    cursor={{ fill: `${KLYB_COLORS.primary}08` }}
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {history.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index % 2 === 0 ? KLYB_COLORS.primary : KLYB_COLORS.chartSecondary}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-klyb-sm">
        <CardHeader>
          <CardTitle>Top événements</CardTitle>
          <CardDescription>Classement par rentabilité</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Aucune donnée</p>
          ) : (
            <div className="flex flex-col gap-3">
              {events.map((event, i) => (
                <div
                  key={event.id}
                  className="group flex items-center justify-between rounded-xl border border-transparent bg-muted/40 p-4 transition-colors hover:border-border"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="w-5 text-sm font-bold text-primary/30">#{i + 1}</div>
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10">
                      {event.image ? (
                        <img src={event.image} alt="" className="size-full object-cover" />
                      ) : (
                        <CalendarIcon className="text-primary/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold group-hover:text-primary">
                        {event.title}
                      </h4>
                      <p className="truncate text-xs text-muted-foreground">{event.location}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-6">
                    <div className="hidden text-right sm:block">
                      <p className="text-[10px] text-muted-foreground">Inscriptions</p>
                      <p className="text-sm font-semibold tabular-nums">{event.attendeesCount || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Revenus</p>
                      <p className="text-sm font-semibold text-primary tabular-nums">
                        {(event.totalRevenue || 0).toLocaleString()}€
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
    </div>
  )
}

export default Analytics
