export type EventStatus = 'upcoming' | 'ongoing' | 'past' | 'cancelled'
export type PartnerTier = 'platinum' | 'gold' | 'silver' | 'partner'
export type ContactType = 'text' | 'email' | 'phone' | 'address' | 'social' | 'map_link'
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'waitlisted'
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled'

export interface Event {
  id: string
  title: string
  description?: string
  location?: string
  event_date: string
  event_time?: string
  registration_deadline?: string  // ← added
  image_url?: string
  is_featured: boolean
  status: EventStatus
  created_at: string
  updated_at: string
}

export interface EventRegistration {
  id: string
  event_id: string
  event_title: string
  event_date: string
  full_name: string
  email: string
  phone?: string
  message?: string
  status: RegistrationStatus
  registered_at: string
}

export interface Partner {
  id: string
  name: string
  logo_url?: string
  website_url?: string
  tier: PartnerTier
  description?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}
export interface GalleryItem {
  id: string
  title: string
  description?: string
  image_url: string
  album: string
  event_id?: string
  is_featured: boolean
  sort_order: number
  created_at: string
}
export interface CommitteeMember {
  id: string
  full_name: string
  position: string
  bio?: string
  photo_url?: string
  email?: string
  phone?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}
export interface SiteInfo {
  id: string
  section: string
  key: string
  value?: string
  updated_at: string
}
export interface ContactDetail {
  id: string
  label: string
  value: string
  type: ContactType
  icon?: string
  is_active: boolean
  sort_order: number
  updated_at: string
}
export interface MembershipTier {
  id: string
  name: string
  price_tzs?: number
  price_usd?: number
  period: string
  description?: string
  benefits?: string[]
  is_active: boolean
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}
export interface MembershipApplication {
  id: string
  full_name: string
  email: string
  phone?: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: string
  tier_id?: string
  membership_tiers?: MembershipTier
  message?: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
}
export type CmsSection =
  | 'events'
  | 'partners'
  | 'gallery'
  | 'committee'
  | 'about'
  | 'contact'
  | 'membership'