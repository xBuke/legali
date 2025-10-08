'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useTranslations } from 'next-intl'
import { 
  Scale, 
  Eye, 
  EyeOff, 
  Check, 
  X
} from 'lucide-react'

interface FormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

interface PasswordStrength {
  score: number
  feedback: string[]
}

export default function SignUpPage() {
  const t = useTranslations()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  // Password strength calculation
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = []
    let score = 0

    if (password.length >= 8) {
      score += 1
    } else {
      feedback.push(t('auth.passwordMin8Chars'))
    }

    if (/[a-z]/.test(password)) {
      score += 1
    } else {
      feedback.push(t('auth.passwordLowercase'))
    }

    if (/[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push(t('auth.passwordUppercase'))
    }

    if (/[0-9]/.test(password)) {
      score += 1
    } else {
      feedback.push(t('auth.passwordNumbers'))
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1
    } else {
      feedback.push(t('auth.passwordSpecialChars'))
    }

    return { score, feedback }
  }

  const passwordStrength = calculatePasswordStrength(formData.password)

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return 'text-red-500'
    if (score <= 3) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getPasswordStrengthText = (score: number) => {
    if (score <= 2) return t('auth.passwordWeak')
    if (score <= 3) return t('auth.passwordMedium')
    return t('auth.passwordStrong')
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = t('errors.nameRequired')
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('errors.nameMinLength')
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = t('errors.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('errors.emailInvalid')
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('errors.passwordRequired')
    } else if (formData.password.length < 8) {
      newErrors.password = t('errors.passwordMinLength')
    } else if (passwordStrength.score < 3) {
      newErrors.password = t('errors.passwordTooWeak')
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('errors.confirmPasswordRequired')
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('errors.passwordsDoNotMatch')
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'Greška pri registraciji',
          description: data.error || 'Došlo je do greške pri registraciji',
          variant: 'destructive',
        })
        return
      }

      // Automatically sign in after successful registration
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (signInResult?.error) {
        toast({
          title: 'Registracija uspješna',
          description: 'Račun je kreiran, ali došlo je do greške pri prijavi. Molimo prijavite se ručno.',
          variant: 'destructive',
        })
        router.push('/sign-in?registered=true')
      } else if (signInResult?.ok) {
        toast({
          title: 'Dobrodošli!',
          description: 'Vaš račun je uspješno kreiran i prijavljeni ste.',
        })
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Registration error:', error)
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
            <CardTitle className="text-2xl">Kreirajte svoj račun</CardTitle>
            <CardDescription>
              Započnite s iLegal-om danas - 14 dana besplatno
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ime i prezime</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ivan Horvat"
                required
                autoComplete="name"
                className={errors.name ? 'border-red-500 focus:border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

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
                  autoComplete="new-password"
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
              
              {/* Password strength indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score <= 2
                            ? 'bg-red-500'
                            : passwordStrength.score <= 3
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${getPasswordStrengthColor(passwordStrength.score)}`}>
                      {getPasswordStrengthText(passwordStrength.score)}
                    </span>
                  </div>
                  
                  {passwordStrength.feedback.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <p className="mb-1">Lozinka treba sadržavati:</p>
                      <ul className="space-y-1">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index} className="flex items-center space-x-1">
                            <X className="h-3 w-3 text-red-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {passwordStrength.score >= 3 && (
                    <div className="flex items-center space-x-1 text-xs text-green-600">
                      <Check className="h-3 w-3" />
                      <span>Lozinka je dovoljno jaka</span>
                    </div>
                  )}
                </div>
              )}
              
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potvrdite lozinku</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className={errors.confirmPassword ? 'border-red-500 focus:border-red-500 pr-10' : 'pr-10'}
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
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Kreiranje računa...' : 'Kreiraj račun'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Kreiranjem računa pristajete na naše uvjete korištenja i politiku privatnosti
            </p>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Već imate račun?{' '}
            <Link href="/sign-in" className="text-primary hover:underline font-medium">
              Prijavite se
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
