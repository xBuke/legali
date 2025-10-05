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
  Search,
  BarChart3,
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
    { name: 'Analitika', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Klijenti', href: '/dashboard/clients', icon: Users },
    { name: 'Predmeti', href: '/dashboard/cases', icon: Briefcase },
    { name: 'Dokumenti', href: '/dashboard/documents', icon: FileText },
    { name: 'Pratnja vremena', href: '/dashboard/time-tracking', icon: Clock },
    { name: 'Računi', href: '/dashboard/invoices', icon: Receipt },
  ]

  // Filter navigation based on user permissions
  const navigation = allNavigation.filter(item => canAccessRoute(item.href))

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen 
            ? 'w-64' 
            : 'w-0 md:w-20 lg:w-24'
        } bg-card border-r border-border transition-all duration-300 flex flex-col fixed md:relative z-50 md:z-auto h-full overflow-hidden ${
          !sidebarOpen ? 'hidden md:flex' : 'flex'
        }`}
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
            className={`${!sidebarOpen ? 'mx-auto' : ''} min-h-[44px] min-w-[44px]`}
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
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors min-h-[44px]"
                onClick={() => {
                  // Close sidebar on mobile when navigating
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false)
                  }
                }}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm md:text-base">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors min-h-[44px]"
            onClick={() => {
              // Close sidebar on mobile when navigating
              if (window.innerWidth < 768) {
                setSidebarOpen(false)
              }
            }}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm md:text-base">Postavke</span>}
          </Link>
          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: '/sign-in' })}
            className="w-full justify-start min-h-[44px]"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="ml-3 text-sm md:text-base">Odjava</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden min-h-[44px] min-w-[44px] flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h2 className="text-base md:text-lg font-semibold truncate">
                {session?.user?.name || session?.user?.email}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                {session?.user?.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 min-h-[44px]"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Pretraži</span>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background min-h-0 w-full main-content-fix laptop-optimized">
          <div className="w-full max-w-full overflow-hidden">
            {children}
          </div>
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
