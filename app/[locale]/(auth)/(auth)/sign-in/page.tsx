'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useTranslations } from 'next-intl'
import { 
  Scale, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowRight,
  Github,
  Chrome
} from 'lucide-react'

interface FormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
}

export default function SignInPage() {
  const t = useTranslations()
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
      newErrors.email = t('errors.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('errors.emailInvalid')
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('errors.passwordRequired')
    } else if (formData.password.length < 6) {
      newErrors.password = t('errors.passwordMinLength')
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
        title: t('errors.validation'),
        description: t('errors.checkInput'),
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
        let errorMessage = t('errors.signInFailed')
        
        if (result.error.includes('Email i lozinka su obavezni')) {
          errorMessage = t('errors.emailPasswordRequired')
        } else if (result.error.includes('Neispravni podaci za prijavu')) {
          errorMessage = t('errors.invalidCredentials')
        } else if (result.error.includes('Vaš račun je deaktiviran')) {
          errorMessage = t('errors.accountDeactivated')
        } else if (result.error.includes('2fa-verified')) {
          // 2FA verification is not currently implemented
          errorMessage = t('errors.twoFactorUnavailable')
        }

        toast({
          title: t('errors.signInFailed'),
          description: errorMessage,
          variant: 'destructive',
        })
      } else if (result?.ok) {
        toast({
          title: t('auth.signInSuccess'),
          description: t('auth.welcomeBackMessage'),
        })
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: t('errors.error'),
        description: t('errors.serverError'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Scale className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{t('auth.welcomeBack')}</h1>
            <p className="text-muted-foreground">
              {t('auth.signInToAccount')}
            </p>
          </div>
        </div>

        <Card className="card-hover">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">{t('auth.signIn')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.enterCredentials')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t('auth.email')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder={t('auth.emailPlaceholder')}
                      required
                      autoComplete="email"
                      className={`pl-10 ${errors.email ? 'border-destructive focus:border-destructive' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    {t('auth.password')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className={`pl-10 pr-10 ${errors.password ? 'border-destructive focus:border-destructive' : ''}`}
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
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    {t('auth.signingIn')}
                  </>
                ) : (
                  <>
                    {t('auth.signIn')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t('auth.orContinueWith')}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" disabled>
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <Link 
                  href="/sign-up" 
                  className="text-primary hover:underline font-medium"
                >
                  {t('auth.signUp')}
                </Link>
              </p>
              <Link 
                href="/forgot-password" 
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
