import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Land Rover Club Tanzania',
  description: 'Official website of the Land Rover Club of Tanzania',
  icons: {
    icon: '/lrct.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
