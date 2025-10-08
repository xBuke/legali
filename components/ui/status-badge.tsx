'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle, Clock, AlertCircle, XCircle, Dot } from 'lucide-react'

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'error' | 'warning' | 'info'
  showDot?: boolean
  className?: string
  children?: React.ReactNode
}

const statusConfig = {
  active: {
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    dotColor: 'bg-green-500'
  },
  inactive: {
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle,
    dotColor: 'bg-gray-500'
  },
  pending: {
    variant: 'outline' as const,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    dotColor: 'bg-yellow-500'
  },
  completed: {
    variant: 'default' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
    dotColor: 'bg-blue-500'
  },
  error: {
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    dotColor: 'bg-red-500'
  },
  warning: {
    variant: 'outline' as const,
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertCircle,
    dotColor: 'bg-orange-500'
  },
  info: {
    variant: 'outline' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: AlertCircle,
    dotColor: 'bg-blue-500'
  }
}

export function StatusBadge({ status, showDot = false, className, children }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {showDot ? (
        <div className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />
      ) : (
        <Icon className="h-3 w-3" />
      )}
      {children}
    </Badge>
  )
}
