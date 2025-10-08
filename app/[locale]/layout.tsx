import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider, IntlProvider } from '../providers'
import { ResponsiveProvider } from '../responsive-provider'
import { auth } from '@/lib/auth'
import { getMessages } from 'next-intl/server'
import { locales } from '@/lib/i18n'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'iLegal - Legal Practice Management',
  description: 'Comprehensive platform for legal practice management',
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const session = await auth()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <ResponsiveProvider>
          <IntlProvider messages={messages} locale={locale}>
            <AuthProvider session={session}>
              <ThemeProvider
                defaultTheme="system"
              >
                {children}
                <Toaster />
              </ThemeProvider>
            </AuthProvider>
          </IntlProvider>
        </ResponsiveProvider>
      </body>
    </html>
  )
}
