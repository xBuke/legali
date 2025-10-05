'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Briefcase, FileText, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const { data: session } = useSession()

  const stats = [
    {
      name: 'Aktivni klijenti',
      value: '0',
      icon: Users,
      description: 'Trenutno aktivno',
    },
    {
      name: 'Otvoreni predmeti',
      value: '0',
      icon: Briefcase,
      description: 'U obradi',
    },
    {
      name: 'Dokumenti',
      value: '0',
      icon: FileText,
      description: 'Ukupno uploadano',
    },
    {
      name: 'Ovaj mjesec',
      value: '€0',
      icon: TrendingUp,
      description: 'Fakturirano',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Dobrodošli, {session?.user?.name?.split(' ')[0] || 'korisniče'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Evo pregleda vaše kancelarije
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Nedavne aktivnosti</CardTitle>
          <CardDescription>
            Ovdje će se prikazivati nedavne aktivnosti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Još nema aktivnosti</p>
            <p className="text-sm mt-2">
              Započnite dodavanjem klijenata i predmeta
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
