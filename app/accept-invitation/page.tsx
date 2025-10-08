'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  UserPlus, 
  Mail, 
  Building, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react'
import { getRoleDisplayName, getRoleDescription } from '@/lib/permissions'
import { toast } from '@/hooks/use-toast'

interface InvitationDetails {
  email: string
  role: string
  organization: {
    name: string
  }
  invitedBy: {
    firstName: string
    lastName: string
  }
  expiresAt: string
}

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Neispravna pozivnica')
      setLoading(false)
      return
    }

    fetchInvitationDetails()
  }, [token, fetchInvitationDetails])

  const fetchInvitationDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/team/accept-invitation?token=${token}`)
      const data = await response.json()

      if (response.ok) {
        setInvitation(data.invitation)
      } else {
        setError(data.error)
      }
    } catch (error) {
      console.error('Error fetching invitation:', error)
      setError('Greška pri dohvaćanju pozivnice')
    } finally {
      setLoading(false)
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      setError('Neispravna pozivnica')
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Greška',
        description: 'Lozinke se ne podudaraju',
        variant: 'destructive'
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: 'Greška',
        description: 'Lozinka mora imati najmanje 8 znakova',
        variant: 'destructive'
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/team/accept-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          firstName,
          lastName,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Račun je uspješno kreiran! Možete se prijaviti.',
        })
        
        // Redirect to sign in page
        router.push('/sign-in?message=account-created')
      } else {
        setError(data.error)
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      setError('Greška pri kreiranju računa')
    } finally {
      setSubmitting(false)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Učitavanje pozivnice...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Greška
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Pozivnica nije pronađena'}
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                className="w-full"
              >
                Povratak na početnu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Pridružite se timu</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Kreirajte svoj račun da biste se pridružili organizaciji
          </p>
        </CardHeader>
        <CardContent>
          {/* Invitation Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{invitation.organization.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{invitation.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-500" />
              <Badge className={getRoleBadgeColor(invitation.role)}>
                {getRoleDisplayName(invitation.role as string)}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              Pozvao: {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
            </p>
            <p className="text-xs text-gray-500">
              Istječe: {new Date(invitation.expiresAt).toLocaleDateString('hr-HR')}
            </p>
          </div>

          {/* Role Description */}
          <div className="mb-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Uloga:</strong> {getRoleDescription(invitation.role as string)}
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Ime</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Vaše ime"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Prezime</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Vaše prezime"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Lozinka</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Najmanje 8 znakova"
                minLength={8}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Potvrdite lozinku</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Ponovite lozinku"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Kreiranje računa...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Kreiraj račun
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Klikom na &ldquo;Kreiraj račun&rdquo; prihvaćate uvjete korištenja i politiku privatnosti.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
