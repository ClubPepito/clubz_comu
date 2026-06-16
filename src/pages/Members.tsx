import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Search, Filter, MoreVertical, Calendar, UserPlus } from "lucide-react"
import { communityService } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCard } from "@/components/layout/StatCard"
import { PageLoader } from "@/components/layout/PageLoader"
import { CommunityGate } from "@/components/layout/CommunityGate"
import { Users as UsersIcon } from "lucide-react"
import { toast } from "sonner"
import { useCommunity } from "@/context/CommunityContext"

const Members = () => {
  const { selectedCommunityId, selectedCommunity, pendingRequestsCount } = useCommunity()
  const [members, setMembers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCommunityId) return
      try {
        setLoading(true)
        const [membersRes, rolesRes] = await Promise.all([
          communityService.getMembers(selectedCommunityId),
          communityService.getRoles(selectedCommunityId),
        ])
        setMembers(membersRes.data || [])
        setRoles(rolesRes.data || [])
      } catch (err) {
        console.error("Failed to fetch members or roles", err)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedCommunityId])

  const handleKickMember = async (userId: string) => {
    if (!confirm("Voulez-vous vraiment exclure ce membre ?")) return
    try {
      if (!selectedCommunityId) return
      await communityService.kickMember(selectedCommunityId, userId)
      setMembers(members.filter((m) => m.userId !== userId))
      toast.success("Membre exclu")
    } catch {
      toast.error("Erreur lors de l'exclusion")
    }
  }

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      if (!selectedCommunityId) return
      await communityService.updateMemberRole(selectedCommunityId, userId, roleId)
      const matchingRole = roles.find((r) => r.id === roleId)
      setMembers(
        members.map((m) => (m.userId === userId ? { ...m, role: matchingRole } : m))
      )
      toast.success("Rôle mis à jour")
    } catch {
      toast.error("Erreur lors du changement de rôle")
    }
  }

  const filteredMembers = members.filter(
    (m) =>
      m.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.community?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const newMembersCount = members.filter(
    (m) => new Date(m.joinedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length

  return (
    <CommunityGate
      title="Membres"
      description="Sélectionnez une communauté pour voir et gérer ses membres."
    >
    <div className="flex flex-col gap-8 pb-10">
      <PageHeader
        title="Membres"
        description={
          selectedCommunity
            ? `${members.length} membre${members.length > 1 ? "s" : ""} dans ${selectedCommunity.name}`
            : "Gérez les rôles et les accès"
        }
        actions={
          pendingRequestsCount > 0 ? (
            <Link to="/membership">
              <Button variant="outline" size="sm">
                <UserPlus data-icon="inline-start" />
                {pendingRequestsCount} adhésion{pendingRequestsCount > 1 ? "s" : ""} en attente
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title="Total membres" value={String(members.length)} icon={UsersIcon} loading={loading} />
        <StatCard
          title="Nouveaux (7 jours)"
          value={`+${newMembersCount}`}
          icon={UsersIcon}
          loading={loading}
        />
      </div>

      <Card className="shadow-klyb-sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Membres</CardTitle>
            <CardDescription>Visualisation des accès</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher…"
                className="w-48 pl-9 sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter data-icon="inline-start" />
              Filtre
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <PageLoader className="min-h-[200px]" />
          ) : filteredMembers.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Aucun membre.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6">Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="px-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((m) => (
                  <TableRow key={m.id} className="group">
                    <TableCell className="px-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 rounded-lg">
                          <AvatarImage src={m.user?.profileImage} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {m.user?.name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium group-hover:text-primary">
                            {m.user?.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{m.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{m.role?.name || "Membre"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="text-primary" />
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-lg hover:bg-muted">
                          <MoreVertical />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {roles
                            .filter((r) => r.name !== "Créateur")
                            .map((role) => (
                              <DropdownMenuItem
                                key={role.id}
                                onClick={() => handleRoleChange(m.userId, role.id)}
                              >
                                {role.name}
                              </DropdownMenuItem>
                            ))}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleKickMember(m.userId)}
                          >
                            Exclure
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
    </CommunityGate>
  )
}

export default Members
