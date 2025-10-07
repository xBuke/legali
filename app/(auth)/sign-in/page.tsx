'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
}

export default function SignInPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email je obavezan'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Molimo unesite valjanu email adresu'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Lozinka je obavezna'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Lozinka mora imati najmanje 6 znakova'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: 'Greška u validaciji',
        description: 'Molimo provjerite unesene podatke',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        // Handle specific error messages
        let errorMessage = 'Greška pri prijavi'
        
        if (result.error.includes('Email i lozinka su obavezni')) {
          errorMessage = 'Email i lozinka su obavezni'
        } else if (result.error.includes('Neispravni podaci za prijavu')) {
          errorMessage = 'Neispravni email ili lozinka'
        } else if (result.error.includes('Vaš račun je deaktiviran')) {
          errorMessage = 'Vaš račun je deaktiviran. Molimo kontaktirajte administratora'
        } else if (result.error.includes('2fa-verified')) {
          // Handle 2FA case - redirect to 2FA verification
          const params = new URLSearchParams({
            email: formData.email,
          })
          router.push(`/verify-2fa?${params.toString()}`)
          return
        }

        toast({
          title: 'Greška pri prijavi',
          description: errorMessage,
          variant: 'destructive',
        })
      } else if (result?.ok) {
        toast({
          title: 'Uspješna prijava',
          description: 'Dobrodošli nazad!',
        })
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: 'Greška',
        description: 'Došlo je do neočekivane greške. Molimo pokušajte ponovno.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Scale className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Dobrodošli nazad</CardTitle>
            <CardDescription>
              Prijavite se u svoj iLegal račun
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
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="vas.email@primjer.hr"
                required
                autoComplete="email"
                className={errors.email ? 'border-red-500 focus:border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Lozinka</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className={errors.password ? 'border-red-500 focus:border-red-500 pr-10' : 'pr-10'}
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
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Prijava...' : 'Prijavite se'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Nemate račun?{' '}
            <Link href="/sign-up" className="text-primary hover:underline font-medium">
              Registrirajte se
            </Link>
          </p>
          <Link 
            href="/forgot-password" 
            className="text-sm text-muted-foreground hover:text-primary text-center"
          >
            Zaboravili ste lozinku?
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
