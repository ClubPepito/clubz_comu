export interface AdvancedStatsOverview {
  totalRevenue: number
  periodRevenue: number
  revenueChange: string
  totalAttendees: number
  periodAttendees: number
  attendeesChange: string
  ticketsSold: number
  periodTicketsSold: number
  ticketsSoldChange: string
  totalEvents: number
  activeEvents: number
  engagementRate: string
  checkInRate: string
  noShowRate: string
  avgTicketPrice: number
  conversionRate: string
  waitlistCount: number
  interestedCount: number
}

export interface HistoryPoint {
  name: string
  value: number
  registrations?: number
}

export interface FunnelData {
  interested: number
  going: number
  checkedIn: number
  waitlisted: number
  cancelled: number
}

export interface StatusBreakdown {
  draft: number
  published: number
  cancelled: number
  finished: number
}

export interface TicketTypePerformance {
  name: string
  sold: number
  total: number
  revenue: number
  eventsCount: number
}

export interface TopEventStats {
  id: string
  title: string
  image?: string
  location: string
  startDate: string
  status: string
  revenue: number
  attendeesCount: number
  checkedInCount: number
  checkInRate: string
  fillRate: string
  noShowRate: string
}

export interface PromoStats {
  totalCodes: number
  activeCodes: number
  totalUses: number
}

export interface CheckInVelocityPoint {
  hour: string
  count: number
}

export interface AdvancedStats {
  period: { days: number; from: string; to: string }
  overview: AdvancedStatsOverview
  salesHistory: HistoryPoint[]
  registrationHistory: HistoryPoint[]
  funnel: FunnelData
  statusBreakdown: StatusBreakdown
  ticketTypePerformance: TicketTypePerformance[]
  topEvents: TopEventStats[]
  promoStats: PromoStats
  checkInVelocity: CheckInVelocityPoint[]
  recentActivity: Array<{
    id: string
    createdAt: string
    status: string
    user?: { name?: string; avatar?: string }
    event?: { id: string; title: string }
  }>
}
