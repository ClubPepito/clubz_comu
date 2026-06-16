import { useState, useEffect } from "react"
import { useCommunity } from "@/context/CommunityContext"
import {
  Search,
  Filter,
  Plus,
  Calendar,
  MapPin,
  MoreVertical,
  ExternalLink,
  Clock,
  Ticket,
  ChevronRight,
  Trash2,
  Pen,
  Copy,
} from "lucide-react"
import { Link } from "react-router-dom"
import { eventService } from "@/services/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { PageHeader } from "@/components/layout/PageHeader"
import { PageLoader } from "@/components/layout/PageLoader"
import { toast } from "sonner"

const Events = () => {
  const { selectedCommunityId } = useCommunity()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

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
      setEvents(events.filter((e) => e.id !== id))
      toast.success("Événement supprimé")
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [selectedCommunityId])

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-8 pb-10">
      <PageHeader
        title="Mes Événements"
        description="Gérez vos prochains événements"
        actions={
          <Link to="/create">
            <Button size="sm">
              <Plus data-icon="inline-start" />
              Créer un événement
            </Button>
          </Link>
        }
      />

      <div className="flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher…"
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter data-icon="inline-start" />
            Filtrer
          </Button>
          <Button variant="outline" size="sm">
            <Calendar data-icon="inline-start" />
            Date
          </Button>
        </div>
      </div>

      {loading ? (
        <PageLoader label="Récupération des événements…" />
      ) : filteredEvents.length === 0 ? (
        <Empty className="border-border bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Ticket />
            </EmptyMedia>
            <EmptyTitle>Aucun résultat</EmptyTitle>
            <EmptyDescription>
              {searchTerm
                ? "Aucun événement ne correspond à votre recherche."
                : "Vous n'avez pas encore créé d'événement."}
            </EmptyDescription>
          </EmptyHeader>
          {!searchTerm && (
            <EmptyContent>
              <Link to="/create">
                <Button>Lancer mon premier projet</Button>
              </Link>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEvents.map((event) => (
            <Card
              key={event.id}
              className="group overflow-hidden p-0 shadow-klyb-sm transition-shadow hover:shadow-klyb"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={
                    event.image ||
                    "https://images.unsplash.com/photo-1574169208507-84376144848b?w=400&auto=format&fit=crop&q=60"
                  }
                  alt={event.title}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-lg bg-card/90 shadow-klyb-sm backdrop-blur-sm">
                      <MoreVertical />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Link to={`/events/${event.id}`} className="flex w-full items-center gap-2">
                          <ExternalLink />
                          Voir
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link to={`/create/${event.id}`} className="flex w-full items-center gap-2">
                          <Pen />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateEvent(event.id)}>
                        <Copy />
                        Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 />
                        Supprimer
                      </DropdownMenuItem>
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
                    <Clock className="text-primary" />
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
                  <MapPin className="shrink-0 text-primary" />
                  <span className="truncate">{event.location}</span>
                </div>

                <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Inscrits
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <Avatar key={i} className="size-7 border-2 border-card">
                            <AvatarImage src={`https://i.pravatar.cc/100?u=${event.id}-${i}`} />
                            <AvatarFallback className="text-[10px]">U</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-sm font-semibold">+{event.attendeesCount || 0}</span>
                    </div>
                  </div>
                  <Link to={`/events/${event.id}`}>
                    <Button variant="ghost" size="icon" className="text-primary">
                      <ChevronRight />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Events
