import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Users,
  TrendingUp,
  MapPin,
  Plus,
  ArrowUpRight,
  Download,
  Calendar as CalendarIcon,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress, ProgressTrack } from "@/components/ui/progress"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCard } from "@/components/layout/StatCard"
import { PageLoader } from "@/components/layout/PageLoader"
import { useCommunity } from "@/context/CommunityContext"
import { eventService } from "@/services/api"

const Dashboard = () => {
  const { selectedCommunityId } = useCommunity()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    members: "0",
    membersChange: "-",
    engagement: "0%",
    engagementChange: "-",
    activeEvents: "0",
  })
  const [activity, setActivity] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [eventsRes, statsRes, activityRes] = await Promise.all([
          eventService.getAll(selectedCommunityId),
          eventService.getGlobalStats(selectedCommunityId),
          eventService.getRecentActivity(selectedCommunityId),
        ])

        const globalStats = statsRes.data
        setStats({
          members: globalStats.totalAttendees?.toString() || "0",
          membersChange: globalStats.attendeesChange || "-",
          engagement: globalStats.engagementRate || "0%",
          engagementChange: globalStats.engagementChange || "+0%",
          activeEvents: globalStats.activeEvents?.toString() || "0",
        })

        setEvents((eventsRes.data || []).slice(0, 5))
        setActivity(activityRes.data || [])
      } catch (err) {
        console.error("Dashboard fetch failed", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedCommunityId])

  if (loading && !stats.members) return <PageLoader />

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="Vue d'ensemble"
        description="Statistiques de votre écosystème communautaire"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download data-icon="inline-start" />
              Export
            </Button>
            <Link to="/create">
              <Button size="sm">
                <Plus data-icon="inline-start" />
                Nouvel Event
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Inscrits"
          value={stats.members}
          change={stats.membersChange}
          icon={Users}
          trend={stats.membersChange?.startsWith("-") ? "down" : "up"}
          loading={loading}
        />
        <StatCard
          title="Taux Engagement"
          value={stats.engagement}
          change={stats.engagementChange}
          icon={TrendingUp}
          trend={stats.engagementChange?.startsWith("-") ? "down" : "up"}
          loading={loading}
        />
        <StatCard
          title="Événements Actifs"
          value={stats.activeEvents}
          icon={CalendarIcon}
          loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8 shadow-klyb-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Événements en cours</CardTitle>
              <CardDescription>Gestion de proximité</CardDescription>
            </div>
            <Link to="/events">
              <Button variant="ghost" size="sm">Tout voir</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <PageLoader label="Chargement des événements…" className="min-h-[200px]" />
            ) : events.length === 0 ? (
              <Empty className="border-border bg-muted/30">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CalendarIcon />
                  </EmptyMedia>
                  <EmptyTitle>Aucun événement</EmptyTitle>
                  <EmptyDescription>Prêt pour votre prochain succès ?</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Link to="/create">
                    <Button variant="outline" size="sm">Lancer un projet</Button>
                  </Link>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="flex flex-col gap-4">
                {events.map((event) => {
                  const participation = Math.min(
                    100,
                    ((event.attendeesCount || 0) / (event.capacity || 100)) * 100
                  )
                  return (
                    <div
                      key={event.id}
                      className="group flex items-center gap-4 rounded-xl border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/40"
                    >
                      <div className="size-16 shrink-0 overflow-hidden rounded-xl shadow-klyb-sm">
                        <img
                          src={
                            event.image ||
                            "https://images.unsplash.com/photo-1574169208507-84376144848b?w=400&auto=format&fit=crop&q=60"
                          }
                          alt={event.title}
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="truncate text-sm font-semibold group-hover:text-primary">
                            {event.title}
                          </h4>
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            {event.visibility === "public" ? "Public" : "Privé"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <CalendarIcon className="text-primary" />
                            {new Date(event.startDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1.5 truncate">
                            <MapPin className="shrink-0 text-primary" />
                            {event.location}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Participation</span>
                            <span>{event.attendeesCount || 0} inscrits</span>
                          </div>
                          <Progress value={participation} className="w-full gap-0">
                            <ProgressTrack className="h-1.5" />
                          </Progress>
                        </div>
                      </div>
                      <Link to={`/events/${event.id}`}>
                        <Button variant="secondary" size="icon" className="shrink-0 rounded-xl">
                          <ArrowUpRight />
                        </Button>
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 shadow-klyb-sm">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Dernières interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucune activité.</p>
            ) : (
              <div className="flex flex-col gap-6">
                {activity.map((item, i) => (
                  <div key={item.id} className="relative flex gap-3">
                    {i < activity.length - 1 && (
                      <div className="absolute top-3 bottom-[-24px] left-[5px] w-px bg-border" />
                    )}
                    <div className="z-10 mt-1 size-2.5 shrink-0 rounded-full border-2 border-primary bg-background" />
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium">{item.user?.name || "Utilisateur"}</p>
                      <p className="text-xs text-muted-foreground">
                        Inscrit à{" "}
                        <span className="font-medium text-primary">{item.event?.title}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" className="mt-8 w-full">
              Voir le journal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
