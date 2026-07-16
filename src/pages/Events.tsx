import { useState, useEffect, useMemo } from "react"
import { useCommunity } from "@/context/CommunityContext"
import {
  Search,
  Plus,
  MapPin,
  MoreVertical,
  ExternalLink,
  Clock,
  Ticket,
  ChevronRight,
  Trash2,
  Pen,
  Copy,
  X,
} from "lucide-react"
import { Link } from "react-router-dom"
import { eventService } from "@/services/api"
import { usePermissions } from "@/hooks/usePermissions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { AtmosphericHeader } from "@/components/layout/AtmosphericHeader"
import { FilterBar } from "@/components/layout/FilterBar"
import { PageLoader } from "@/components/layout/PageLoader"
import { CommunityGate } from "@/components/layout/CommunityGate"
import { toast } from "sonner"
import type { Event } from "@/types/event"
import { resolveImageUrl } from "@/lib/imageUrl"

type StatusFilter = "all" | "upcoming" | "past" | "published" | "draft"

const Events = () => {
  const { selectedCommunityId } = useCommunity()
  const { permissions } = usePermissions()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const res = await eventService.getAll(selectedCommunityId)
      setEvents(res.data || [])
    } catch (err) {
      console.error("Failed to fetch events", err)
      toast.error("Erreur lors du chargement des événements")
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicateEvent = async (id: string) => {
    if (!confirm("Voulez-vous vraiment dupliquer cet événement ?")) return
    try {
      setLoading(true)
      await eventService.duplicate(id)
      await fetchEvents()
      toast.success("Événement dupliqué")
    } catch (err) {
      console.error("Failed to duplicate event", err)
      toast.error("Erreur lors de la duplication")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return
    try {
      await eventService.delete(id)
      setEvents((prev) => prev.filter((e) => e.id !== id))
      toast.success("Événement supprimé")
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [selectedCommunityId])

  const now = new Date()

  const statusCounts = useMemo(() => {
    const counts = { all: events.length, upcoming: 0, past: 0, published: 0, draft: 0 }
    for (const e of events) {
      const startDate = new Date(e.startDate)
      if (startDate >= now) counts.upcoming++
      else counts.past++
      if (e.visibility === "public") counts.published++
      else counts.draft++
    }
    return counts
  }, [events])

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.location || "").toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      const startDate = new Date(e.startDate)
      switch (statusFilter) {
        case "upcoming":
          return startDate >= now
        case "past":
          return startDate < now
        case "published":
          return e.visibility === "public"
        case "draft":
          return e.visibility !== "public"
        default:
          return true
      }
    })
  }, [events, searchTerm, statusFilter])

  const hasActiveFilter = statusFilter !== "all" || searchTerm !== ""

  const FILTER_OPTIONS = [
    { value: "all", label: "Tous", count: statusCounts.all },
    { value: "upcoming", label: "À venir", count: statusCounts.upcoming },
    { value: "past", label: "Passés", count: statusCounts.past },
    { value: "published", label: "Publiés", count: statusCounts.published },
    { value: "draft", label: "Privés", count: statusCounts.draft },
  ] as const

  return (
    <CommunityGate
      title="Sélectionnez une communauté"
      description="Choisissez une communauté pour gérer ses événements."
    >
      <div className="flex flex-col gap-8 pb-12">
        <AtmosphericHeader
          title="Mes Événements"
          description="Gérez vos prochains événements"
          actions={
            permissions.create_events ? (
              <Link to="/create">
                <Button size="sm">
                  <Plus data-icon="inline-start" />
                  Créer un événement
                </Button>
              </Link>
            ) : null
          }
        >
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un événement…"
              className="h-11 rounded-xl border-border/80 bg-card/90 pl-9 shadow-sm backdrop-blur-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </AtmosphericHeader>

        <FilterBar
          options={FILTER_OPTIONS.map((o) => ({ ...o }))}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
          trailing={
            hasActiveFilter ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearchTerm(""); setStatusFilter("all") }}
                className="text-muted-foreground"
              >
                <X size={14} data-icon="inline-start" />
                Réinitialiser
              </Button>
            ) : undefined
          }
        />

        {loading ? (
          <PageLoader label="Récupération des événements…" />
        ) : filteredEvents.length === 0 ? (
          <Empty className="border-2 border-dashed border-border/80 bg-muted/20 py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Ticket />
              </EmptyMedia>
              <EmptyTitle>Aucun résultat</EmptyTitle>
              <EmptyDescription>
                {searchTerm || statusFilter !== "all"
                  ? "Aucun événement ne correspond à vos filtres."
                  : "Vous n'avez pas encore créé d'événement."}
              </EmptyDescription>
            </EmptyHeader>
            {!searchTerm && statusFilter === "all" && permissions.create_events && (
              <EmptyContent>
                <Link to="/create">
                  <Button>Lancer mon premier projet</Button>
                </Link>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredEvents.map((event) => {
              const isPast = new Date(event.startDate) < now
              return (
                <Card
                  key={event.id}
                  className="group overflow-hidden rounded-2xl border-border/80 p-0 shadow-klyb-sm transition-shadow hover:shadow-klyb"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={
                        resolveImageUrl(event.image) ||
                        "https://images.unsplash.com/photo-1574169208507-84376144848b?w=400&auto=format&fit=crop&q=60"
                      }
                      alt={event.title}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {isPast && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <Badge variant="secondary" className="text-[10px] uppercase">Passé</Badge>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-lg bg-card/90 shadow-klyb-sm backdrop-blur-sm">
                          <MoreVertical size={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Link to={`/events/${event.id}`} className="flex w-full items-center gap-2">
                              <ExternalLink size={14} />
                              Voir
                            </Link>
                          </DropdownMenuItem>
                          {permissions.edit_events && (
                            <DropdownMenuItem>
                              <Link to={`/create/${event.id}`} className="flex w-full items-center gap-2">
                                <Pen size={14} />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {permissions.create_events && (
                            <DropdownMenuItem onClick={() => handleDuplicateEvent(event.id)}>
                              <Copy size={14} />
                              Dupliquer
                            </DropdownMenuItem>
                          )}
                          {permissions.delete_events && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                <Trash2 size={14} />
                                Supprimer
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardContent className="flex flex-1 flex-col gap-4 p-5">
                    <div className="flex flex-col gap-2">
                      <Badge variant="secondary" className="w-fit text-[10px] uppercase">
                        {event.visibility === "public" ? "Public" : "Privé"}
                      </Badge>
                      <h4 className="line-clamp-1 text-base font-semibold group-hover:text-primary">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="text-primary" size={14} />
                        {new Date(event.startDate).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        •{" "}
                        {new Date(event.startDate).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="shrink-0 text-primary" size={14} />
                      <span className="truncate">{event.location}</span>
                    </div>

                    <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
                      <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Inscrits
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {(event.recentAttendees || []).slice(0, 3).map((a, i) => (
                              <Avatar key={i} className="size-7 border-2 border-card">
                                <AvatarImage src={resolveImageUrl(a.avatar) || undefined} />
                                <AvatarFallback className="text-[10px]">
                                  {(a.name || "U").substring(0, 1).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {(!event.recentAttendees || event.recentAttendees.length === 0) &&
                              Array.from({ length: Math.min(3, event.attendeesCount || 0) }).map((_, i) => (
                                <Avatar key={i} className="size-7 border-2 border-card">
                                  <AvatarFallback className="text-[10px]">?</AvatarFallback>
                                </Avatar>
                              ))
                            }
                          </div>
                          <span className="text-sm font-semibold">{event.attendeesCount || 0}</span>
                        </div>
                      </div>
                      <Link to={`/events/${event.id}`}>
                        <Button variant="ghost" size="icon" className="text-primary">
                          <ChevronRight size={16} />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </CommunityGate>
  )
}

export default Events
