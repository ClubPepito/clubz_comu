import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Search, MoreVertical, Calendar, UserPlus, Link2, Copy, Plus } from "lucide-react"
import { communityService } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { resolveImageUrl } from "@/lib/imageUrl"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageLoader } from "@/components/layout/PageLoader"
import { AtmosphericHeader } from "@/components/layout/AtmosphericHeader"
import { CommunityGate } from "@/components/layout/CommunityGate"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Users as UsersIcon } from "lucide-react"
import { StatCard } from "@/components/layout/StatCard"
import { toast } from "sonner"
import { useCommunity } from "@/context/CommunityContext"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

type InviteLink = {
  id: string
  code: string
  requiresApproval: boolean
  maxUses: number | null
  useCount: number
  expiresAt: string | null
  createdAt: string
}

const INVITE_BASE = "https://app.klyb.app/join?code="

const Members = () => {
  const { selectedCommunityId, selectedCommunity, pendingRequestsCount } = useCommunity()
  const [members, setMembers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [invites, setInvites] = useState<InviteLink[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [maxUses, setMaxUses] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCommunityId) return
      try {
        setLoading(true)
        const [membersRes, rolesRes, invitesRes] = await Promise.all([
          communityService.getMembers(selectedCommunityId),
          communityService.getRoles(selectedCommunityId),
          communityService.getInviteLinks(selectedCommunityId).catch(() => ({ data: [] })),
        ])
        setMembers(membersRes.data || [])
        setRoles(rolesRes.data || [])
        setInvites(invitesRes.data || [])
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

  const handleCreateInvite = async () => {
    if (!selectedCommunityId) return
    try {
      setCreatingInvite(true)
      const parsedMax = maxUses.trim() ? parseInt(maxUses, 10) : undefined
      const res = await communityService.createInviteLink(selectedCommunityId, {
        requiresApproval,
        maxUses: parsedMax && !Number.isNaN(parsedMax) ? parsedMax : undefined,
      })
      setInvites((prev) => [res.data, ...prev])
      setInviteOpen(false)
      setRequiresApproval(false)
      setMaxUses("")
      toast.success("Lien d'invitation créé")
    } catch {
      toast.error("Impossible de créer le lien (permission manage_members requise)")
    } finally {
      setCreatingInvite(false)
    }
  }

  const copyInvite = async (code: string) => {
    const url = `${INVITE_BASE}${code}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Lien copié")
    } catch {
      toast.error("Copie impossible")
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
    <div className="flex flex-col gap-8 pb-12">
      <AtmosphericHeader
        title="Membres"
        description={
          selectedCommunity
            ? `${members.length} membre${members.length > 1 ? "s" : ""} dans ${selectedCommunity.name}`
            : "Gérez les rôles et les accès"
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
              <Link2 data-icon="inline-start" />
              Lien d'invitation
            </Button>
            {pendingRequestsCount > 0 ? (
              <Link to="/membership">
                <Button variant="outline" size="sm">
                  <UserPlus data-icon="inline-start" />
                  {pendingRequestsCount} adhésion{pendingRequestsCount > 1 ? "s" : ""} en attente
                </Button>
              </Link>
            ) : null}
          </div>
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

      {invites.length > 0 && (
        <Card className="border-border/80 shadow-klyb-sm">
          <CardHeader className="border-b border-border/40 bg-gradient-to-r from-muted/30 to-transparent">
            <CardTitle>Liens d'invitation</CardTitle>
            <CardDescription>Partagez un code pour rejoindre la communauté</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-4">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 px-4 py-3"
              >
                <div className="min-w-0 flex flex-col gap-1">
                  <p className="truncate font-mono text-sm font-medium">{invite.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {invite.useCount}
                    {invite.maxUses != null ? ` / ${invite.maxUses}` : ""} utilisations
                    {invite.requiresApproval ? " · validation requise" : ""}
                    {invite.expiresAt
                      ? ` · expire le ${new Date(invite.expiresAt).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => copyInvite(invite.code)}>
                  <Copy data-icon="inline-start" />
                  Copier
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/80 shadow-klyb-sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-border/40 bg-gradient-to-r from-muted/30 to-transparent">
          <div>
            <CardTitle>Membres</CardTitle>
            <CardDescription>Visualisation des accès</CardDescription>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher…"
              className="h-11 w-48 rounded-xl border-border/80 pl-9 sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <PageLoader className="min-h-[200px]" />
          ) : filteredMembers.length === 0 ? (
            <Empty className="border-2 border-dashed border-border/80 bg-muted/20 py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon />
                </EmptyMedia>
                <EmptyTitle>
                  {searchTerm ? "Aucun résultat" : "Aucun membre"}
                </EmptyTitle>
                <EmptyDescription>
                  {searchTerm
                    ? "Aucun membre ne correspond à votre recherche."
                    : "Les membres de votre communauté apparaîtront ici."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
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
                          <AvatarImage src={resolveImageUrl(m.user?.avatar) || undefined} />
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

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un lien d'invitation</DialogTitle>
            <DialogDescription>
              Les membres rejoignent via app.klyb.app avec ce code.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="requires-approval">Validation manuelle</Label>
              <Switch
                id="requires-approval"
                checked={requiresApproval}
                onCheckedChange={setRequiresApproval}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="max-uses">Utilisations max (optionnel)</Label>
              <Input
                id="max-uses"
                type="number"
                min={1}
                placeholder="Illimité"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateInvite} disabled={creatingInvite}>
              <Plus data-icon="inline-start" />
              {creatingInvite ? "Création…" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </CommunityGate>
  )
}

export default Members
