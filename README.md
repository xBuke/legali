# iLegal - Legal Practice Management SaaS

A comprehensive legal practice management platform built for Croatian and Balkan region law firms. Manage cases, clients, documents, and billing with AI-powered features and enterprise-grade security.

## 🚀 Features

### Core Features (All Tiers)
- ⚖️ **Case Management** - Track cases, deadlines, and court dates
- 👥 **Client Management** - Organize clients and communication history
- 📄 **Document Management** - Secure, encrypted document storage with version control
- ⏱️ **Time Tracking** - Automated time tracking and hourly rate management
- 💰 **Billing & Invoicing** - Generate professional invoices with Croatian PDV (VAT)
- 🔒 **Security** - End-to-end encryption, 2FA, audit logging
- 👤 **Client Portal** - Secure portal for client document access

### PRO Tier Features
- 🤖 **AI Document Analyzer**
  - OCR for scanned documents
  - Automatic text extraction
  - Document summarization
  - Entity extraction (names, dates, amounts)
  - Risk assessment
  - Clause identification
- 📊 **Advanced Reporting** - Business intelligence and analytics
- 🔌 **API Access** - Integration capabilities

### ENTERPRISE Tier Features
- 💬 **AI Legal Assistant Chatbot**
  - Natural language case search
  - Legal research assistance (Croatian law)
  - Document drafting support
  - Strategic recommendations
- 🏢 **Enterprise Features**
  - Single Sign-On (SSO)
  - White-label options
  - Unlimited storage
  - Dedicated support
  - Custom integrations

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Authentication**: Clerk
- **Payments**: Stripe
- **AI**: OpenAI GPT-4
- **Storage**: Vercel Blob Storage
- **UI**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Clerk account (for authentication)
- Stripe account (for payments)
- OpenAI API key (for AI features)

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ilegal.git
cd ilegal
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `OPENAI_API_KEY` - OpenAI API key
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- `ENCRYPTION_KEY` - 32-byte encryption key (generate with: `openssl rand -base64 32`)

4. **Set up the database**
```bash
npm run db:push
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗂️ Project Structure

```
ilegal/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main application pages
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                   # Utility functions
│   ├── db.ts             # Prisma client
│   ├── stripe.ts         # Stripe integration
│   ├── openai.ts         # OpenAI integration
│   ├── encryption.ts     # File encryption
│   └── ...
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## 💳 Subscription Tiers

| Feature | Basic | Pro | Enterprise |
|---------|-------|-----|------------|
| **Price** | €147/month | €297/month | €497/month |
| **Users** | Up to 3 | Up to 6 | Unlimited |
| **Storage** | 50GB | 200GB | Unlimited |
| **Cases & Clients** | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| **Time Tracking** | ✅ | ✅ | ✅ |
| **Invoicing** | ✅ | ✅ | ✅ |
| **Client Portal** | ✅ | ✅ | ✅ |
| **2FA & Encryption** | ✅ | ✅ | ✅ |
| **AI Document Analyzer** | ❌ | ✅ | ✅ |
| **AI Chatbot Assistant** | ❌ | ❌ | ✅ |
| **API Access** | ❌ | ✅ Basic | ✅ Advanced |
| **SSO** | ❌ | ❌ | ✅ |
| **Support** | Email (48h) | Priority (24h) | Dedicated (4h) |

## 🔐 Security Features

- **End-to-End Encryption** - All documents encrypted with AES-256
- **Row-Level Security** - Database-level multi-tenancy isolation
- **Two-Factor Authentication** - Mandatory 2FA for all users
- **Audit Logging** - Complete activity trail for compliance
- **GDPR Compliance** - Full data protection and privacy controls
- **Attorney-Client Privilege Protection** - Secure data handling
- **Regular Backups** - Automated daily backups with point-in-time recovery

## 🌍 Localization

Primary language: Croatian (hr-HR)
Additional languages: English, with support for other Balkan languages

## 📱 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
```bash
git push origin main
```

2. **Import to Vercel**
- Go to [vercel.com](https://vercel.com)
- Import your repository
- Add environment variables
- Deploy

3. **Set up Vercel Postgres**
```bash
vercel postgres create
```

4. **Configure webhooks**
Set your Stripe webhook URL to: `https://yourdomain.com/api/webhooks/stripe`

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# View Prisma Studio
npm run db:studio
```

## 📖 Documentation

Full documentation is available in the `/docs` folder (to be created).

For API documentation, see: `/docs/api.md` (to be created)

## 🤝 Contributing

This is a private project. For any questions or suggestions, please contact the development team.

## 📄 License

Proprietary - All rights reserved.

## 🆘 Support

- **Email**: support@ilegal.app
- **Documentation**: [docs.ilegal.app](https://docs.ilegal.app) (to be created)
- **Status Page**: [status.ilegal.app](https://status.ilegal.app) (to be created)

## 🗺️ Roadmap

### Phase 1 - MVP (Weeks 1-5) ✅
- [x] Basic setup and infrastructure
- [x] User authentication
- [x] Case management
- [x] Client management
- [x] Document management
- [x] Time tracking
- [x] Basic invoicing

### Phase 2 - PRO Tier (Weeks 6-8)
- [ ] AI Document Analyzer
- [ ] OCR integration
- [ ] Advanced reporting
- [ ] Email integration
- [ ] API development

### Phase 3 - ENTERPRISE Tier (Weeks 9-11)
- [ ] AI Chatbot
- [ ] Legal research integration
- [ ] SSO implementation
- [ ] White-label features

### Phase 4 - Launch (Weeks 12-13)
- [ ] Payment integration completion
- [ ] Croatian localization
- [ ] Marketing website
- [ ] Beta testing
- [ ] Production deployment

## 💰 Payment Processing

We support multiple payment processors:

1. **Stripe** (Primary) - Full EU support, Croatian Kuna/Euro
2. **Lemon Squeezy** - Merchant of Record, handles VAT automatically
3. **Paddle** - Alternative Merchant of Record for B2B focus

See `PRODUCT_PLAN.md` for detailed payment processor comparison.

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:push         # Push schema to database
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed database (when implemented)

# Linting
npm run lint            # Run ESLint
```

## ⚖️ Legal Compliance

- ✅ GDPR compliant
- ✅ Croatian data protection laws
- ✅ Attorney-client privilege protection
- ✅ Professional liability insurance recommended
- ✅ Terms of Service included
- ✅ Privacy Policy included

---

**Built with ❤️ for Croatian lawyers**

For more details, see `PRODUCT_PLAN.md`
