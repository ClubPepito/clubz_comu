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
  attendeesCount?: number
  recentAttendees?: EventAttendee[]
  status?: 'draft' | 'published' | 'cancelled'
  createdAt?: string
  updatedAt?: string
}

export interface EventAnalytics {
  totalRevenue?: number
  checkInCount?: number
  waitlistCount?: number
  attendeesCount?: number
  revenueChange?: number
  salesHistory?: Array<{ name: string; sales: number }>
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
