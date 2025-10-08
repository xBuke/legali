import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useTranslations } from 'next-intl'
import { 
  Scale, 
  Users, 
  Briefcase, 
  FileText, 
  Clock, 
  Receipt,
  Shield,
  Check,
  Star,
  ArrowRight,
  Zap,
  Globe,
  Lock,
  BarChart3,
  Calendar,
  MessageSquare,
  Download,
  Upload,
  Bell,
  Settings
} from 'lucide-react'

export default function HomePage() {
  const t = useTranslations()

  const features = [
    {
      icon: Users,
      title: t('homepage.features.clients.title'),
      description: t('homepage.features.clients.description')
    },
    {
      icon: Briefcase,
      title: t('homepage.features.cases.title'),
      description: t('homepage.features.cases.description')
    },
    {
      icon: FileText,
      title: t('homepage.features.documents.title'),
      description: t('homepage.features.documents.description')
    },
    {
      icon: Clock,
      title: t('homepage.features.timeTracking.title'),
      description: t('homepage.features.timeTracking.description')
    },
    {
      icon: Receipt,
      title: t('homepage.features.invoicing.title'),
      description: t('homepage.features.invoicing.description')
    },
    {
      icon: BarChart3,
      title: t('homepage.features.analytics.title'),
      description: t('homepage.features.analytics.description')
    }
  ]

  const pricingPlans = [
    {
      name: t('homepage.pricing.starter.name'),
      price: t('homepage.pricing.starter.price'),
      description: t('homepage.pricing.starter.description'),
      features: [
        t('homepage.pricing.starter.features.clients'),
        t('homepage.pricing.starter.features.cases'),
        t('homepage.pricing.starter.features.documents'),
        t('homepage.pricing.starter.features.support')
      ],
      popular: false
    },
    {
      name: t('homepage.pricing.professional.name'),
      price: t('homepage.pricing.professional.price'),
      description: t('homepage.pricing.professional.description'),
      features: [
        t('homepage.pricing.professional.features.everything'),
        t('homepage.pricing.professional.features.timeTracking'),
        t('homepage.pricing.professional.features.invoicing'),
        t('homepage.pricing.professional.features.analytics'),
        t('homepage.pricing.professional.features.priority')
      ],
      popular: true
    },
    {
      name: t('homepage.pricing.enterprise.name'),
      price: t('homepage.pricing.enterprise.price'),
      description: t('homepage.pricing.enterprise.description'),
      features: [
        t('homepage.pricing.enterprise.features.everything'),
        t('homepage.pricing.enterprise.features.team'),
        t('homepage.pricing.enterprise.features.custom'),
        t('homepage.pricing.enterprise.features.integrations'),
        t('homepage.pricing.enterprise.features.dedicated')
      ],
      popular: false
    }
  ]

  const testimonials = [
    {
      name: t('homepage.testimonials.john.name'),
      role: t('homepage.testimonials.john.role'),
      content: t('homepage.testimonials.john.content'),
      rating: 5
    },
    {
      name: t('homepage.testimonials.sarah.name'),
      role: t('homepage.testimonials.sarah.role'),
      content: t('homepage.testimonials.sarah.content'),
      rating: 5
    },
    {
      name: t('homepage.testimonials.michael.name'),
      role: t('homepage.testimonials.michael.role'),
      content: t('homepage.testimonials.michael.content'),
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">iLegal</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/sign-in">
                <Button variant="ghost">{t('auth.signIn')}</Button>
              </Link>
              <Link href="/sign-up">
                <Button>{t('auth.signUp')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <Badge variant="secondary" className="mb-4">
              <Zap className="h-3 w-3 mr-1" />
              {t('homepage.hero.badge')}
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              {t('homepage.hero.title')}
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('homepage.hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  {t('homepage.getStarted')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sign-in">
                  {t('homepage.signIn')}
                </Link>
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                {t('homepage.trial')}
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                {t('homepage.noCard')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {t('homepage.features.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('homepage.features.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="card-hover">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {t('homepage.pricing.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('homepage.pricing.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`card-hover relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    {t('homepage.pricing.popular')}
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                  </div>
                  <CardDescription className="mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                    {t('homepage.pricing.getStarted')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {t('homepage.testimonials.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('homepage.testimonials.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground mb-4">
                    &ldquo;{testimonial.content}&rdquo;
                  </blockquote>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {t('homepage.cta.title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('homepage.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  {t('homepage.getStarted')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sign-in">
                  {t('homepage.signIn')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Scale className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">iLegal</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('homepage.footer.description')}
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">{t('homepage.footer.product')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">{t('homepage.footer.features')}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{t('homepage.footer.pricing')}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{t('homepage.footer.integrations')}</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">{t('homepage.footer.company')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">{t('homepage.footer.about')}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{t('homepage.footer.blog')}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{t('homepage.footer.careers')}</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">{t('homepage.footer.support')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">{t('homepage.footer.help')}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{t('homepage.footer.contact')}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{t('homepage.footer.status')}</Link></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 iLegal. {t('homepage.footer.rights')}
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground">{t('homepage.footer.privacy')}</Link>
              <Link href="#" className="hover:text-foreground">{t('homepage.footer.terms')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
