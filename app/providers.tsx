'use client'

import { SessionProvider } from 'next-auth/react'
import { NextIntlClientProvider } from 'next-intl'
import type { Session } from 'next-auth'

export function AuthProvider({ 
  children, 
  session 
}: { 
  children: React.ReactNode
  session: Session | null
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}

export function IntlProvider({
  children,
  messages,
  locale
}: {
  children: React.ReactNode
  messages: any
  locale: string
}) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  )
}
