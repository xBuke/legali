'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemePicker } from '@/components/theme-picker'
import { CommandPalette } from '@/components/command-palette'
import { BreadcrumbNav } from '@/components/breadcrumb-nav'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
  User,
  ChevronDown,
  Command,
} from 'lucide-react'
import { useState } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import { useTranslations } from 'next-intl'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
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
    { name: t('navigation.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('navigation.clients'), href: '/dashboard/clients', icon: Users },
    { name: t('navigation.cases'), href: '/dashboard/cases', icon: Briefcase },
    { name: t('navigation.documents'), href: '/dashboard/documents', icon: FileText },
    { name: t('navigation.timeTracking'), href: '/dashboard/time-tracking', icon: Clock },
    { name: t('navigation.invoices'), href: '/dashboard/invoices', icon: Receipt },
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
            : 'w-0 md:w-16'
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
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors min-h-[44px] group"
                onClick={() => {
                  // Close sidebar on mobile when navigating
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false)
                  }
                }}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.name}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-border space-y-1">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors min-h-[44px] group"
            onClick={() => {
              // Close sidebar on mobile when navigating
              if (window.innerWidth < 768) {
                setSidebarOpen(false)
              }
            }}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && (
              <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {t('navigation.settings')}
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full justify-start min-h-[44px] group"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && (
              <span className="ml-3 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {t('auth.signOut')}
              </span>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden min-h-[44px] min-w-[44px] flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <BreadcrumbNav className="hidden md:flex" />
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* Command Palette Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommandOpen(true)}
              className="flex items-center gap-2 min-h-[44px]"
            >
              <Command className="h-4 w-4" />
              <span className="hidden sm:inline">{t('common.search')}</span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            
            <LanguageSwitcher />
            <ThemePicker />
            
            {/* User Menu */}
            <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 min-h-[44px] px-3"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline truncate max-w-[120px]">
                    {session?.user?.name?.split(' ')[0] || session?.user?.email}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1" align="end">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.role}</p>
                </div>
                <div className="p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUserMenuOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="w-full justify-start"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('auth.signOut')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background min-h-0 w-full">
          <div className="w-full max-w-full overflow-hidden">
            {children}
          </div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={commandOpen} 
        onClose={() => setCommandOpen(false)} 
      />
    </div>
  )
}
