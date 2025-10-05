import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Scale } from 'lucide-react'

export default function HomePage() {
  // Client-side redirect will be handled by middleware

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-8 max-w-3xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Scale className="h-10 w-10 text-primary" />
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            LegalFlow
          </h1>
          <p className="text-xl text-muted-foreground">
            Sveobuhvatna platforma za upravljanje odvjetničkom praksom
          </p>
          <p className="text-lg">
            Upravljajte klijentima, predmetima, dokumentima i vremenom - sve na jednom mjestu
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/sign-up">
              Započnite besplatno
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/sign-in">
              Prijava
            </Link>
          </Button>
        </div>

        <div className="pt-8 text-sm text-muted-foreground">
          <p>✓ 14 dana besplatnog probnog razdoblja</p>
          <p>✓ Ne treba kreditna kartica</p>
        </div>
      </div>
    </div>
  )
}