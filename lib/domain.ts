export type UserRole = "customer" | "salon_owner" | "staff" | "support" | "admin"

export type BookingStatus =
  | "hold"
  | "pending_payment"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "expired"

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded" | "partially_refunded"

export type ServiceAudience = "women" | "men" | "children" | "family"

export interface City {
  id: string
  name: string
  slug: string
  areas: string[]
}

export interface ServiceCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
}

export interface BeautyService {
  id: string
  salonId: string
  categoryId: string
  name: string
  description: string
  durationMinutes: number
  price: number
  discountPrice?: number
  depositAmount: number
  audience: ServiceAudience[]
  onlineBookable: boolean
  requiresConsultation?: boolean
  nonRefundable?: boolean
  staffIds: string[]
}

export interface StaffMember {
  id: string
  salonId: string
  fullName: string
  title: string
  specialties: string[]
  rating: number
  successfulBookings: number
  workDays: number[]
  image?: string
}

export interface Salon {
  id: string
  slug: string
  name: string
  city: string
  area: string
  address: string
  rating: number
  reviewCount: number
  successfulBookings: number
  verified: boolean
  isOpen: boolean
  closesAt: string
  minPrice: number
  tags: string[]
  amenities: string[]
  phone: string
  latitude?: number
  longitude?: number
  coverImage?: string
  description: string
}

export interface TimeSlot {
  id: string
  salonId: string
  staffId: string
  date: string
  startTime: string
  endTime: string
  available: boolean
}

export interface BookingLine {
  serviceId: string
  serviceName: string
  durationMinutes: number
  unitPrice: number
  depositAmount: number
}

export interface BookingQuote {
  lines: BookingLine[]
  subtotal: number
  discount: number
  total: number
  deposit: number
  durationMinutes: number
}

export interface BookingDraft {
  salonId: string
  serviceIds: string[]
  staffId?: string
  date: string
  startTime: string
  customerMobile: string
  customerName?: string
  customerNote?: string
  discountCode?: string
  acceptedTerms: boolean
}

export interface SlotHold {
  id: string
  salonId: string
  staffId: string
  date: string
  startTime: string
  endTime: string
  customerKey: string
  serviceIds: string[]
  expiresAt: string
}

export interface Booking {
  id: string
  trackingCode: string
  salonId: string
  staffId: string
  customerMobile: string
  customerName?: string
  date: string
  startTime: string
  endTime: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  quote: BookingQuote
  customerNote?: string
  createdAt: string
}

export interface ApiSuccess<T> {
  ok: true
  data: T
}

export interface ApiFailure {
  ok: false
  error: {
    code: string
    message: string
    fields?: Record<string, string>
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure
