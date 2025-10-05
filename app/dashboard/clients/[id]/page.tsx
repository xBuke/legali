'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, Building2, Mail, Phone, MapPin, FileText, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

type Client = {
  id: string
  clientType: string
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  status: string
  createdAt: string
  cases?: any[]
  documents?: any[]
  invoices?: any[]
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchClient()
  }, [params.id])

  async function fetchClient() {
    try {
      const response = await fetch(`/api/clients/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data)
      } else if (response.status === 404) {
        toast({
          title: 'Greška',
          description: 'Klijent nije pronađen',
          variant: 'destructive',
        })
        router.push('/dashboard/clients')
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Nije moguće dohvatiti podatke o klijentu',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Učitavanje...</p>
      </div>
    )
  }

  if (!client) {
    return null
  }

  const clientName = client.clientType === 'COMPANY'
    ? client.companyName || 'Bez naziva'
    : `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Bez imena'

  const statusColors = {
    ACTIVE: 'bg-green-500/10 text-green-500',
    INACTIVE: 'bg-gray-500/10 text-gray-500',
    POTENTIAL: 'bg-blue-500/10 text-blue-500',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/clients">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{clientName}</h1>
            <Badge className={statusColors[client.status as keyof typeof statusColors]}>
              {client.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {client.clientType === 'COMPANY' ? 'Tvrtka' : 'Pojedinac'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kontakt informacije</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                </div>
              </div>
            )}
            {client.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Telefon</p>
                  <p className="text-sm text-muted-foreground">{client.phone}</p>
                </div>
              </div>
            )}
            {(client.address || client.city) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Adresa</p>
                  <p className="text-sm text-muted-foreground">
                    {client.address}
                    {client.city && <><br />{client.postalCode} {client.city}</>}
                    {client.country && <><br />{client.country}</>}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cases */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Predmeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{client.cases?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Ukupno predmeta</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dokumenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{client.documents?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Uploadanih dokumenata</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Nedavni predmeti</CardTitle>
          <CardDescription>
            Pregled predmeta za ovog klijenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!client.cases || client.cases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Još nema predmeta za ovog klijenta</p>
            </div>
          ) : (
            <p className="text-muted-foreground">Prikaz predmeta će biti dostupan uskoro</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
