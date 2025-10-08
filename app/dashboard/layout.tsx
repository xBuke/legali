'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemePicker } from '@/components/theme-picker'
import { LanguageSwitcher } from '@/components/language-switcher'
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
  Pin,
  PinOff,
  Command,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import { GlobalSearch } from '@/components/search/global-search'
import { cn } from '@/lib/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const { canAccessRoute } = usePermissions()

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Load sidebar pinned state from localStorage
  useEffect(() => {
    const savedPinnedState = localStorage.getItem('sidebar-pinned')
    if (savedPinnedState !== null) {
      setSidebarPinned(JSON.parse(savedPinnedState))
    }
  }, [])

  const toggleSidebarPinned = () => {
    const newPinnedState = !sidebarPinned
    setSidebarPinned(newPinnedState)
    localStorage.setItem('sidebar-pinned', JSON.stringify(newPinnedState))
  }

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
    { name: 'navigation.dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'navigation.clients', href: '/dashboard/clients', icon: Users },
    { name: 'navigation.cases', href: '/dashboard/cases', icon: Briefcase },
    { name: 'navigation.documents', href: '/dashboard/documents', icon: FileText },
    { name: 'navigation.timeTracking', href: '/dashboard/time-tracking', icon: Clock },
    { name: 'navigation.invoices', href: '/dashboard/invoices', icon: Receipt },
  ]

  // Filter navigation based on user permissions
  const navigation = allNavigation.filter(item => canAccessRoute(item.href))

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Modern Sidebar */}
      <aside
        className={cn(
          "bg-card border-r border-border transition-all duration-300 flex flex-col fixed md:relative z-50 md:z-auto h-full overflow-hidden",
          sidebarOpen ? 'w-64' : 'w-0 md:w-16',
          !sidebarOpen ? 'hidden md:flex' : 'flex',
          sidebarPinned && 'md:w-64'
        )}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              {(sidebarOpen || sidebarPinned) && (
                <span className="font-semibold text-lg">iLegal</span>
              )}
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebarPinned}
              className="hidden md:flex h-8 w-8"
            >
              {sidebarPinned ? (
                <PinOff className="h-4 w-4" />
              ) : (
                <Pin className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden h-8 w-8"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = isActiveRoute(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-primary text-primary-foreground shadow-sm",
                  !isActive && "text-muted-foreground"
                )}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false)
                  }
                }}
              >
                <Icon className={cn(
                  "h-4 w-4 flex-shrink-0 transition-colors",
                  isActive && "text-primary-foreground",
                  !isActive && "text-muted-foreground group-hover:text-accent-foreground"
                )} />
                {(sidebarOpen || sidebarPinned) && (
                  <span className="text-sm font-medium truncate">{item.name}</span>
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-r-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-border space-y-1">
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
            )}
            onClick={() => {
              if (window.innerWidth < 768) {
                setSidebarOpen(false)
              }
            }}
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            {(sidebarOpen || sidebarPinned) && (
              <span className="text-sm font-medium">Settings</span>
            )}
          </Link>
          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full justify-start h-auto py-2.5 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {(sidebarOpen || sidebarPinned) && (
              <span className="ml-3 text-sm font-medium">Sign Out</span>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Modern Header */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden h-9 w-9"
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            {/* Breadcrumb Navigation */}
            <BreadcrumbNav />
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Command Palette Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 h-9 px-3 text-muted-foreground"
            >
              <Command className="h-4 w-4" />
              <span className="hidden lg:inline">Search</span>
              <kbd className="pointer-events-none hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            {/* Search Button for Mobile */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="sm:hidden h-9 w-9"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Theme Picker */}
            <ThemePicker />
            
            {/* User Menu */}
            <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 h-9 px-3"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <div className="hidden sm:block text-left min-w-0">
                    <p className="text-sm font-medium truncate max-w-[120px]">
                      {session?.user?.name?.split(' ')[0] || session?.user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {session?.user?.role}
                    </p>
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                      <p className="text-xs text-muted-foreground">{session?.user?.role}</p>
                    </div>
                  </div>
                </div>
                <div className="p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUserMenuOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
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

      {/* Global Search */}
      <GlobalSearch 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />

      {/* Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />
    </div>
  )
}
