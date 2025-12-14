import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'Go4Two - Play Go Online',
  description: 'Simple multiplayer Go game - create a game and share the link',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${nunito.className} min-h-screen flex flex-col bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800`}>
        {children}
      </body>
    </html>
  )
}
