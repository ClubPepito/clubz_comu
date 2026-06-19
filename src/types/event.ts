export interface EventAttendee {
  id: string
  name: string
  email?: string
  avatar?: string | null
}

export interface TicketType {
  id?: string
  name: string
  price: number
  totalQuantity: number
  order: number
  isHidden: boolean
  points: number
  description?: string
  salesStartDate?: string
  salesEndDate?: string
}

export interface CustomField {
  id?: string
  label: string
  type: 'text' | 'number' | 'select' | 'checkbox'
  required?: boolean
  options?: string[]
}

export interface PromoCode {
  id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  maxUses?: number
  usedCount?: number
  expiresAt?: string
  active: boolean
}

export interface Event {
  id: string
  title: string
  description?: string
  location: string
  startDate: string
  endDate?: string
  visibility: 'public' | 'private'
  communityId?: string
  image?: string
  isRecurring?: boolean
  recurrenceRule?: string
  isOnline?: boolean
  meetingLink?: string
  shortLink?: string
  tags?: string[]
  coHostIds?: string[]
  latitude?: number | null
  longitude?: number | null
  ticketTypes?: TicketType[]
  customFields?: CustomField[]
  capacity?: number
  maxAttendees?: number
  attendeesCount?: number
  recentAttendees?: EventAttendee[]
  status?: 'draft' | 'published' | 'cancelled'
  createdAt?: string
  updatedAt?: string
}

export interface EventAnalytics {
  summary?: {
    revenue: number
    totalRegistered: number
    totalCheckedIn: number
    noShowCount: number
    noShowRate: string
  }
  statsByTicketType?: Array<{
    name: string
    sold: number
    total: number
    revenue: number
  }>
  totalRevenue?: number
  checkInCount?: number
  waitlistCount?: number
  interestedCount?: number
  ticketsSold?: number
  totalCapacity?: number
  checkInRate?: string
  fillRate?: string
  conversionRate?: string
  attendeesCount?: number
  revenueChange?: number
  salesHistory?: Array<{ name: string; sales: number; revenue?: number }>
  funnel?: {
    interested: number
    going: number
    checkedIn: number
    waitlisted: number
    cancelled: number
  }
}

export interface EventFormData {
  title: string
  description: string
  location: string
  startDate: string
  endDate: string
  visibility: 'public' | 'private'
  communityId: string
  image: string
  isRecurring: boolean
  recurrenceRule: string
  isOnline: boolean
  meetingLink: string
  shortLink: string
  tags: string[]
  coHostIds: string[]
  latitude: number | null
  longitude: number | null
  ticketTypes: TicketType[]
  customFields: CustomField[]
}
