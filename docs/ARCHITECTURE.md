# iLegal - System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Next.js   │  │    Clerk     │  │   Stripe.js     │   │
│  │   Frontend  │  │   Auth UI    │  │   Checkout      │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS/TLS 1.3
┌────────────────────────────┴────────────────────────────────┐
│              VERCEL EDGE NETWORK (CDN)                      │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                   NEXT.JS APP (Vercel)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  App Router (RSC - React Server Components)         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │  │
│  │  │   Pages    │  │   Layouts  │  │  Components  │  │  │
│  │  └────────────┘  └────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes (Serverless Functions)                  │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │  │
│  │  │  /api/cases│  │/api/clients│  │/api/documents│  │  │
│  │  └────────────┘  └────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Business Logic Layer                               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │  │
│  │  │   Prisma   │  │ Encryption │  │  Audit Logs  │  │  │
│  │  └────────────┘  └────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬──────────────┬──────────────┬─────────┘
                     │              │              │
        ┌────────────┴───┐  ┌───────┴──────┐  ┌───┴────────┐
        │   PostgreSQL   │  │Vercel Blob   │  │  External  │
        │   (Vercel)     │  │   Storage    │  │  Services  │
        │  ┌──────────┐  │  │  (S3-like)   │  │┌──────────┐│
        │  │Row-Level │  │  │              │  ││  Clerk   ││
        │  │ Security │  │  │  Encrypted   │  ││  Stripe  ││
        │  │   (RLS)  │  │  │  Documents   │  ││  OpenAI  ││
        │  └──────────┘  │  │              │  │└──────────┘│
        └────────────────┘  └──────────────┘  └────────────┘
```

---

## 🗄️ Database Architecture

### Multi-Tenancy Model: Row-Level Security (RLS)

All data is isolated by `organizationId`. Every query automatically filters by the current user's organization.

```sql
-- Example: Prisma automatically adds this filter
SELECT * FROM cases 
WHERE organizationId = 'user-org-id'
```

### Data Relationships

```
Organization (1)
├── Users (N)
├── Clients (N)
│   └── Cases (N)
│       ├── Documents (N)
│       ├── TimeEntries (N)
│       ├── Tasks (N)
│       └── Notes (N)
├── Documents (N) - Can be standalone or linked to Case/Client
├── Invoices (N)
│   ├── TimeEntries (N)
│   └── Expenses (N)
└── AuditLogs (N)
```

### Indexes Strategy

```prisma
// High-frequency queries are indexed:
@@index([organizationId])           // All tables
@@index([caseId])                   // Documents, TimeEntries, Tasks
@@index([clientId])                 // Cases, Documents, Invoices
@@index([status])                   // Cases, Invoices
@@index([createdAt])                // AuditLogs
@@index([clerkUserId])              // Users
```

---

## 🔐 Security Architecture

### 1. Authentication Flow (Clerk)

```
User → Sign In → Clerk Auth → JWT Token → Next.js Middleware
                    ↓
              Session Cookie
                    ↓
            Protected Routes
```

### 2. Document Encryption

```
Upload Flow:
File → Browser → API Route → Encrypt (AES-256) → Vercel Blob
                                ↓
                           Store IV in DB
                           
Download Flow:
Request → API → Get File from Blob → Decrypt with IV → User
```

**Encryption Details:**
- Algorithm: AES-256-CBC
- Unique IV per file
- Master key stored in environment
- Per-organization keys (future enhancement)

### 3. Authorization Layers

```
Layer 1: Next.js Middleware
  ├── Check if user is authenticated (Clerk)
  └── Redirect to sign-in if not

Layer 2: API Route Guards
  ├── Verify user belongs to organization
  └── Check subscription tier for features

Layer 3: Database (Row-Level Security)
  ├── Prisma queries auto-filter by organizationId
  └── Prevent cross-organization data access

Layer 4: Component-Level
  ├── Hide features based on subscription tier
  └── Role-based UI rendering
```

### 4. Audit Logging

Every action is logged:
```typescript
{
  action: "UPDATE" | "CREATE" | "DELETE" | "VIEW",
  entity: "Case" | "Document" | "Client",
  entityId: "cuid",
  userId: "clerk_user_id",
  organizationId: "org_cuid",
  ipAddress: "1.2.3.4",
  userAgent: "Mozilla/...",
  changes: { before: {...}, after: {...} }
}
```

---

## 🔄 Data Flow Patterns

### Example: Creating a Case

```
1. User fills form in browser
   └─> POST /api/cases

2. API Route Handler
   ├─> Verify authentication (Clerk)
   ├─> Get organizationId from user
   ├─> Validate input (Zod schema)
   ├─> Check subscription limits
   └─> Prisma: db.case.create()

3. Database
   ├─> Insert case with organizationId
   ├─> Trigger audit log
   └─> Return created case

4. Response
   ├─> API returns case data
   └─> UI updates (React Query cache)
```

### Example: Document Upload & Analysis

```
1. User uploads PDF
   └─> POST /api/documents/upload

2. Server
   ├─> Validate file (type, size)
   ├─> Check storage limits
   ├─> Encrypt file buffer
   ├─> Upload to Vercel Blob
   └─> Save metadata to DB

3. Background Job (if PRO/ENTERPRISE)
   ├─> Extract text (OCR if needed)
   ├─> Send to OpenAI for analysis
   ├─> Update document with analysis results
   └─> Notify user (optional)

4. User views document
   └─> GET /api/documents/[id]
   ├─> Fetch from Blob
   ├─> Decrypt
   └─> Stream to client
```

---

## 🤖 AI Integration Architecture

### Document Analysis Pipeline (PRO)

```
PDF/DOCX → Text Extraction → Chunking → OpenAI GPT-4
                                          ├─> Summary
                                          ├─> Entities
                                          ├─> Key Clauses
                                          └─> Risk Score
```

### AI Chatbot (ENTERPRISE)

```
User Query → Vector Search (Pinecone/Supabase Vector)
                ├─> Find relevant documents
                └─> Find relevant case notes
                     ↓
              Build context prompt
                     ↓
              OpenAI GPT-4 with context
                     ↓
              Stream response to user
```

**Vector Database Structure:**
```
{
  id: "doc_123_chunk_5",
  vector: [0.123, 0.456, ...], // 1536 dimensions (OpenAI)
  metadata: {
    documentId: "doc_123",
    caseId: "case_456",
    organizationId: "org_789",
    content: "This contract states...",
    type: "contract_clause"
  }
}
```

---

## 💳 Payment Processing Architecture

### Subscription Flow (Stripe)

```
1. User selects plan
   └─> Frontend: Create Checkout Session

2. Stripe Checkout
   ├─> User enters payment details
   ├─> 3D Secure authentication (if required)
   └─> Payment processed

3. Stripe Webhook → /api/webhooks/stripe
   ├─> Verify webhook signature
   ├─> Update organization subscription
   └─> Send confirmation email

4. User redirected back
   └─> Show success & activate features
```

### Subscription States

```
Trial (14 days)
  └─> Active (after payment)
        ├─> Past Due (payment failed, 7 days grace)
        │     └─> Cancelled (after grace period)
        └─> Cancelled (user cancelled)
```

---

## 📊 Performance Optimization

### 1. Caching Strategy

```
Edge (Vercel CDN)
  └─> Static assets (images, CSS, JS)

Server (Next.js)
  └─> React Server Components
        └─> Database queries cached per request

Client (React Query)
  └─> API responses cached
        ├─> Stale time: 5 minutes
        └─> Revalidate on focus
```

### 2. Database Optimization

- **Connection Pooling**: Prisma manages connection pool
- **Indexes**: All foreign keys and frequent queries
- **Pagination**: All list queries use cursor-based pagination
- **Soft Deletes**: Archive instead of delete for performance

### 3. File Storage Optimization

- **Compression**: Compress before encryption
- **CDN**: Serve files via Vercel Edge Network
- **Lazy Loading**: Load documents on-demand
- **Thumbnails**: Generate previews for PDFs

---

## 🌐 Deployment Architecture (Vercel)

```
GitHub Repo
    ↓ (git push)
Vercel CI/CD
    ├─> Build Next.js app
    ├─> Run Prisma migrations
    ├─> Deploy to Edge Network
    └─> Deploy Serverless Functions

Production URLs:
├─> ilegal.app (main app)
├─> api.ilegal.app (API only - optional)
└─> docs.ilegal.app (documentation - optional)
```

### Environment Configuration

```
Development:
  - Local PostgreSQL or Vercel Postgres (dev)
  - Clerk development instance
  - Stripe test mode
  
Staging (optional):
  - Vercel Postgres (staging)
  - Clerk staging instance
  - Stripe test mode
  
Production:
  - Vercel Postgres (production)
  - Clerk production instance
  - Stripe live mode
  - Custom domain
  - SSL/TLS via Vercel
```

---

## 🔧 Tech Stack Decisions & Rationale

| Technology | Why? | Alternatives Considered |
|------------|------|------------------------|
| **Next.js 14** | Best-in-class React framework, App Router, RSC | Remix, Astro |
| **TypeScript** | Type safety for legal data is critical | JavaScript |
| **Prisma** | Best DX, great migrations, type-safe | Drizzle, raw SQL |
| **PostgreSQL** | ACID compliance, JSON support, proven | MongoDB, MySQL |
| **Clerk** | Best auth UX, built-in 2FA, org management | NextAuth, Auth0 |
| **Stripe** | Industry standard, excellent EU support | Paddle, Lemon Squeezy |
| **Vercel** | Zero-config deployment, Edge Network | AWS, Railway |
| **Tailwind CSS** | Rapid development, consistent design | CSS Modules, Styled Components |
| **shadcn/ui** | High-quality components, customizable | Material UI, Chakra UI |
| **OpenAI** | Best LLM for legal document analysis | Anthropic Claude, Cohere |

---

## 📈 Scalability Considerations

### Current Architecture (MVP - 1,000 users)
- Vercel Serverless: Auto-scales
- PostgreSQL: Vercel Postgres Pro (good for 10k organizations)
- Blob Storage: 1TB included

### Growth Phase (10,000 users)
- Upgrade to Vercel Enterprise
- Consider dedicated PostgreSQL (Supabase Pro, AWS RDS)
- Implement Redis caching (Vercel KV)
- Add background job queue (Inngest, Trigger.dev)

### Scale Phase (100,000+ users)
- Microservices architecture (if needed)
- Separate database per region
- Read replicas for database
- CDN for global document access
- Event-driven architecture

---

## 🛡️ Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups (Vercel Postgres)
- **Documents**: Versioned in Blob storage (immutable)
- **Point-in-Time Recovery**: 7 days (extendable to 30)

### Incident Response Plan
1. **Detection**: Automated monitoring (Vercel, Sentry)
2. **Assessment**: Determine severity (P0-P3)
3. **Mitigation**: Roll back deployment or apply hotfix
4. **Communication**: Status page, email to affected users
5. **Post-Mortem**: Document and improve

---

## 📚 API Documentation Structure

```
/api/v1
  ├── /auth
  │   ├── POST /register
  │   ├── POST /login
  │   └── POST /logout
  ├── /organizations
  │   ├── GET /organizations
  │   ├── POST /organizations
  │   └── GET /organizations/:id
  ├── /cases
  │   ├── GET /cases
  │   ├── POST /cases
  │   ├── GET /cases/:id
  │   ├── PATCH /cases/:id
  │   └── DELETE /cases/:id
  ├── /clients
  │   ├── GET /clients
  │   ├── POST /clients
  │   ├── GET /clients/:id
  │   └── PATCH /clients/:id
  ├── /documents
  │   ├── POST /documents/upload
  │   ├── GET /documents/:id
  │   ├── GET /documents/:id/download
  │   └── POST /documents/:id/analyze (PRO+)
  ├── /time-entries
  │   ├── GET /time-entries
  │   ├── POST /time-entries
  │   └── PATCH /time-entries/:id
  ├── /invoices
  │   ├── GET /invoices
  │   ├── POST /invoices
  │   └── GET /invoices/:id/pdf
  └── /ai (ENTERPRISE)
      ├── POST /ai/chat
      └── POST /ai/search
```

---

## 🎯 Next Steps for Implementation

1. **Week 1-2**: Core CRUD operations (Cases, Clients, Documents)
2. **Week 3-4**: Time tracking and basic invoicing
3. **Week 5**: Authentication flow and organization setup
4. **Week 6-8**: AI document analysis (PRO tier)
5. **Week 9-11**: AI chatbot (ENTERPRISE tier)
6. **Week 12-13**: Payment integration and launch prep

---

This architecture is designed to be:
- ✅ **Secure** - Multiple layers of security
- ✅ **Scalable** - Serverless, can handle growth
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Cost-Effective** - Pay-as-you-grow pricing
- ✅ **Compliant** - GDPR-ready, audit logging

**Built for Croatian lawyers, ready to scale globally** 🚀
