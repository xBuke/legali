'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Scale,
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Clock,
  Receipt,
  Settings,
  LogOut,
  Menu,
  Euro,
  Search,
} from 'lucide-react'
import { useState } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import { GlobalSearch } from '@/components/search/global-search'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const { canAccessRoute } = usePermissions()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Scale className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Učitavanje...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/sign-in')
    return null
  }

  const allNavigation = [
    { name: 'Nadzorna ploča', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Klijenti', href: '/dashboard/clients', icon: Users },
    { name: 'Predmeti', href: '/dashboard/cases', icon: Briefcase },
    { name: 'Dokumenti', href: '/dashboard/documents', icon: FileText },
    { name: 'Pratnja vremena', href: '/dashboard/time-tracking', icon: Clock },
    { name: 'Računi', href: '/dashboard/invoices', icon: Receipt },
    { name: 'Troškovi', href: '/dashboard/expenses', icon: Euro },
  ]

  // Filter navigation based on user permissions
  const navigation = allNavigation.filter(item => canAccessRoute(item.href))

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">iLegal</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={!sidebarOpen ? 'mx-auto' : ''}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span>Postavke</span>}
          </Link>
          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: '/sign-in' })}
            className="w-full justify-start"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="ml-3">Odjava</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <div>
            <h2 className="text-lg font-semibold">
              {session?.user?.name || session?.user?.email}
            </h2>
            <p className="text-sm text-muted-foreground">
              {session?.user?.role}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Pretraži</span>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>

      {/* Global Search */}
      <GlobalSearch 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />
    </div>
  )
}
