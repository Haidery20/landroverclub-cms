# Land Rover Club Tanzania — CMS Setup Guide

## Overview

Full-stack CMS built with Next.js 15 (App Router) + Supabase + Tailwind CSS.

Admin panel at `/admin`, covering:
- Events (full CRUD + image upload)
- Partners & Sponsors (logos, tiers)
- Gallery (multi-upload, albums, featured)
- Committee Members (photos, bios)
- About & Site Info (hero, about, SEO, footer)
- Contact Details
- Membership Tiers + Applications Inbox

---

## Step 1 — Create Supabase Project

1. Go to https://supabase.com → New Project
2. Note your Project URL and Anon Key (Settings → API)
3. Also copy your Service Role Key (keep this secret!)

Run the schema:
1. Supabase dashboard → SQL Editor
2. Open `supabase-schema.sql` from this project
3. Paste and click Run

Create Storage Buckets (all public):
- events
- partners
- gallery
- committee
- general

---

## Step 2 — Environment Variables

Edit `.env.local`:

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
ADMIN_PASSWORD=choose_a_strong_password

---

## Step 3 — Run Locally

npm install
npm run dev

Admin: http://localhost:3000/admin

---

## Step 4 — Deploy to Vercel

1. Push to GitHub
2. Import repo on vercel.com
3. Add all 4 env vars in Vercel dashboard
4. Deploy, then add domain landroverclub.or.tz

DNS: Add CNAME www → cname.vercel-dns.com

---

## Fetching Data in Your Frontend

import { supabase } from '@/lib/supabase'

// Upcoming events
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('status', 'upcoming')
  .order('event_date')
# landroverclub-cms
