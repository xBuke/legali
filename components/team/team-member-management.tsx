'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Plus, 
  MoreVertical, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  UserPlus,
  Trash2,
  Edit,
  RefreshCw
} from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { getRoleDisplayName, getRoleDescription } from '@/lib/permissions'
import { toast } from '@/hooks/use-toast'

interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

interface TeamInvitation {
  id: string
  email: string
  role: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
  expiresAt: string
  acceptedAt: string | null
  invitedBy: {
    firstName: string
    lastName: string
    email: string
  }
  acceptedUser?: {
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
}

export function TeamMemberManagement() {
  const { canManageUsers, userRole } = usePermissions()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false)
  
  // Invitation form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('LAWYER')
  
  // Create user form state
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createFirstName, setCreateFirstName] = useState('')
  const [createLastName, setCreateLastName] = useState('')
  const [createRole, setCreateRole] = useState('LAWYER')

  // Check if user can manage team members
  if (!canManageUsers()) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nemate dozvolu za upravljanje članovima tima.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Fetch team members and invitations
  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [membersResponse, invitationsResponse] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/team/invitations')
      ])

      if (membersResponse.ok) {
        const members = await membersResponse.json()
        setTeamMembers(members)
      }

      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json()
        setInvitations(invitationsData)
      }
    } catch (error) {
      console.error('Error fetching team data:', error)
      toast({
        title: 'Greška',
        description: 'Greška pri dohvaćanju podataka o timu',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Send invitation
  const handleSendInvitation = async () => {
    if (!inviteEmail || !inviteRole) {
      toast({
        title: 'Greška',
        description: 'Molimo unesite email i ulogu',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/team/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: data.message,
        })
        setInviteModalOpen(false)
        setInviteEmail('')
        setInviteRole('LAWYER')
        fetchData()
      } else {
        toast({
          title: 'Greška',
          description: data.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast({
        title: 'Greška',
        description: 'Greška pri slanju pozivnice',
        variant: 'destructive'
      })
    }
  }

  // Create user directly
  const handleCreateUser = async () => {
    if (!createEmail || !createPassword || !createFirstName || !createLastName || !createRole) {
      toast({
        title: 'Greška',
        description: 'Molimo unesite sva obavezna polja',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: createEmail,
          password: createPassword,
          firstName: createFirstName,
          lastName: createLastName,
          role: createRole,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: data.message,
        })
        setCreateUserModalOpen(false)
        setCreateEmail('')
        setCreatePassword('')
        setCreateFirstName('')
        setCreateLastName('')
        setCreateRole('LAWYER')
        fetchData()
      } else {
        toast({
          title: 'Greška',
          description: data.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast({
        title: 'Greška',
        description: 'Greška pri kreiranju korisnika',
        variant: 'destructive'
      })
    }
  }

  // Cancel invitation
  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/team/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: data.message,
        })
        fetchData()
      } else {
        toast({
          title: 'Greška',
          description: data.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error canceling invitation:', error)
      toast({
        title: 'Greška',
        description: 'Greška pri otkazivanju pozivnice',
        variant: 'destructive'
      })
    }
  }

  // Resend invitation
  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/team/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'resend' }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: data.message,
        })
        fetchData()
      } else {
        toast({
          title: 'Greška',
          description: data.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error resending invitation:', error)
      toast({
        title: 'Greška',
        description: 'Greška pri ponovnom slanju pozivnice',
        variant: 'destructive'
      })
    }
  }

  // Deactivate user
  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Jeste li sigurni da želite deaktivirati ovog korisnika?')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: data.message,
        })
        fetchData()
      } else {
        toast({
          title: 'Greška',
          description: data.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error deactivating user:', error)
      toast({
        title: 'Greška',
        description: 'Greška pri deaktivaciji korisnika',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Čeka</Badge>
      case 'ACCEPTED':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Prihvaćeno</Badge>
      case 'EXPIRED':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="h-3 w-3 mr-1" />Isteklo</Badge>
      case 'CANCELLED':
        return <Badge variant="outline" className="text-gray-600 border-gray-600"><XCircle className="h-3 w-3 mr-1" />Otkazano</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'LAWYER':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PARALEGAL':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'ACCOUNTANT':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'VIEWER':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Učitavanje...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Upravljanje članovima tima
            </div>
            <div className="flex gap-2">
              <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Pozovi člana
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Pozovi novog člana tima</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="invite-email">Email adresa</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="korisnik@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="invite-role">Uloga</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LAWYER">Odvjetnik</SelectItem>
                          <SelectItem value="PARALEGAL">Pravni pomoćnik</SelectItem>
                          <SelectItem value="ACCOUNTANT">Računovođa</SelectItem>
                          <SelectItem value="VIEWER">Preglednik</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-600 mt-1">
                        {getRoleDescription(inviteRole as any)}
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteModalOpen(false)}>
                      Odustani
                    </Button>
                    <Button onClick={handleSendInvitation}>
                      Pošalji pozivnicu
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={createUserModalOpen} onOpenChange={setCreateUserModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Kreiraj korisnika
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Kreiraj novog korisnika</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="create-firstname">Ime</Label>
                        <Input
                          id="create-firstname"
                          value={createFirstName}
                          onChange={(e) => setCreateFirstName(e.target.value)}
                          placeholder="Ime"
                        />
                      </div>
                      <div>
                        <Label htmlFor="create-lastname">Prezime</Label>
                        <Input
                          id="create-lastname"
                          value={createLastName}
                          onChange={(e) => setCreateLastName(e.target.value)}
                          placeholder="Prezime"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="create-email">Email adresa</Label>
                      <Input
                        id="create-email"
                        type="email"
                        value={createEmail}
                        onChange={(e) => setCreateEmail(e.target.value)}
                        placeholder="korisnik@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-password">Lozinka</Label>
                      <Input
                        id="create-password"
                        type="password"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        placeholder="Lozinka"
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-role">Uloga</Label>
                      <Select value={createRole} onValueChange={setCreateRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LAWYER">Odvjetnik</SelectItem>
                          <SelectItem value="PARALEGAL">Pravni pomoćnik</SelectItem>
                          <SelectItem value="ACCOUNTANT">Računovođa</SelectItem>
                          <SelectItem value="VIEWER">Preglednik</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-600 mt-1">
                        {getRoleDescription(createRole as any)}
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateUserModalOpen(false)}>
                      Odustani
                    </Button>
                    <Button onClick={handleCreateUser}>
                      Kreiraj korisnika
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">
                Članovi tima ({teamMembers.length})
              </TabsTrigger>
              <TabsTrigger value="invitations">
                Pozivnice ({invitations.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="members" className="space-y-4">
              {teamMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nema članova tima</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {member.firstName?.[0]}{member.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                          <p className="text-xs text-gray-500">
                            Posljednja prijava: {member.lastLoginAt 
                              ? new Date(member.lastLoginAt).toLocaleDateString('hr-HR')
                              : 'Nikad'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {getRoleDisplayName(member.role as any)}
                        </Badge>
                        {member.isActive ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />Aktivan
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            <XCircle className="h-3 w-3 mr-1" />Neaktivan
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivateUser(member.id)}
                          disabled={member.id === userRole} // Prevent self-deactivation
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="invitations" className="space-y-4">
              {invitations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nema aktivnih pozivnica</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            <Mail className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <p className="text-sm text-gray-600">
                            Pozvao: {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Poslano: {new Date(invitation.createdAt).toLocaleDateString('hr-HR')}
                            {invitation.expiresAt && (
                              <span> • Istječe: {new Date(invitation.expiresAt).toLocaleDateString('hr-HR')}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(invitation.role)}>
                          {getRoleDisplayName(invitation.role as any)}
                        </Badge>
                        {getStatusBadge(invitation.status)}
                        {invitation.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvitation(invitation.id)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelInvitation(invitation.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
