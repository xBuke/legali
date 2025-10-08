'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!email) {
      toast({
        title: 'Greška',
        description: 'Molimo unesite email adresu',
        variant: 'destructive',
      })
      return
    }

    if (!validateEmail(email)) {
      toast({
        title: 'Greška',
        description: 'Molimo unesite valjanu email adresu',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'Greška',
          description: data.error || 'Došlo je do greške',
          variant: 'destructive',
        })
        return
      }

      setEmailSent(true)
      toast({
        title: 'Email poslan',
        description: 'Ako postoji račun s tim emailom, poslat ćemo vam link za resetiranje lozinke',
      })

    } catch (error) {
      console.error('Forgot password error:', error)
      toast({
        title: 'Greška',
        description: 'Došlo je do neočekivane greške. Molimo pokušajte ponovno.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Scale className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-2xl text-green-600">Email poslan!</CardTitle>
              <CardDescription>
                Provjerite svoju email adresu
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Ako postoji račun s email adresom <strong>{email}</strong>, poslat ćemo vam link za resetiranje lozinke.
            </p>
            <p className="text-sm text-muted-foreground">
              Provjerite i spam folder ako ne vidite email.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              variant="outline"
              onClick={() => {
                setEmailSent(false)
                setEmail('')
              }}
              className="w-full"
            >
              Pošaljite novi email
            </Button>
            <Link 
              href="/sign-in" 
              className="text-sm text-muted-foreground hover:text-primary text-center flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Povratak na prijavu
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Scale className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Zaboravili ste lozinku?</CardTitle>
            <CardDescription>
              Unesite svoju email adresu i poslat ćemo vam link za resetiranje
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email adresa</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas.email@primjer.hr"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Slanje...' : 'Pošaljite link za resetiranje'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Link 
            href="/sign-in" 
            className="text-sm text-muted-foreground hover:text-primary text-center flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Povratak na prijavu
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
