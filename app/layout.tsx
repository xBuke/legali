import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from './providers'
import { ResponsiveProvider } from './responsive-provider'
import { auth } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'iLegal - Upravljanje odvjetničkom kancelarijom',
  description: 'Sveobuhvatna platforma za upravljanje odvjetničkom praksom',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="hr" suppressHydrationWarning>
      <body className={inter.className}>
        <ResponsiveProvider>
          <AuthProvider session={session}>
            <ThemeProvider
              defaultTheme="system"
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </ResponsiveProvider>
      </body>
    </html>
  )
}