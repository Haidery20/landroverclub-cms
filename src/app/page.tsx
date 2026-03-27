import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0f0d] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Land Rover Club Tanzania</h1>
        <p className="text-[#4a6050] mb-8">Website coming soon.</p>
        <Link href="/admin" className="bg-[#4ade80] text-[#0a0f0d] font-bold px-6 py-3 rounded-xl hover:bg-[#22c55e] transition-colors">
          Go to Admin Panel →
        </Link>
      </div>
    </main>
  )
}
