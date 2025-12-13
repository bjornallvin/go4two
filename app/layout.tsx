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
        <div className="flex-1">{children}</div>
        <footer className="py-6 px-4 text-center space-y-2">
          <p className="text-stone-500 text-sm">
            Crafted with care by{' '}
            <a
              href="https://github.com/bjornallvin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 hover:text-amber-400 transition-colors"
            >
              Björn Allvin
            </a>
          </p>
          <p className="text-stone-600 text-sm">
            <a
              href="https://github.com/bjornallvin/go4two"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-400 transition-colors"
            >
              View on GitHub
            </a>
            {' · '}
            © {new Date().getFullYear()}
          </p>
        </footer>
      </body>
    </html>
  )
}
