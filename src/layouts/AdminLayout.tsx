import { Link, useLocation, Navigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { APP_NAME } from "@/constants/app"
import { NAV_GROUPS, type NavItem } from "@/constants/navigation"
import { useAuth } from "@/context/AuthContext"
import { useCommunity } from "@/context/CommunityContext"
import { cn } from "@/lib/utils"

function SidebarLink({
  item,
  active,
  badge,
}: {
  item: NavItem
  active: boolean
  badge?: number
}) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-klyb-sm"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon data-icon="inline-start" />
      <span className="flex-1">{item.label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge
          variant={active ? "secondary" : "default"}
          className="size-5 justify-center p-0 text-[10px]"
        >
          {badge}
        </Badge>
      )}
    </Link>
  )
}

function NavGroup({
  title,
  items,
  pathname,
  pendingRequestsCount,
  pendingAffiliationRequestsCount,
}: {
  title: string
  items: NavItem[]
  pathname: string
  pendingRequestsCount: number
  pendingAffiliationRequestsCount: number
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      {items.map((item) => (
        <SidebarLink
          key={item.to}
          item={item}
          active={item.match ? item.match(pathname) : pathname === item.to}
          badge={
            item.badgeKey === "pendingRequests"
              ? pendingRequestsCount
              : item.badgeKey === "pendingAffiliations"
                ? pendingAffiliationRequestsCount
                : undefined
          }
        />
      ))}
    </div>
  )
}

function getInitials(value?: string | null) {
  const text = value?.trim()
  if (!text) return "U"

  const parts = text.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()

  const first = parts[0]?.[0] ?? ""
  const second = parts[1]?.[0] ?? ""
  return (first + second).toUpperCase() || "U"
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-10 text-primary" />
      </div>
    )
  }

  if (!token) return <Navigate to="/login" replace />

  return <>{children}</>
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const {
    communities,
    selectedCommunityId,
    setSelectedCommunityId,
    loading,
    pendingRequestsCount,
    pendingAffiliationRequestsCount,
  } = useCommunity()

  const avatarUrl = user?.avatar?.trim() ? user.avatar : null
  const userInitials = getInitials(user?.name || user?.username || user?.email)
  const displayName = user?.name || user?.username || user?.email || "Utilisateur"

  if (location.pathname === "/login" || location.pathname === "/cli-auth") {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
          <img src="/logo.png" alt="Logo" className="size-9 rounded-xl shadow-klyb-sm" />
          <div className="flex flex-col">
            <span className="text-base font-bold leading-none tracking-tight">{APP_NAME}</span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Admin
            </span>
          </div>
        </div>

        <div className="px-4 py-4">
          <label className="mb-2 block px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Communauté active
          </label>
          <Select
            value={selectedCommunityId || "all"}
            onValueChange={(val) => setSelectedCommunityId(val === "all" ? null : val)}
          >
            <SelectTrigger size="sm">
              {loading && <Spinner className="text-primary" />}
              <span className="truncate">
                {selectedCommunityId
                  ? communities.find((c) => c.id === selectedCommunityId)?.name || "Chargement…"
                  : "Toutes les communautés"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les communautés</SelectItem>
              {communities.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!selectedCommunityId && (
            <p className="mt-2 px-1 text-[11px] leading-snug text-muted-foreground">
              Sélectionnez une communauté pour gérer membres, adhésions, affiliations et paramètres.
            </p>
          )}
        </div>

        <ScrollArea className="flex-1 px-4">
          <nav className="flex flex-col gap-6 pb-4">
            {NAV_GROUPS.map((group) => (
              <NavGroup
                key={group.title}
                title={group.title}
                items={group.items}
                pathname={location.pathname}
                pendingRequestsCount={pendingRequestsCount}
                pendingAffiliationRequestsCount={pendingAffiliationRequestsCount}
              />
            ))}
          </nav>
        </ScrollArea>

        <div className="border-t border-sidebar-border p-4">
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start gap-3 text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
          >
            <LogOut data-icon="inline-start" />
            Déconnexion
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-end border-b border-border bg-card/80 px-8 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Organisateur
              </p>
            </div>
              <Avatar className="size-10 border-2 border-primary/15">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={`${user?.name ?? "Utilisateur"} avatar`} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
          </div>
        </header>

        <main className="flex-1 bg-muted/30 p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
