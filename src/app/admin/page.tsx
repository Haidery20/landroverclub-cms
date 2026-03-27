import Link from 'next/link'
import {
  getEvents,
  getPartners,
  getGallery,
  getCommitteeMembers,
  getMembershipApplications,
} from '@/lib/db'

async function getStats() {
  const [events, partners, gallery, committee, applications] = await Promise.all([
    getEvents(),
    getPartners(),
    getGallery(),
    getCommitteeMembers(),
    getMembershipApplications(),
  ])

  return {
    events: events.length,
    upcomingEvents: events.filter(e => e.status === 'upcoming').length,
    partners: partners.filter(p => p.is_active).length,
    gallery: gallery.length,
    committee: committee.filter(m => m.is_active).length,
    applications: applications.length,
    pendingApplications: applications.filter(a => a.status === 'pending').length,
  }
}

const statCards = [
  { label: 'Total Events',        key: 'events',       sub: 'upcomingEvents',       subLabel: 'upcoming',      href: '/admin/events',     color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { label: 'Active Partners',     key: 'partners',                                                              href: '/admin/partners',   color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { label: 'Gallery Photos',      key: 'gallery',                                                               href: '/admin/gallery',    color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { label: 'Committee Members',   key: 'committee',                                                             href: '/admin/committee',  color: 'bg-green-50 text-green-600 border-green-100' },
  { label: 'Member Applications', key: 'applications', sub: 'pendingApplications',  subLabel: 'pending review', href: '/admin/membership', color: 'bg-rose-50 text-rose-600 border-rose-100' },
]

const quickLinks = [
  { label: 'Add New Event',          href: '/admin/events/new',  icon: '📅' },
  { label: 'Upload Photos',          href: '/admin/gallery',     icon: '🖼️' },
  { label: 'Add Partner',            href: '/admin/partners',    icon: '🤝' },
  { label: 'Add Committee Member',   href: '/admin/committee',   icon: '👤' },
  { label: 'Edit About Page',        href: '/admin/about',       icon: '📝' },
  { label: 'Update Contact Info',    href: '/admin/contact',     icon: '📞' },
]

export default async function AdminDashboardPage() {
  const stats = await getStats()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back. Here&apos;s what&apos;s happening on your site.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => {
          const value = stats[card.key as keyof typeof stats] as number
          const subValue = card.sub ? (stats[card.sub as keyof typeof stats] as number) : null

          return (
            <Link
              key={card.key}
              href={card.href}
              className={`rounded-2xl border p-5 hover:shadow-md transition-shadow ${card.color}`}
            >
              <div className="text-3xl font-bold mb-1">{value}</div>
              <div className="text-sm font-medium opacity-80">{card.label}</div>
              {subValue !== null && subValue > 0 && (
                <div className="text-xs mt-1 opacity-60">{subValue} {card.subLabel}</div>
              )}
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all group"
            >
              <span className="text-xl">{link.icon}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-[#0a0f0d] text-white rounded-2xl p-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#1a2e1f] border border-[#2d4f35] flex items-center justify-center flex-shrink-0 text-[#4ade80]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium">Changes take effect immediately</p>
          <p className="text-[#4a6050] text-xs mt-0.5">All updates you make here are live on landroverclub.or.tz in real time.</p>
        </div>
      </div>
    </div>
  )
}
