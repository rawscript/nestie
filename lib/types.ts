// Centralized type definitions for Nestie platform

// Base types
export type UUID = string
export type Timestamp = string
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray
export interface JSONObject { [key: string]: JSONValue }
export interface JSONArray extends Array<JSONValue> {}

// User and Authentication types
export interface User {
  id: UUID
  email: string
  created_at: Timestamp
  updated_at: Timestamp
  user_metadata?: {
    full_name?: string
    phone?: string
    role?: UserRole
  }
}

export type UserRole = 'tenant' | 'agent'

export interface Profile {
  id: UUID
  email: string
  full_name: string
  phone?: string
  role: UserRole
  avatar_url?: string
  location?: string
  bio?: string
  verified: boolean
  created_at: Timestamp
  updated_at: Timestamp
  stats?: UserStats
  notification_settings?: NotificationSettings
}

export interface UserStats {
  properties_listed?: number
  properties_rented?: number
  total_earnings?: number
  rating?: number
  reviews_count?: number
}

export interface NotificationSettings {
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
}

// Property types
export type PropertyType = 'apartment' | 'house' | 'commercial' | 'land'
export type ListingType = 'rent' | 'sale' | 'lease'
export type PropertyStatus = 'available' | 'occupied' | 'sold' | 'pending'

export interface PropertyLocation {
  address: string
  city?: string
  region?: string
  estate?: string
  lat?: number
  lng?: number
}

export interface PropertySpecifications {
  bedrooms?: number
  bathrooms?: number
  area?: number
  parking?: boolean
  furnished?: boolean
  floor?: number
  total_floors?: number
}

export interface PropertyAmenities {
  wifi?: boolean
  pool?: boolean
  gym?: boolean
  security?: boolean
  parking?: boolean
  furnished?: boolean
  balcony?: boolean
  garden?: boolean
  nearCBD?: boolean
  spacious?: boolean
  elevator?: boolean
  generator?: boolean
  water_backup?: boolean
}

export interface PropertyTerms {
  deposit?: number
  leasePeriod?: number
  paymentMethod?: string
  utilities?: string
  pets_allowed?: boolean
  smoking_allowed?: boolean
}

export interface ContactInfo {
  phone?: string
  email?: string
  whatsapp?: string
}

export interface Property {
  id: UUID
  title: string
  description: string
  price: number
  type: PropertyType
  listingType: ListingType
  status: PropertyStatus
  location: PropertyLocation
  specifications: PropertySpecifications
  amenities: PropertyAmenities
  terms: PropertyTerms
  images: string[]
  virtual_tour_url?: string
  contactInfo: ContactInfo
  agent_id: UUID
  agent?: Profile
  created_by_agent: boolean
  search_vector?: string
  geolocation?: any // PostGIS geography type
  created_at: Timestamp
  updated_at: Timestamp
}

// Transaction types
export type TransactionType = 'rent_payment' | 'deposit_payment' | 'rent_termination' | 'lease_renewal' | 'maintenance_request' | 'booking_payment'
export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'completed'
export type PaymentMethod = 'tinympesa' | 'stripe' | 'bank_transfer'

export interface Transaction {
  id: UUID
  user_id: UUID
  tenancy_id?: UUID
  transaction_type: TransactionType
  amount?: number
  status: TransactionStatus
  description: string
  payment_method?: PaymentMethod
  payment_reference?: string
  authorized_by?: UUID
  authorized_at?: Timestamp
  created_at: Timestamp
  updated_at: Timestamp
}

// Tenancy types
export type TenancyStatus = 'active' | 'terminated' | 'pending_termination' | 'pending_approval'

export interface PropertyTenancy {
  id: UUID
  property_id: UUID
  tenant_id: UUID
  agent_id: UUID
  monthly_rent: number
  deposit: number
  start_date: string // Date string
  end_date?: string // Date string
  status: TenancyStatus
  created_at: Timestamp
  updated_at: Timestamp
  property?: Property
  tenant?: Profile
  agent?: Profile
}

// Notification types
export type NotificationType = 'booking_request' | 'payment_reminder' | 'system_update' | 'chat_message' | 'tour_request'

export interface Notification {
  id: UUID
  recipient_id: UUID
  title: string
  message: string
  type: NotificationType
  data: JSONObject
  read: boolean
  created_at: Timestamp
}

// Booking and Calendar types
export type BookingType = 'viewing' | 'lease' | 'purchase'
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled'

export interface CalendarBooking {
  id: UUID
  property_id: UUID
  tenant_id: UUID
  agent_id: UUID
  booking_type: BookingType
  scheduled_date: string // Date string
  scheduled_time: string // Time string
  amount_paid: number
  payment_method?: PaymentMethod
  payment_reference?: string
  status: BookingStatus
  notes?: string
  created_at: Timestamp
  updated_at: Timestamp
  property?: Property
  tenant?: Profile
  agent?: Profile
}

export interface CalendarEvent {
  id: UUID
  booking_id?: UUID
  user_id: UUID
  user_type: UserRole
  title: string
  description?: string
  start_date: string // Date string
  start_time: string // Time string
  end_time: string // Time string
  location?: string
  property_id?: UUID
  status: BookingStatus
  created_at: Timestamp
  updated_at: Timestamp
}

// Message types
export type MessageType = 'text' | 'image' | 'file'

export interface Message {
  id: UUID
  sender_id: UUID
  receiver_id: UUID
  property_id?: UUID
  content: string
  message_type: MessageType
  read: boolean
  created_at: Timestamp
  sender?: Profile
  receiver?: Profile
  property?: Property
}

// Search and Filter types
export interface SearchFilters {
  query?: string
  location?: string
  priceMin?: number
  priceMax?: number
  type?: PropertyType | 'all'
  listingType?: ListingType | 'all'
  bedrooms?: number | 'any'
  bathrooms?: number | 'any'
  amenities?: Partial<PropertyAmenities>
  region?: string
  estate?: string
}

export interface SearchResult<T> {
  data: T[]
  count: number
  hasMore?: boolean
  nextCursor?: string
}

// Payment types
export interface PaymentData {
  amount: number
  currency?: string
  method: PaymentMethod
  reference?: string
  description?: string
  userId?: UUID
  propertyId?: UUID
}

export interface StripePaymentData extends PaymentData {
  card: {
    number: string
    expiry: string
    cvv: string
    name: string
  }
}

export interface MpesaPaymentData extends PaymentData {
  phone: string
}

export interface PaymentResult {
  success: boolean
  reference: string
  status: string
  message?: string
  error?: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface DatabaseResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  PAYMENT = 'PAYMENT',
  UNKNOWN = 'UNKNOWN'
}

export interface ErrorLog {
  id: string
  type: ErrorType
  message: string
  stack?: string
  context?: string
  userId?: UUID
  timestamp: Timestamp
  metadata?: JSONObject
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface SignupForm {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  phone: string
  role: UserRole
}

export interface PropertyForm {
  title: string
  description: string
  price: number
  type: PropertyType
  listingType: ListingType
  location: PropertyLocation
  specifications: PropertySpecifications
  amenities: PropertyAmenities
  terms: PropertyTerms
  images: string[]
  contactInfo: ContactInfo
}

// Component Props types
export interface LoadingState {
  loading: boolean
  error?: string
}

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

// Hook return types
export interface UseAuthReturn {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: any) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

export interface UsePropertiesReturn {
  properties: Property[]
  loading: boolean
  error: string | null
  searchProperties: (filters: SearchFilters) => Promise<void>
  loadMore: () => Promise<void>
  hasMore: boolean
}

// Environment types
export interface EnvConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  stripePublicKey?: string
  yandexMapsKey?: string
  appUrl: string
  nodeEnv: 'development' | 'production' | 'test'
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Export commonly used type combinations
export type PropertyWithAgent = Property & { agent: Profile }
export type TenancyWithDetails = PropertyTenancy & { property: Property; tenant: Profile; agent: Profile }
export type BookingWithDetails = CalendarBooking & { property: Property; tenant: Profile; agent: Profile }
export type MessageWithDetails = Message & { sender: Profile; receiver: Profile; property?: Property }

// Constants
export const USER_ROLES = ['tenant', 'agent'] as const
export const PROPERTY_TYPES = ['apartment', 'house', 'commercial', 'land'] as const
export const LISTING_TYPES = ['rent', 'sale', 'lease'] as const
export const PROPERTY_STATUSES = ['available', 'occupied', 'sold', 'pending'] as const
export const TRANSACTION_TYPES = ['rent_payment', 'deposit_payment', 'rent_termination', 'lease_renewal', 'maintenance_request', 'booking_payment'] as const
export const TRANSACTION_STATUSES = ['pending', 'approved', 'rejected', 'completed'] as const
export const PAYMENT_METHODS = ['tinympesa', 'stripe', 'bank_transfer'] as const