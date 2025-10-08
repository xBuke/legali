'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href: string
  isLast?: boolean
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  clients: 'Clients',
  cases: 'Cases',
  documents: 'Documents',
  'time-tracking': 'Time Tracking',
  invoices: 'Invoices',
  settings: 'Settings',
  security: 'Security',
  analytics: 'Analytics',
  profile: 'Profile',
  organization: 'Organization',
  subscription: 'Subscription',
  billing: 'Billing',
  team: 'Team',
  '2fa': 'Two-Factor Authentication',
  sessions: 'Active Sessions'
}

export function BreadcrumbNav() {
  const pathname = usePathname()

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Always start with Dashboard
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/dashboard'
    })

    // Build breadcrumbs from path segments
    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Skip the first segment if it's a locale (en, hr)
      if (index === 0 && (segment === 'en' || segment === 'hr')) {
        return
      }

      // Skip dashboard segment as it's already added
      if (segment === 'dashboard') {
        return
      }

      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      const isLast = index === segments.length - 1

      breadcrumbs.push({
        label,
        href: currentPath,
        isLast
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className="flex items-center space-x-1 text-sm" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
            )}
            {breadcrumb.isLast ? (
              <span className="font-medium text-foreground">
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {breadcrumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}