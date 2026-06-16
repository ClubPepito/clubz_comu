import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  ShieldAlert,
  Users,
  UserPlus,
  Settings,
  Store,
  Code2,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  to: string
  icon: LucideIcon
  label: string
  match?: (path: string) => boolean
  badgeKey?: "pendingRequests"
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Activité",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Vue d'ensemble", match: (p) => p === "/" },
      {
        to: "/events",
        icon: Calendar,
        label: "Événements",
        match: (p) => p.startsWith("/events") || p.startsWith("/create"),
      },
      { to: "/analytics", icon: BarChart3, label: "Statistiques", match: (p) => p === "/analytics" },
      { to: "/moderation", icon: ShieldAlert, label: "Modération", match: (p) => p === "/moderation" },
    ],
  },
  {
    title: "Communauté",
    items: [
      { to: "/members", icon: Users, label: "Membres", match: (p) => p === "/members" },
      {
        to: "/membership",
        icon: UserPlus,
        label: "Adhésions",
        match: (p) => p === "/membership",
        badgeKey: "pendingRequests",
      },
      { to: "/settings", icon: Settings, label: "Paramètres", match: (p) => p === "/settings" },
    ],
  },
  {
    title: "Extensions",
    items: [
      { to: "/marketplace", icon: Store, label: "Marketplace", match: (p) => p === "/marketplace" },
      { to: "/developer", icon: Code2, label: "Développeur", match: (p) => p === "/developer" },
    ],
  },
]
