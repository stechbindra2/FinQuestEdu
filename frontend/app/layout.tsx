import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FinQuest - Learn Finance Through Fun!',
  description: 'AI-powered gamified personal finance learning platform for students',
  keywords: ['finance', 'education', 'kids', 'learning', 'gamification'],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
