'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Calendar, 
  Clock, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  User,
  Edit,
  Trash2
} from 'lucide-react'
import { format, isBefore, addDays } from 'date-fns'
import { hr } from 'date-fns/locale'

interface CaseDeadline {
  id: string
  title: string
  description?: string
  dueDate: string
  type: 'hearing' | 'filing' | 'response' | 'custom'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'completed' | 'overdue'
  assignedTo?: {
    id: string
    firstName?: string
    lastName?: string
  }
  createdAt: string
  completedAt?: string
}

interface CaseDeadlinesProps {
  caseId: string
  users: Array<{
    id: string
    firstName?: string
    lastName?: string
  }>
}

export function CaseDeadlines({ caseId, users }: CaseDeadlinesProps) {
  const [deadlines, setDeadlines] = useState<CaseDeadline[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState<CaseDeadline | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    type: 'custom' as 'hearing' | 'filing' | 'response' | 'custom',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    assignedToId: '',
  })

  useEffect(() => {
    fetchDeadlines()
  }, [caseId, fetchDeadlines])

  async function fetchDeadlines() {
    try {
      const response = await fetch(`/api/cases/${caseId}/deadlines`)
      if (response.ok) {
        const data = await response.json()
        setDeadlines(data)
      }
    } catch (error) {
      console.error('Error fetching deadlines:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingDeadline ? `/api/cases/${caseId}/deadlines/${editingDeadline.id}` : `/api/cases/${caseId}/deadlines`
      const method = editingDeadline ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          assignedToId: formData.assignedToId === 'none' ? '' : formData.assignedToId,
        }),
      })

      if (response.ok) {
        setDialogOpen(false)
        resetForm()
        fetchDeadlines()
      }
    } catch (error) {
      console.error('Error saving deadline:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj rok?')) {
      return
    }

    try {
      const response = await fetch(`/api/cases/${caseId}/deadlines/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchDeadlines()
      }
    } catch (error) {
      console.error('Error deleting deadline:', error)
    }
  }

  async function handleComplete(id: string) {
    try {
      const response = await fetch(`/api/cases/${caseId}/deadlines/${id}/complete`, {
        method: 'PATCH',
      })

      if (response.ok) {
        fetchDeadlines()
      }
    } catch (error) {
      console.error('Error completing deadline:', error)
    }
  }

  function openEditDialog(deadline: CaseDeadline) {
    setEditingDeadline(deadline)
    setFormData({
      title: deadline.title,
      description: deadline.description || '',
      dueDate: format(new Date(deadline.dueDate), 'yyyy-MM-dd'),
      type: deadline.type,
      priority: deadline.priority,
      assignedToId: deadline.assignedTo?.id || 'none',
    })
    setDialogOpen(true)
  }

  function resetForm() {
    setEditingDeadline(null)
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      type: 'custom',
      priority: 'medium',
      assignedToId: 'none',
    })
  }

  function getDeadlineStatus(deadline: CaseDeadline) {
    if (deadline.status === 'completed') return 'completed'
    if (deadline.status === 'overdue') return 'overdue'
    
    const dueDate = new Date(deadline.dueDate)
    const now = new Date()
    const threeDaysFromNow = addDays(now, 3)
    
    if (isBefore(dueDate, now)) return 'overdue'
    if (isBefore(dueDate, threeDaysFromNow)) return 'urgent'
    return 'pending'
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500'
      case 'overdue':
        return 'bg-red-500/10 text-red-500'
      case 'urgent':
        return 'bg-orange-500/10 text-orange-500'
      default:
        return 'bg-blue-500/10 text-blue-500'
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'completed':
        return 'Završeno'
      case 'overdue':
        return 'Zakasnilo'
      case 'urgent':
        return 'Hitno'
      default:
        return 'Na čekanju'
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-500'
      case 'high':
        return 'bg-orange-500/10 text-orange-500'
      case 'medium':
        return 'bg-blue-500/10 text-blue-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  function getPriorityLabel(priority: string) {
    switch (priority) {
      case 'urgent':
        return 'Hitan'
      case 'high':
        return 'Visok'
      case 'medium':
        return 'Srednji'
      default:
        return 'Nizak'
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'hearing':
        return 'Ročište'
      case 'filing':
        return 'Podnošenje'
      case 'response':
        return 'Odgovor'
      default:
        return 'Ostalo'
    }
  }

  function getUserName(user: CaseDeadline['assignedTo']) {
    if (!user) return 'Nije dodijeljen'
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nepoznat korisnik'
  }

  const pendingDeadlines = deadlines.filter(d => d.status === 'pending')
  const overdueDeadlines = deadlines.filter(d => getDeadlineStatus(d) === 'overdue')
  const urgentDeadlines = deadlines.filter(d => getDeadlineStatus(d) === 'urgent')
  const completedDeadlines = deadlines.filter(d => d.status === 'completed')

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Rokovi i zadaci
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Učitavanje...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Rokovi i zadaci
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj rok
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingDeadline ? 'Uredi rok' : 'Dodaj novi rok'}
                </DialogTitle>
                <DialogDescription>
                  Unesite podatke o roku ili zadatku
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Naziv *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="npr. Podnošenje tužbe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Opis</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detaljan opis..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Datum roka *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tip</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: string) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hearing">Ročište</SelectItem>
                        <SelectItem value="filing">Podnošenje</SelectItem>
                        <SelectItem value="response">Odgovor</SelectItem>
                        <SelectItem value="custom">Ostalo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioritet</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: string) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Nizak</SelectItem>
                        <SelectItem value="medium">Srednji</SelectItem>
                        <SelectItem value="high">Visok</SelectItem>
                        <SelectItem value="urgent">Hitan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignedToId">Dodijeljen</Label>
                    <Select
                      value={formData.assignedToId}
                      onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberite korisnika" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nije dodijeljen</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {`${user.firstName} ${user.lastName}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setDialogOpen(false); resetForm() }}
                  >
                    Odustani
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Spremanje...' : editingDeadline ? 'Spremi' : 'Dodaj rok'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Nema rokova</p>
            <p className="text-sm text-muted-foreground mt-1">
              Dodajte rokove i zadatke za praćenje
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overdue Deadlines */}
            {overdueDeadlines.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Zakasnili rokovi ({overdueDeadlines.length})
                </h4>
                <div className="space-y-2">
                  {overdueDeadlines.map((deadline) => (
                    <div key={deadline.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium">{deadline.title}</h5>
                            <Badge className={getStatusColor(getDeadlineStatus(deadline))}>
                              {getStatusLabel(getDeadlineStatus(deadline))}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(deadline.priority)}>
                              {getPriorityLabel(deadline.priority)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {getTypeLabel(deadline.type)} • {format(new Date(deadline.dueDate), 'dd.MM.yyyy', { locale: hr })}
                          </p>
                          {deadline.description && (
                            <p className="text-sm text-muted-foreground">{deadline.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {getUserName(deadline.assignedTo)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleComplete(deadline.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(deadline)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(deadline.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Urgent Deadlines */}
            {urgentDeadlines.length > 0 && (
              <div>
                <h4 className="font-medium text-orange-600 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Hitni rokovi ({urgentDeadlines.length})
                </h4>
                <div className="space-y-2">
                  {urgentDeadlines.map((deadline) => (
                    <div key={deadline.id} className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium">{deadline.title}</h5>
                            <Badge className={getStatusColor(getDeadlineStatus(deadline))}>
                              {getStatusLabel(getDeadlineStatus(deadline))}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(deadline.priority)}>
                              {getPriorityLabel(deadline.priority)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {getTypeLabel(deadline.type)} • {format(new Date(deadline.dueDate), 'dd.MM.yyyy', { locale: hr })}
                          </p>
                          {deadline.description && (
                            <p className="text-sm text-muted-foreground">{deadline.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {getUserName(deadline.assignedTo)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleComplete(deadline.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(deadline)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(deadline.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Deadlines */}
            {pendingDeadlines.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Aktivni rokovi ({pendingDeadlines.length})</h4>
                <div className="space-y-2">
                  {pendingDeadlines.map((deadline) => (
                    <div key={deadline.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium">{deadline.title}</h5>
                            <Badge className={getStatusColor(getDeadlineStatus(deadline))}>
                              {getStatusLabel(getDeadlineStatus(deadline))}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(deadline.priority)}>
                              {getPriorityLabel(deadline.priority)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {getTypeLabel(deadline.type)} • {format(new Date(deadline.dueDate), 'dd.MM.yyyy', { locale: hr })}
                          </p>
                          {deadline.description && (
                            <p className="text-sm text-muted-foreground">{deadline.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {getUserName(deadline.assignedTo)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleComplete(deadline.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(deadline)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(deadline.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Deadlines */}
            {completedDeadlines.length > 0 && (
              <div>
                <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Završeni rokovi ({completedDeadlines.length})
                </h4>
                <div className="space-y-2">
                  {completedDeadlines.map((deadline) => (
                    <div key={deadline.id} className="p-3 border border-green-200 rounded-lg bg-green-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium line-through">{deadline.title}</h5>
                            <Badge className={getStatusColor('completed')}>
                              Završeno
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(deadline.priority)}>
                              {getPriorityLabel(deadline.priority)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {getTypeLabel(deadline.type)} • {format(new Date(deadline.dueDate), 'dd.MM.yyyy', { locale: hr })}
                          </p>
                          {deadline.description && (
                            <p className="text-sm text-muted-foreground">{deadline.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {getUserName(deadline.assignedTo)}
                            </span>
                            {deadline.completedAt && (
                              <span>
                                Završeno: {format(new Date(deadline.completedAt), 'dd.MM.yyyy', { locale: hr })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(deadline)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(deadline.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
