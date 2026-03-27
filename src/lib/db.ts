/**
 * db.ts — Firestore data-access layer
 *
 * Replaces every `supabase.from(table).*` call in the admin pages.
 * Each helper maps 1-to-1 to the Supabase query pattern used in the UI
 * so the admin pages need only swap the import and call.
 *
 * Collections mirror the Supabase table names:
 *   events, partners, gallery, committee_members,
 *   site_info, contact_details, membership_tiers, membership_applications
 *
 * Firestore note: there is no native UUID generation on the client.
 * We use Firestore auto-IDs (addDoc) and expose them as `id`.
 *
 * `site_info` was a (section, key) relational table in Supabase.
 * In Firestore we store each entry as a document with id = "section__key"
 * for cheap point-reads.
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  Timestamp,
  serverTimestamp,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  Event,
  Partner,
  GalleryItem,
  CommitteeMember,
  SiteInfo,
  ContactDetail,
  MembershipTier,
  MembershipApplication,
  ApplicationStatus,
} from './types'

// ─── Utility ────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString()
}

/** Convert a Firestore document snapshot to a typed object with `id`. */
function snap<T>(s: { id: string; data(): Record<string, unknown> }): T {
  const d = s.data()
  // Convert any Firestore Timestamps to ISO strings
  for (const k of Object.keys(d)) {
    if (d[k] instanceof Timestamp) {
      d[k] = (d[k] as Timestamp).toDate().toISOString()
    }
  }
  return { id: s.id, ...d } as T
}

async function getAll<T>(
  col: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db, col), ...constraints)
  const snap2 = await getDocs(q)
  return snap2.docs.map((d) => snap<T>(d))
}

// ─── EVENTS ─────────────────────────────────────────────────────────────────

export const eventsCol = () => collection(db, 'events')

export async function getEvents(): Promise<Event[]> {
  return getAll<Event>('events', orderBy('event_date', 'desc'))
}

export async function getEvent(id: string): Promise<Event | null> {
  const d = await getDoc(doc(db, 'events', id))
  return d.exists() ? snap<Event>(d) : null
}

export async function createEvent(
  data: Omit<Event, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  const ref = await addDoc(eventsCol(), {
    ...data,
    created_at: now(),
    updated_at: now(),
  })
  return ref.id
}

export async function updateEvent(
  id: string,
  data: Partial<Omit<Event, 'id' | 'created_at'>>
): Promise<void> {
  await updateDoc(doc(db, 'events', id), { ...data, updated_at: now() })
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, 'events', id))
}

// ─── PARTNERS ────────────────────────────────────────────────────────────────

export async function getPartners(): Promise<Partner[]> {
  return getAll<Partner>('partners', orderBy('sort_order'), orderBy('name'))
}

export async function getPartner(id: string): Promise<Partner | null> {
  const d = await getDoc(doc(db, 'partners', id))
  return d.exists() ? snap<Partner>(d) : null
}

export async function createPartner(
  data: Omit<Partner, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'partners'), {
    ...data,
    created_at: now(),
    updated_at: now(),
  })
  return ref.id
}

export async function updatePartner(
  id: string,
  data: Partial<Omit<Partner, 'id' | 'created_at'>>
): Promise<void> {
  await updateDoc(doc(db, 'partners', id), { ...data, updated_at: now() })
}

export async function deletePartner(id: string): Promise<void> {
  await deleteDoc(doc(db, 'partners', id))
}

// ─── GALLERY ─────────────────────────────────────────────────────────────────

export async function getGallery(): Promise<GalleryItem[]> {
  return getAll<GalleryItem>('gallery', orderBy('created_at', 'desc'))
}

export async function createGalleryItem(
  data: Omit<GalleryItem, 'id' | 'created_at'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'gallery'), {
    ...data,
    created_at: now(),
  })
  return ref.id
}

export async function updateGalleryItem(
  id: string,
  data: Partial<Omit<GalleryItem, 'id' | 'created_at'>>
): Promise<void> {
  await updateDoc(doc(db, 'gallery', id), data)
}

export async function deleteGalleryItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'gallery', id))
}

// ─── COMMITTEE MEMBERS ───────────────────────────────────────────────────────

export async function getCommitteeMembers(): Promise<CommitteeMember[]> {
  return getAll<CommitteeMember>(
    'committee_members',
    orderBy('sort_order'),
    orderBy('full_name')
  )
}

export async function createCommitteeMember(
  data: Omit<CommitteeMember, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'committee_members'), {
    ...data,
    created_at: now(),
    updated_at: now(),
  })
  return ref.id
}

export async function updateCommitteeMember(
  id: string,
  data: Partial<Omit<CommitteeMember, 'id' | 'created_at'>>
): Promise<void> {
  await updateDoc(doc(db, 'committee_members', id), {
    ...data,
    updated_at: now(),
  })
}

export async function deleteCommitteeMember(id: string): Promise<void> {
  await deleteDoc(doc(db, 'committee_members', id))
}

// ─── SITE INFO ───────────────────────────────────────────────────────────────
// Document ID pattern: "<section>__<key>"  (double underscore separator)

export async function getSiteInfo(): Promise<SiteInfo[]> {
  return getAll<SiteInfo>('site_info')
}

export async function upsertSiteInfo(
  section: string,
  key: string,
  value: string
): Promise<void> {
  const id = `${section}__${key}`
  await setDoc(
    doc(db, 'site_info', id),
    { section, key, value, updated_at: now() },
    { merge: true }
  )
}

// ─── CONTACT DETAILS ─────────────────────────────────────────────────────────

export async function getContactDetails(): Promise<ContactDetail[]> {
  return getAll<ContactDetail>(
    'contact_details',
    orderBy('sort_order'),
    orderBy('label')
  )
}

export async function createContactDetail(
  data: Omit<ContactDetail, 'id' | 'updated_at'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'contact_details'), {
    ...data,
    updated_at: now(),
  })
  return ref.id
}

export async function updateContactDetail(
  id: string,
  data: Partial<Omit<ContactDetail, 'id'>>
): Promise<void> {
  await updateDoc(doc(db, 'contact_details', id), {
    ...data,
    updated_at: now(),
  })
}

export async function deleteContactDetail(id: string): Promise<void> {
  await deleteDoc(doc(db, 'contact_details', id))
}

// ─── MEMBERSHIP TIERS ────────────────────────────────────────────────────────

export async function getMembershipTiers(): Promise<MembershipTier[]> {
  return getAll<MembershipTier>('membership_tiers', orderBy('sort_order'))
}

export async function createMembershipTier(
  data: Omit<MembershipTier, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'membership_tiers'), {
    ...data,
    created_at: now(),
    updated_at: now(),
  })
  return ref.id
}

export async function updateMembershipTier(
  id: string,
  data: Partial<Omit<MembershipTier, 'id' | 'created_at'>>
): Promise<void> {
  await updateDoc(doc(db, 'membership_tiers', id), {
    ...data,
    updated_at: now(),
  })
}

export async function deleteMembershipTier(id: string): Promise<void> {
  await deleteDoc(doc(db, 'membership_tiers', id))
}

// ─── MEMBERSHIP APPLICATIONS ─────────────────────────────────────────────────

export async function getMembershipApplications(): Promise<
  MembershipApplication[]
> {
  // Firestore doesn't support cross-collection joins — we fetch tiers
  // separately and stitch them in, matching the Supabase
  // `.select('*, membership_tiers(name)')` pattern.
  const [apps, tiers] = await Promise.all([
    getAll<MembershipApplication>(
      'membership_applications',
      orderBy('created_at', 'desc')
    ),
    getMembershipTiers(),
  ])

  const tierMap = Object.fromEntries(tiers.map((t) => [t.id, t]))
  return apps.map((a) => ({
    ...a,
    membership_tiers: a.tier_id ? tierMap[a.tier_id] : undefined,
  }))
}

export async function createMembershipApplication(
  data: Omit<MembershipApplication, 'id' | 'created_at' | 'updated_at' | 'membership_tiers'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'membership_applications'), {
    ...data,
    created_at: now(),
    updated_at: now(),
  })
  return ref.id
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
): Promise<void> {
  await updateDoc(doc(db, 'membership_applications', id), {
    status,
    updated_at: now(),
  })
}

export async function deleteMembershipApplication(id: string): Promise<void> {
  await deleteDoc(doc(db, 'membership_applications', id))
}
