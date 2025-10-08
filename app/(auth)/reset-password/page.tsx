'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordReset, setPasswordReset] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      toast({
        title: 'Greška',
        description: 'Neispravan link za resetiranje lozinke',
        variant: 'destructive',
      })
      router.push('/forgot-password')
      return
    }

    // Verify token
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          toast({
            title: 'Greška',
            description: data.error || 'Neispravan ili istekao token',
            variant: 'destructive',
          })
          router.push('/forgot-password')
          return
        }

        setTokenValid(true)
        setUserEmail(data.user.email)
      } catch (error) {
        console.error('Token verification error:', error)
        toast({
          title: 'Greška',
          description: 'Došlo je do greške pri provjeri tokena',
          variant: 'destructive',
        })
        router.push('/forgot-password')
      } finally {
        setVerifying(false)
      }
    }

    verifyToken()
  }, [token, router, toast])

  const validatePassword = (password: string): boolean => {
    return password.length >= 8
  }

  const passwordsMatch = (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!password) {
      toast({
        title: 'Greška',
        description: 'Molimo unesite novu lozinku',
        variant: 'destructive',
      })
      return
    }

    if (!validatePassword(password)) {
      toast({
        title: 'Greška',
        description: 'Lozinka mora imati najmanje 8 znakova',
        variant: 'destructive',
      })
      return
    }

    if (!passwordsMatch(password, confirmPassword)) {
      toast({
        title: 'Greška',
        description: 'Lozinke se ne podudaraju',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'Greška',
          description: data.error || 'Došlo je do greške pri resetiranju lozinke',
          variant: 'destructive',
        })
        return
      }

      setPasswordReset(true)
      toast({
        title: 'Uspjeh!',
        description: 'Lozinka je uspješno resetirana',
      })

    } catch (error) {
      console.error('Reset password error:', error)
      toast({
        title: 'Greška',
        description: 'Došlo je do neočekivane greške. Molimo pokušajte ponovno.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Scale className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div>
              <CardTitle className="text-2xl">Provjera tokena...</CardTitle>
              <CardDescription>
                Molimo pričekajte dok provjeravamo valjanost linka
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!tokenValid) {
    return null // Will redirect to forgot-password
  }

  if (passwordReset) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-2xl text-green-600">Lozinka resetirana!</CardTitle>
              <CardDescription>
                Vaša lozinka je uspješno promijenjena
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Sada se možete prijaviti s novom lozinkom.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/sign-in" className="w-full">
              <Button className="w-full">
                Prijavite se
              </Button>
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
            <CardTitle className="text-2xl">Nova lozinka</CardTitle>
            <CardDescription>
              Unesite novu lozinku za račun {userEmail}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova lozinka</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Lozinka mora imati najmanje 8 znakova
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potvrdite lozinku</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {confirmPassword && !passwordsMatch(password, confirmPassword) && (
                <p className="text-xs text-red-500">
                  Lozinke se ne podudaraju
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !password || !confirmPassword || !passwordsMatch(password, confirmPassword)}
              className="w-full"
            >
              {loading ? 'Resetiranje...' : 'Resetiraj lozinku'}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Link 
            href="/sign-in" 
            className="text-sm text-muted-foreground hover:text-primary text-center w-full"
          >
            Povratak na prijavu
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
