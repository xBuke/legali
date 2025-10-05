import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Scale, FileText, Users, Clock, Shield, Brain, Zap } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="border-b">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">LegalFlow</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/sign-in">
              <Button variant="ghost">Prijava</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Započni besplatno</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Moderno upravljanje pravnom praksom
          <br />
          <span className="text-primary">za hrvatske odvjetnike</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Sve što vam treba za upravljanje predmetima, klijentima, dokumentima i naplatom - 
          na jednom mjestu. S AI podrškom i vrhunskom sigurnošću.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="text-lg">
              Počni besplatno probno razdoblje
            </Button>
          </Link>
          <Link href="#pricing">
            <Button size="lg" variant="outline" className="text-lg">
              Pogledaj cijene
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          14 dana besplatno. Bez kartice. Otkaži bilo kada.
        </p>
      </section>

      {/* Features */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Sve funkcije na jednom mjestu
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<FileText className="h-10 w-10 text-primary" />}
              title="Upravljanje predmetima"
              description="Pratite sve predmete, rokove, i ročišta na jednom mjestu"
            />
            <FeatureCard
              icon={<Users className="h-10 w-10 text-primary" />}
              title="Klijenti i kontakti"
              description="Organizirajte klijente i cijelu povijest komunikacije"
            />
            <FeatureCard
              icon={<Clock className="h-10 w-10 text-primary" />}
              title="Evidencija vremena"
              description="Automatski pratite sate i generirajte račune"
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-primary" />}
              title="Vrhunska sigurnost"
              description="End-to-end enkripcija i zaštita odvjetničke tajne"
            />
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">
              AI asistent za pravnike
            </h2>
            <p className="text-lg text-muted-foreground">
              Umjetna inteligencija koja vam štedi vrijeme i olakšava svakodnevni rad
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <AIFeatureCard
              title="Analiza dokumenata"
              description="Automatska ekstrakcija teksta, sažimanje i analiza rizika"
              tier="PRO"
            />
            <AIFeatureCard
              title="Prepoznavanje klauzula"
              description="Identificiranje važnih klauzula i datuma u ugovorima"
              tier="PRO"
            />
            <AIFeatureCard
              title="AI chat asistent"
              description="Pomoć u istraživanju, pisanju i strategiji predmeta"
              tier="ENTERPRISE"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Cijene prilagođene vašim potrebama
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Bez skrivenih troškova. Platite samo ono što koristite.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard
              name="Basic"
              price="€147"
              description="Za solo odvjetnike i male urede"
              features={[
                'Do 3 korisnika',
                'Neograničeni predmeti',
                '50GB pohrane',
                'Evidencija vremena',
                'Izrada računa',
                'Klijentski portal',
                'E-mail podrška',
              ]}
              popular={false}
            />
            <PricingCard
              name="Pro"
              price="€297"
              description="Za rastuće odvjetničke urede"
              features={[
                'Do 6 korisnika',
                'Sve iz Basic paketa',
                'AI analiza dokumenata',
                'OCR skeniranih dokumenata',
                'Sažimanje i analiza rizika',
                '200GB pohrane',
                'Napredno izvještavanje',
                'Prioritetna podrška',
              ]}
              popular={true}
            />
            <PricingCard
              name="Enterprise"
              price="€497"
              description="Za etablirane odvjetničke tvrtke"
              features={[
                'Neograničeno korisnika',
                'Sve iz Pro paketa',
                'AI chat asistent',
                'Pravna istraživanja AI',
                'Neograničena pohrana',
                'SSO integracija',
                'White-label opcije',
                'Dedicated podrška 24/7',
              ]}
              popular={false}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Spremni za početak?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Pridružite se stotinama hrvatskih odvjetnika koji koriste LegalFlow
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="text-lg">
              Započni besplatno probno razdoblje
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Scale className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">LegalFlow</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Moderno upravljanje pravnom praksom za hrvatske odvjetnike.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Proizvod</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Funkcije</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">Cijene</Link></li>
                <li><Link href="#" className="hover:text-foreground">Dokumentacija</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Tvrtka</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">O nama</Link></li>
                <li><Link href="#" className="hover:text-foreground">Kontakt</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Pravno</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Uvjeti korištenja</Link></li>
                <li><Link href="#" className="hover:text-foreground">Pravila privatnosti</Link></li>
                <li><Link href="#" className="hover:text-foreground">GDPR</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 LegalFlow. Sva prava pridržana.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-background rounded-lg border">
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function AIFeatureCard({ title, description, tier }: { title: string; description: string; tier: string }) {
  return (
    <div className="p-6 bg-background rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <Zap className="h-8 w-8 text-primary" />
        <span className="text-xs font-semibold text-primary">{tier}</span>
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function PricingCard({
  name,
  price,
  description,
  features,
  popular,
}: {
  name: string
  price: string
  description: string
  features: string[]
  popular: boolean
}) {
  return (
    <div className={`p-8 rounded-lg border bg-background ${popular ? 'border-primary shadow-lg scale-105' : ''}`}>
      {popular && (
        <div className="text-xs font-semibold text-primary mb-4">NAJPOPULARNIJE</div>
      )}
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-muted-foreground">/mjesec</span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      <Link href="/sign-up">
        <Button className="w-full mb-6" variant={popular ? 'default' : 'outline'}>
          Započni
        </Button>
      </Link>
      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start text-sm">
            <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
