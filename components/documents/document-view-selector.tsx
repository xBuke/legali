'use client'

import { Button } from '@/components/ui/button'
import { Table, Grid, List } from 'lucide-react'

export type DocumentViewMode = 'table' | 'grid' | 'list'

interface DocumentViewSelectorProps {
  viewMode: DocumentViewMode
  onViewModeChange: (mode: DocumentViewMode) => void
}

export function DocumentViewSelector({ viewMode, onViewModeChange }: DocumentViewSelectorProps) {
  const viewModes = [
    {
      mode: 'table' as DocumentViewMode,
      icon: Table,
      label: 'Tablica',
      description: 'Klasični prikaz u tablici'
    },
    {
      mode: 'grid' as DocumentViewMode,
      icon: Grid,
      label: 'Mreža',
      description: 'Prikaz u obliku mreže'
    },
    {
      mode: 'list' as DocumentViewMode,
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
