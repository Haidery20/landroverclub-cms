/**
 * seed.mjs — One-time Firestore seed script
 *
 * Populates the default site_info and contact_details that were previously
 * seeded via the Supabase SQL schema.
 *
 * Usage:
 *   1. Install deps:  npm install firebase
 *   2. Set env vars below (or export them in your shell)
 *   3. Run:           node scripts/seed.mjs
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, setDoc, doc } from 'firebase/firestore'

// ── Paste your Firebase config here ──────────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const now = new Date().toISOString()

// ── site_info (section__key document IDs) ─────────────────────────────────────
const siteInfoRows = [
  { section: 'hero',  key: 'headline',      value: "Tanzania's Premier Land Rover Club" },
  { section: 'hero',  key: 'subheadline',   value: 'Connecting off-road enthusiasts across East Africa since 1975' },
  { section: 'about', key: 'title',         value: 'About Land Rover Club Tanzania' },
  { section: 'about', key: 'body',          value: 'The Land Rover Club of Tanzania (LRCT) is the official club for Land Rover enthusiasts in Tanzania...' },
  { section: 'about', key: 'mission',       value: 'To promote responsible off-road driving, conservation, and camaraderie among Land Rover owners in Tanzania.' },
  { section: 'about', key: 'founded_year',  value: '1975' },
  { section: 'about', key: 'member_count',  value: '250+' },
]

// ── contact_details ───────────────────────────────────────────────────────────
const contactRows = [
  { label: 'Email',     value: 'info@landroverclub.or.tz',         type: 'email',   sort_order: 1, is_active: true },
  { label: 'Phone',     value: '+255 XXX XXX XXX',                 type: 'phone',   sort_order: 2, is_active: true },
  { label: 'Address',   value: 'Dar es Salaam, Tanzania',           type: 'address', sort_order: 3, is_active: true },
  { label: 'Facebook',  value: 'https://facebook.com/lrctanzania',  type: 'social',  sort_order: 4, is_active: true },
  { label: 'Instagram', value: 'https://instagram.com/lrctanzania', type: 'social',  sort_order: 5, is_active: true },
]

async function seed() {
  console.log('🌱 Seeding Firestore…\n')

  // site_info
  for (const row of siteInfoRows) {
    const id = `${row.section}__${row.key}`
    await setDoc(doc(db, 'site_info', id), { ...row, updated_at: now }, { merge: true })
    console.log(`  ✓ site_info/${id}`)
  }

  // contact_details (auto-ID via timestamp)
  for (const row of contactRows) {
    const id = `contact_${row.sort_order}`
    await setDoc(doc(db, 'contact_details', id), { ...row, updated_at: now }, { merge: true })
    console.log(`  ✓ contact_details/${id}`)
  }

  console.log('\n✅ Seed complete.')
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
