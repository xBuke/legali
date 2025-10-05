'use client'

import { Button } from '@/components/ui/button'
import { Table, Grid, List } from 'lucide-react'

export type ClientViewMode = 'table' | 'cards' | 'list'

interface ClientViewSelectorProps {
  viewMode: ClientViewMode
  onViewModeChange: (mode: ClientViewMode) => void
}

export function ClientViewSelector({ viewMode, onViewModeChange }: ClientViewSelectorProps) {
  const viewModes = [
    {
      mode: 'table' as ClientViewMode,
      icon: Table,
      label: 'Tablica',
      description: 'Klasični prikaz u tablici'
    },
    {
      mode: 'cards' as ClientViewMode,
      icon: Grid,
      label: 'Kartice',
      description: 'Prikaz u obliku kartica'
    },
    {
      mode: 'list' as ClientViewMode,
      icon: List,
      label: 'Lista',
      description: 'Kompaktni prikaz liste'
    }
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {viewModes.map(({ mode, icon: Icon, label, description }) => (
        <Button
          key={mode}
          variant={viewMode === mode ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange(mode)}
          className="flex items-center gap-2"
          title={description}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  )
}
