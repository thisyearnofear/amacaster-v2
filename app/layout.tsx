import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './components/Providers'
import { AuthContainer } from './components/AuthContainer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AMACASTER',
  description: 'One-stop FC AMA shop',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white relative`}>
        <Providers>
          <AuthContainer />
          {children}
        </Providers>
      </body>
    </html>
  )
}
