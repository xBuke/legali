'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Clock,
  Receipt,
  Settings,
  Plus,
  BarChart3,
  Shield,
  UserPlus,
  FilePlus,
  Timer,
  ArrowRight,
} from 'lucide-react'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface CommandItem {
  id: string
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  keywords: string[]
  category: 'navigation' | 'actions' | 'recent'
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const router = useRouter()

  const navigationItems: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Overview of your practice',
      href: '/dashboard',
      icon: LayoutDashboard,
      keywords: ['dashboard', 'overview', 'home'],
      category: 'navigation'
    },
    {
      id: 'clients',
      title: 'Clients',
      description: 'Manage your clients',
      href: '/dashboard/clients',
      icon: Users,
      keywords: ['clients', 'customers', 'people'],
      category: 'navigation'
    },
    {
      id: 'cases',
      title: 'Cases',
      description: 'Track your legal cases',
      href: '/dashboard/cases',
      icon: Briefcase,
      keywords: ['cases', 'matters', 'legal'],
      category: 'navigation'
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Document library',
      href: '/dashboard/documents',
      icon: FileText,
      keywords: ['documents', 'files', 'library'],
      category: 'navigation'
    },
    {
      id: 'time-tracking',
      title: 'Time Tracking',
      description: 'Track billable hours',
      href: '/dashboard/time-tracking',
      icon: Clock,
      keywords: ['time', 'hours', 'tracking', 'billable'],
      category: 'navigation'
    },
    {
      id: 'invoices',
      title: 'Invoices',
      description: 'Manage invoices and billing',
      href: '/dashboard/invoices',
      icon: Receipt,
      keywords: ['invoices', 'billing', 'payments'],
      category: 'navigation'
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Account and preferences',
      href: '/dashboard/settings',
      icon: Settings,
      keywords: ['settings', 'preferences', 'account'],
      category: 'navigation'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Reports and insights',
      href: '/dashboard/analytics',
      icon: BarChart3,
      keywords: ['analytics', 'reports', 'insights'],
      category: 'navigation'
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Security settings',
      href: '/dashboard/security',
      icon: Shield,
      keywords: ['security', '2fa', 'sessions'],
      category: 'navigation'
    }
  ]

  const actionItems: CommandItem[] = [
    {
      id: 'new-client',
      title: 'New Client',
      description: 'Add a new client',
      href: '/dashboard/clients?action=create',
      icon: UserPlus,
      keywords: ['new', 'client', 'add', 'create'],
      category: 'actions'
    },
    {
      id: 'new-case',
      title: 'New Case',
      description: 'Create a new case',
      href: '/dashboard/cases?action=create',
      icon: Briefcase,
      keywords: ['new', 'case', 'matter', 'create'],
      category: 'actions'
    },
    {
      id: 'upload-document',
      title: 'Upload Document',
      description: 'Upload a new document',
      href: '/dashboard/documents?action=upload',
      icon: FilePlus,
      keywords: ['upload', 'document', 'file', 'new'],
      category: 'actions'
    },
    {
      id: 'start-timer',
      title: 'Start Timer',
      description: 'Start time tracking',
      href: '/dashboard/time-tracking?action=start',
      icon: Timer,
      keywords: ['start', 'timer', 'time', 'tracking'],
      category: 'actions'
    },
    {
      id: 'create-invoice',
      title: 'Create Invoice',
      description: 'Create a new invoice',
      href: '/dashboard/invoices?action=create',
        icon: Receipt,
      keywords: ['create', 'invoice', 'billing', 'new'],
      category: 'actions'
    }
  ]

  const allItems = [...navigationItems, ...actionItems]

  const filteredItems = allItems.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.keywords.some(keyword => keyword.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSelect = (href: string) => {
    router.push(href)
    onClose()
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput
            placeholder="Search for pages, actions, or use keywords..."
            value={search}
            onValueChange={setSearch}
            className="border-0 focus:ring-0"
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            
            {filteredItems.length > 0 && (
              <>
                <CommandGroup heading="Navigation">
                  {filteredItems
                    .filter(item => item.category === 'navigation')
                    .map((item) => {
                      const Icon = item.icon
                      return (
                        <CommandItem
                          key={item.id}
                          value={item.id}
                          onSelect={() => handleSelect(item.href)}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.description}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </CommandItem>
                      )
                    })}
                </CommandGroup>

                {filteredItems.filter(item => item.category === 'actions').length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="Quick Actions">
                      {filteredItems
                        .filter(item => item.category === 'actions')
                        .map((item) => {
                          const Icon = item.icon
                          return (
                            <CommandItem
                              key={item.id}
                              value={item.id}
                              onSelect={() => handleSelect(item.href)}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="font-medium">{item.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {item.description}
                                </div>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </CommandItem>
                          )
                        })}
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}