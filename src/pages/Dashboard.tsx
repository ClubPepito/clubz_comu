import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import {
  Users,
  TrendingUp,
  MapPin,
  Plus,
  ArrowUpRight,
  Download,
  Calendar as CalendarIcon,
  Sparkles,
  UserPlus,
  GitBranch,
  MessageSquare,
  ShieldAlert,
  Hash,
  Puzzle,
  Settings,
  Lock,
  Globe,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress, ProgressTrack } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { AtmosphericHeader } from "@/components/layout/AtmosphericHeader"
import { StatCard } from "@/components/layout/StatCard"
import { PageLoader } from "@/components/layout/PageLoader"
import {
  PageTabs,
  PageTabsList,
  PageTabsTrigger,
  PageTabsContent,
} from "@/components/layout/PageTabs"
import { useCommunity } from "@/context/CommunityContext"
import {
  eventService,
  communityService,
  postService,
  channelService,
  moderationService,
  widgetInstallationService,
} from "@/services/api"
import { resolveImageUrl } from "@/lib/imageUrl"
import { toast } from "sonner"

const KYC_LABELS: Record<string, string> = {
  verified: "Certifié",
  pending: "KYC en cours",
  rejected: "KYC refusé",
  none: "Non certifié",
  unsubmitted: "Non certifié",
}

const ACCESS_LABELS: Record<string, string> = {
  public: "Public",
  private: "Privé",
  paid: "Payant",
}

type EventsStats = {
  attendees: string
  attendeesChange: string
  engagement: string
  engagementChange: string
  activeEvents: string
}

const Dashboard = () => {
  const {
    selectedCommunityId,
    selectedCommunity,
    pendingRequestsCount,
    pendingAffiliationRequestsCount,
  } = useCommunity()
  const [tab, setTab] = useState("community")

  const [events, setEvents] = useState<any[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsStats, setEventsStats] = useState<EventsStats>({
    attendees: "0",
    attendeesChange: "-",
    engagement: "-",
    engagementChange: "-",
    activeEvents: "0",
  })
  const [activity, setActivity] = useState<any[]>([])

  const [communityLoading, setCommunityLoading] = useState(true)
  const [community, setCommunity] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [postsCount, setPostsCount] = useState(0)
  const [channelsCount, setChannelsCount] = useState(0)
  const [pendingReports, setPendingReports] = useState(0)
  const [widgetsCount, setWidgetsCount] = useState(0)
  const [pendingMemberships, setPendingMemberships] = useState<any[]>([])
  const [pendingAffiliations, setPendingAffiliations] = useState<any[]>([])

  useEffect(() => {
    const fetchEventsTab = async () => {
      if (!selectedCommunityId) return
      try {
        setEventsLoading(true)
        const [eventsRes, statsRes, activityRes] = await Promise.all([
          eventService.getAll(selectedCommunityId),
          eventService.getGlobalStats(selectedCommunityId),
          eventService.getRecentActivity(selectedCommunityId),
        ])

        const globalStats = statsRes.data
        setEventsStats({
          attendees: globalStats.totalAttendees?.toString() || "0",
          attendeesChange: globalStats.attendeesChange || "-",
          engagement: globalStats.engagementRate || "-",
          engagementChange: globalStats.engagementChange || "-",
          activeEvents: globalStats.activeEvents?.toString() || "0",
        })
        setEvents((eventsRes.data || []).slice(0, 5))
        setActivity(activityRes.data || [])
      } catch (err) {
        console.error("Dashboard events fetch failed", err)
      } finally {
        setEventsLoading(false)
      }
    }
    fetchEventsTab()
  }, [selectedCommunityId])

  useEffect(() => {
    const fetchCommunityTab = async () => {
      if (!selectedCommunityId) return
      try {
        setCommunityLoading(true)
        const [
          communityRes,
          membersRes,
          rolesRes,
          postsRes,
          channelsRes,
          reportsRes,
          widgetsRes,
          requestsRes,
          affiliationsRes,
        ] = await Promise.all([
          communityService.getOne(selectedCommunityId),
          communityService.getMembers(selectedCommunityId),
          communityService.getRoles(selectedCommunityId),
          postService.getAll(selectedCommunityId).catch(() => ({ data: [] })),
          channelService.getAll(selectedCommunityId).catch(() => ({ data: [] })),
          moderationService
            .getCommunityReports(selectedCommunityId, "pending")
            .catch(() => ({ data: [] })),
          widgetInstallationService
            .getByCommunity(selectedCommunityId)
            .catch(() => ({ data: [] })),
          communityService.getPendingRequests(selectedCommunityId).catch(() => ({ data: [] })),
          communityService.getParentRequests(selectedCommunityId).catch(() => ({ data: [] })),
        ])

        setCommunity(communityRes.data)
        setMembers(membersRes.data || [])
        setRoles(rolesRes.data || [])
        setPostsCount((postsRes.data || []).length)

        const categories = channelsRes.data || []
        const channelTotal = categories.reduce(
          (acc: number, cat: any) => acc + (cat.channels?.length || 0),
          0
        )
        setChannelsCount(channelTotal)

        const reports = reportsRes.data || []
        setPendingReports(
          Array.isArray(reports)
            ? reports.filter((r: any) => r.status === "pending").length || reports.length
            : 0
        )
        setWidgetsCount((widgetsRes.data || []).length)
        setPendingMemberships((requestsRes.data || []).slice(0, 5))
        setPendingAffiliations((affiliationsRes.data || []).slice(0, 5))
      } catch (err) {
        console.error("Dashboard community fetch failed", err)
        toast.error("Impossible de charger la vue communauté")
      } finally {
        setCommunityLoading(false)
      }
    }
    fetchCommunityTab()
  }, [selectedCommunityId])

  const memberCount = useMemo(() => {
    if (typeof community?.memberCount === "number") return community.memberCount
    return members.length
  }, [community, members])

  const newMembersCount = useMemo(
    () =>
      members.filter(
        (m) => new Date(m.joinedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
    [members]
  )

  const handleExportEvents = () => {
    const rows: string[][] = [
      ["Vue événements"],
      ["Inscrits événements", eventsStats.attendees],
      ["Variation inscrits", eventsStats.attendeesChange],
      ["Engagement", eventsStats.engagement],
      ["Variation engagement", eventsStats.engagementChange],
      ["Événements actifs", eventsStats.activeEvents],
      [],
      ["Événements", "Date", "Lieu", "Inscrits", "Capacité"],
      ...events.map((e) => [
        e.title || "",
        e.startDate ? new Date(e.startDate).toLocaleDateString() : "",
        e.location || "",
        String(e.attendeesCount || 0),
        e.capacity != null ? String(e.capacity) : "",
      ]),
      [],
      ["Activité récente", "Événement", "Heure"],
      ...activity.map((item) => [
        item.user?.name || "Utilisateur",
        item.event?.title || "",
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
      ]),
    ]

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `vue-evenements-${selectedCommunityId || "community"}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Export téléchargé")
  }

  const displayName = community?.name || selectedCommunity?.name || "Communauté"
  const accessType = community?.accessType || (community?.isPublic ? "public" : "private")
  const kycStatus = community?.kycStatus || "none"

  return (
    <div className="flex flex-col gap-8 pb-12">
      <AtmosphericHeader
        title="Vue d'ensemble"
        description={
          tab === "community"
            ? `État de ${displayName}`
            : "Statistiques et activité de vos événements"
        }
        actions={
          tab === "events" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportEvents}
                disabled={eventsLoading}
              >
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
          ) : (
            <Link to="/settings">
              <Button variant="outline" size="sm">
                <Settings data-icon="inline-start" />
                Paramètres
              </Button>
            </Link>
          )
        }
      />

      <PageTabs value={tab} onValueChange={(v) => v && setTab(v)}>
        <PageTabsList>
          <PageTabsTrigger value="community">Vue d'ensemble de la communauté</PageTabsTrigger>
          <PageTabsTrigger value="events">Vue événements</PageTabsTrigger>
        </PageTabsList>

        <PageTabsContent value="community">
          {communityLoading && !community ? (
            <PageLoader />
          ) : (
            <div className="flex flex-col gap-6">
              <Card className="border-border/80 shadow-klyb-sm">
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
                    {resolveImageUrl(community?.logo) ? (
                      <img
                        src={resolveImageUrl(community?.logo) || ""}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <Users className="size-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-semibold">{displayName}</h2>
                      <Badge variant="secondary">
                        {accessType === "public" ? (
                          <Globe className="size-3" data-icon="inline-start" />
                        ) : (
                          <Lock className="size-3" data-icon="inline-start" />
                        )}
                        {ACCESS_LABELS[accessType] || accessType}
                      </Badge>
                      <Badge variant="outline">{KYC_LABELS[kycStatus] || kycStatus}</Badge>
                    </div>
                    {community?.description ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {community.description}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucune description</p>
                    )}
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Sparkles className="size-3.5 text-primary" />
                      {memberCount} membre{memberCount !== 1 ? "s" : ""}
                      {typeof community?.associationCount === "number"
                        ? ` · ${community.associationCount} affiliation${community.associationCount !== 1 ? "s" : ""}`
                        : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link to="/members" className="block h-full">
                  <StatCard
                    title="Membres"
                    value={String(memberCount)}
                    change={newMembersCount > 0 ? `+${newMembersCount} / 7j` : undefined}
                    icon={Users}
                    loading={communityLoading}
                  />
                </Link>
                <Link to="/membership" className="block h-full">
                  <StatCard
                    title="Adhésions en attente"
                    value={String(pendingRequestsCount || pendingMemberships.length)}
                    icon={UserPlus}
                    loading={communityLoading}
                  />
                </Link>
                <Link to="/affiliations" className="block h-full">
                  <StatCard
                    title="Affiliations en attente"
                    value={String(
                      pendingAffiliationRequestsCount || pendingAffiliations.length
                    )}
                    icon={GitBranch}
                    loading={communityLoading}
                  />
                </Link>
                <Link to="/moderation" className="block h-full">
                  <StatCard
                    title="Signalements"
                    value={String(pendingReports)}
                    icon={ShieldAlert}
                    loading={communityLoading}
                  />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link to="/moderation" className="block h-full">
                  <StatCard
                    title="Posts"
                    value={String(postsCount)}
                    icon={MessageSquare}
                    loading={communityLoading}
                  />
                </Link>
                <Link to="/moderation" className="block h-full">
                  <StatCard
                    title="Salons"
                    value={String(channelsCount)}
                    icon={Hash}
                    loading={communityLoading}
                  />
                </Link>
                <Link to="/marketplace" className="block h-full">
                  <StatCard
                    title="Widgets installés"
                    value={String(widgetsCount)}
                    icon={Puzzle}
                    loading={communityLoading}
                  />
                </Link>
                <Link to="/events" className="block h-full">
                  <StatCard
                    title="Événements actifs"
                    value={eventsStats.activeEvents}
                    icon={CalendarIcon}
                    loading={eventsLoading}
                  />
                </Link>
              </div>

              <div className="grid gap-6 lg:grid-cols-12">
                <Card className="border-border/80 lg:col-span-5 shadow-klyb-sm">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-gradient-to-r from-muted/30 to-transparent">
                    <div>
                      <CardTitle>Rôles</CardTitle>
                      <CardDescription>Répartition des accès</CardDescription>
                    </div>
                    <Link to="/members">
                      <Button variant="ghost" size="sm">
                        Gérer
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {roles.length === 0 ? (
                      <Empty className="border-2 border-dashed border-border/80 bg-muted/20 py-10">
                        <EmptyHeader>
                          <EmptyTitle>Aucun rôle</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {roles.map((role) => (
                          <div
                            key={role.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: role.color || "var(--primary)" }}
                              />
                              <span className="truncate text-sm font-medium">{role.name}</span>
                            </div>
                            <Badge variant="secondary" className="tabular-nums">
                              {typeof role.memberCount === "number"
                                ? role.memberCount
                                : members.filter((m) => m.role?.id === role.id).length}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/80 lg:col-span-7 shadow-klyb-sm">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-gradient-to-r from-muted/30 to-transparent">
                    <div>
                      <CardTitle>À traiter</CardTitle>
                      <CardDescription>Adhésions et affiliations en attente</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Link to="/membership">
                        <Button variant="ghost" size="sm">
                          Adhésions
                        </Button>
                      </Link>
                      <Link to="/affiliations">
                        <Button variant="ghost" size="sm">
                          Affiliations
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {pendingMemberships.length === 0 && pendingAffiliations.length === 0 ? (
                      <Empty className="border-2 border-dashed border-border/80 bg-muted/20 py-10">
                        <EmptyHeader>
                          <EmptyTitle>Rien en attente</EmptyTitle>
                          <EmptyDescription>
                            Les demandes d'adhésion et d'affiliation apparaîtront ici.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {pendingMemberships.map((req) => (
                          <div key={req.id || req.userId} className="flex items-center gap-3">
                            <Avatar className="size-9 rounded-lg">
                              <AvatarImage
                                src={resolveImageUrl(req.user?.avatar) || undefined}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {(req.user?.name || "U").substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {req.user?.name || "Utilisateur"}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                Demande d'adhésion
                                {req.joinedAt
                                  ? ` · ${new Date(req.joinedAt).toLocaleDateString()}`
                                  : ""}
                              </p>
                            </div>
                            <Badge variant="secondary">Adhésion</Badge>
                          </div>
                        ))}
                        {pendingAffiliations.map((req) => (
                          <div key={req.id} className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                              {resolveImageUrl(req.logo) ? (
                                <img
                                  src={resolveImageUrl(req.logo) || ""}
                                  alt=""
                                  className="size-full object-cover"
                                />
                              ) : (
                                <GitBranch className="size-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {req.name || "Communauté"}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                Demande d'affiliation
                              </p>
                            </div>
                            <Badge variant="outline">Affiliation</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </PageTabsContent>

        <PageTabsContent value="events">
          {eventsLoading && eventsStats.attendees === "0" && events.length === 0 ? (
            <PageLoader />
          ) : (
            <div className="flex flex-col gap-6">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                {eventsStats.activeEvents} événement
                {eventsStats.activeEvents !== "1" ? "s" : ""} actif
                {eventsStats.activeEvents !== "1" ? "s" : ""} · {eventsStats.attendees} inscrit
                {eventsStats.attendees !== "1" ? "s" : ""}
              </p>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  title="Inscrits événements"
                  value={eventsStats.attendees}
                  change={eventsStats.attendeesChange}
                  icon={Users}
                  trend={eventsStats.attendeesChange?.startsWith("-") ? "down" : "up"}
                  loading={eventsLoading}
                />
                <StatCard
                  title="Taux Engagement"
                  value={eventsStats.engagement}
                  change={eventsStats.engagementChange}
                  icon={TrendingUp}
                  trend={eventsStats.engagementChange?.startsWith("-") ? "down" : "up"}
                  loading={eventsLoading}
                />
                <StatCard
                  title="Événements Actifs"
                  value={eventsStats.activeEvents}
                  icon={CalendarIcon}
                  loading={eventsLoading}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-12">
                <Card className="border-border/80 lg:col-span-8 shadow-klyb-sm">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-gradient-to-r from-muted/30 to-transparent">
                    <div>
                      <CardTitle>Événements en cours</CardTitle>
                      <CardDescription>Gestion de proximité</CardDescription>
                    </div>
                    <Link to="/events">
                      <Button variant="ghost" size="sm">
                        Tout voir
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {eventsLoading ? (
                      <PageLoader
                        label="Chargement des événements…"
                        className="min-h-[200px]"
                      />
                    ) : events.length === 0 ? (
                      <Empty className="border-2 border-dashed border-border/80 bg-muted/20 py-12">
                        <EmptyHeader>
                          <EmptyMedia
                            variant="icon"
                            className="size-12 rounded-2xl bg-primary/10 text-primary [&_svg]:size-5"
                          >
                            <CalendarIcon />
                          </EmptyMedia>
                          <EmptyTitle className="text-base">Aucun événement</EmptyTitle>
                          <EmptyDescription>
                            Prêt pour votre prochain succès ?
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Link to="/create">
                            <Button variant="outline" size="sm">
                              Lancer un projet
                            </Button>
                          </Link>
                        </EmptyContent>
                      </Empty>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {events.map((event) => {
                          const participation = Math.min(
                            100,
                            ((event.attendeesCount || 0) / (event.capacity || 100)) * 100
                          )
                          return (
                            <div
                              key={event.id}
                              className="group flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-all hover:border-border/80 hover:bg-muted/40 hover:shadow-klyb-sm"
                            >
                              <div className="size-16 shrink-0 overflow-hidden rounded-xl shadow-klyb-sm">
                                <img
                                  src={
                                    resolveImageUrl(event.image) ||
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
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="shrink-0 rounded-xl"
                                >
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

                <Card className="border-border/80 lg:col-span-4 shadow-klyb-sm">
                  <CardHeader className="border-b border-border/40 bg-gradient-to-r from-muted/30 to-transparent">
                    <CardTitle>Activité récente</CardTitle>
                    <CardDescription>Dernières inscriptions événements</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {activity.length === 0 ? (
                      <Empty className="border-2 border-dashed border-border/80 bg-muted/20 py-10">
                        <EmptyHeader>
                          <EmptyTitle>Aucune activité</EmptyTitle>
                          <EmptyDescription>
                            Les inscriptions récentes apparaîtront ici.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <div className="flex flex-col gap-6">
                        {activity.map((item, i) => (
                          <div key={item.id} className="relative flex gap-3">
                            {i < activity.length - 1 && (
                              <div className="absolute top-3 bottom-[-24px] left-[5px] w-px bg-border" />
                            )}
                            <div className="z-10 mt-1 size-2.5 shrink-0 rounded-full border-2 border-primary bg-background" />
                            <div className="flex flex-col gap-0.5">
                              <p className="text-sm font-medium">
                                {item.user?.name || "Utilisateur"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Inscrit à{" "}
                                <span className="font-medium text-primary">
                                  {item.event?.title}
                                </span>
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
                    {activity.length > 0 && (
                      <Link to="/analytics" className="mt-8 block">
                        <Button variant="outline" size="sm" className="w-full">
                          Voir les analytics
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </PageTabsContent>
      </PageTabs>
    </div>
  )
}

export default Dashboard
