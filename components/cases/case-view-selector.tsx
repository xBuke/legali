'use client'

import { Button } from '@/components/ui/button'
import { Table, Grid3X3, Columns3 } from 'lucide-react'

export type CaseViewMode = 'table' | 'kanban' | 'cards'

interface CaseViewSelectorProps {
  viewMode: CaseViewMode
  onViewModeChange: (mode: CaseViewMode) => void
}

export function CaseViewSelector({ viewMode, onViewModeChange }: CaseViewSelectorProps) {
  const viewModes = [
    {
      mode: 'table' as CaseViewMode,
      label: 'Tablica',
      icon: Table,
      description: 'Klasični prikaz u tablici',
    },
    {
      mode: 'kanban' as CaseViewMode,
      label: 'Kanban',
      icon: Columns3,
      description: 'Pregled po statusima',
    },
    {
      mode: 'cards' as CaseViewMode,
      label: 'Kartice',
      icon: Grid3X3,
      description: 'Detaljni prikaz kartica',
    },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {viewModes.map(({ mode, label, icon: Icon, description }) => (
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
