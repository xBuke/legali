'use client'

import { useEffect } from 'react'
import { initResponsive } from '@/lib/responsive-utils'

export function ResponsiveProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize responsive behavior
    const cleanup = initResponsive()
    
    // Cleanup on unmount
    return cleanup
  }, [])

  return <>{children}</>
}
