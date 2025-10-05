# iLegal - Next Steps

This document outlines exactly what to build next to get to a working MVP.

## ✅ What's Complete

- [x] Project structure and configuration
- [x] Database schema (Prisma)
- [x] Authentication setup (Clerk)
- [x] Payment integration structure (Stripe)
- [x] AI integration setup (OpenAI)
- [x] Security utilities (encryption, audit logging)
- [x] Basic UI components (Button, Toast)
- [x] Landing page
- [x] Comprehensive documentation

## 🚧 What to Build Next (Priority Order)

### Phase 1: Core Setup & Authentication (Week 1)

#### 1.1 Environment Setup
- [ ] Set up Clerk account and get API keys
- [ ] Set up Stripe account (test mode)
- [ ] Set up OpenAI API key
- [ ] Set up Vercel Postgres database
- [ ] Test database connection
- [ ] Run `npm run db:push` to create tables

#### 1.2 Sign-Up Flow
Create: `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
```typescript
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  )
}
```

#### 1.3 Sign-In Flow
Create: `app/(auth)/sign-in/[[...sign-in]]/page.tsx`
```typescript
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  )
}
```

#### 1.4 Onboarding Flow
Create: `app/(dashboard)/onboarding/page.tsx`
- Collect organization details
- Create Organization record in database
- Set up initial user as ADMIN
- Redirect to dashboard

**Files to create:**
- `app/(dashboard)/onboarding/page.tsx`
- `app/api/organizations/create/route.ts`

---

### Phase 2: Dashboard Layout (Week 1)

#### 2.1 Dashboard Layout
Create: `app/(dashboard)/layout.tsx`

Features needed:
- Top navigation bar with logo
- User menu (profile, settings, logout)
- Sidebar navigation
  - Dashboard
  - Cases
  - Clients
  - Documents
  - Time Tracking
  - Invoices
  - Settings
- Organization switcher (for future multi-org support)

**Components to create:**
- `components/layout/sidebar.tsx`
- `components/layout/topnav.tsx`
- `components/layout/user-menu.tsx`

#### 2.2 Dashboard Home
Create: `app/(dashboard)/dashboard/page.tsx`

Show:
- Welcome message
- Quick stats (# of cases, clients, hours tracked)
- Recent cases
- Upcoming deadlines
- Recent activity

---

### Phase 3: Client Management (Week 2)

#### 3.1 Clients List Page
Create: `app/(dashboard)/clients/page.tsx`

Features:
- Data table with all clients
- Search and filter
- Add new client button
- Client status badges
- Actions menu (edit, view, delete)

**Components needed:**
- `components/clients/client-table.tsx`
- `components/clients/client-row.tsx`
- `components/ui/data-table.tsx` (reusable)

#### 3.2 Add/Edit Client Form
Create: `components/clients/client-form.tsx`

Fields:
- Client type (Individual/Company)
- Personal info (for individuals)
- Company info (for companies)
- Contact details
- Address
- Notes

**API routes needed:**
- `app/api/clients/route.ts` (GET all, POST new)
- `app/api/clients/[id]/route.ts` (GET, PATCH, DELETE)

#### 3.3 Client Detail Page
Create: `app/(dashboard)/clients/[id]/page.tsx`

Show:
- Client information
- Associated cases
- Documents
- Invoices
- Activity history

---

### Phase 4: Case Management (Week 2)

#### 4.1 Cases List Page
Create: `app/(dashboard)/cases/page.tsx`

Features:
- Data table with all cases
- Filter by status, client, assigned user
- Sort by date, priority
- Status indicators
- Quick actions

**Components:**
- `components/cases/case-table.tsx`
- `components/cases/case-status-badge.tsx`

#### 4.2 Add/Edit Case Form
Create: `components/cases/case-form.tsx`

Fields:
- Case number (auto-generated or custom)
- Title and description
- Client selection
- Case type and status
- Priority
- Court information
- Dates (opened, next hearing, statute of limitations)
- Assigned lawyer

**API routes:**
- `app/api/cases/route.ts`
- `app/api/cases/[id]/route.ts`

#### 4.3 Case Detail Page
Create: `app/(dashboard)/cases/[id]/page.tsx`

Tabs:
- **Overview**: Case details, timeline
- **Documents**: All case documents
- **Time Entries**: Billable hours
- **Tasks**: To-do list for this case
- **Notes**: Internal notes
- **Activity**: Audit log

**Components:**
- `components/cases/case-overview.tsx`
- `components/cases/case-timeline.tsx`
- `components/cases/case-documents-tab.tsx`
- `components/cases/case-tasks-tab.tsx`

---

### Phase 5: Document Management (Week 3)

#### 5.1 Documents Page
Create: `app/(dashboard)/documents/page.tsx`

Features:
- Grid or list view
- Filter by case, client, type
- Search by filename
- Upload button (drag & drop)
- Bulk actions

**Components:**
- `components/documents/document-grid.tsx`
- `components/documents/document-upload.tsx`

#### 5.2 Document Upload
Create: `app/api/documents/upload/route.ts`

Flow:
1. Validate file (type, size)
2. Check storage limit
3. Encrypt file
4. Upload to Vercel Blob
5. Save metadata to database
6. Create audit log

**Libraries needed:**
- `react-dropzone` for file upload UI
- `@vercel/blob` for storage

#### 5.3 Document Viewer
Create: `app/(dashboard)/documents/[id]/page.tsx`

Features:
- PDF viewer (use `react-pdf` or `pdf.js`)
- Document metadata
- Download button
- Version history
- Share with client button

**API routes:**
- `app/api/documents/[id]/download/route.ts`
- `app/api/documents/[id]/decrypt/route.ts`

---

### Phase 6: Time Tracking (Week 3)

#### 6.1 Time Entries Page
Create: `app/(dashboard)/time-tracking/page.tsx`

Features:
- Timer (start/stop)
- Manual time entry form
- List of recent entries
- Filter by date range, case, user
- Total hours and amount

**Components:**
- `components/time-tracking/timer.tsx`
- `components/time-tracking/time-entry-form.tsx`
- `components/time-tracking/time-entry-list.tsx`

#### 6.2 Time Entry API
Create: `app/api/time-entries/route.ts`

Fields:
- Date
- Duration (minutes)
- Description
- Case (optional)
- Hourly rate (from user settings)
- Billable/non-billable

---

### Phase 7: Invoicing (Week 4)

#### 7.1 Invoices List
Create: `app/(dashboard)/invoices/page.tsx`

Features:
- List all invoices
- Filter by status, client, date
- Create new invoice button
- Quick view of total outstanding

**Components:**
- `components/invoices/invoice-table.tsx`
- `components/invoices/invoice-status-badge.tsx`

#### 7.2 Create Invoice
Create: `app/(dashboard)/invoices/new/page.tsx`

Flow:
1. Select client
2. Select time entries to bill
3. Select expenses to bill
4. Add line items manually (optional)
5. Set due date
6. Add notes
7. Generate PDF

**Components:**
- `components/invoices/invoice-form.tsx`
- `components/invoices/time-entry-selector.tsx`

#### 7.3 Invoice PDF Generation
Create: `app/api/invoices/[id]/pdf/route.ts`

Use: `pdf-lib` or `@react-pdf/renderer`

Include:
- Organization letterhead
- Client details
- Invoice number and dates
- Line items (time entries, expenses)
- Subtotal, tax (PDV 25%), total
- Payment instructions
- Terms and conditions

---

### Phase 8: Settings (Week 4-5)

#### 8.1 Organization Settings
Create: `app/(dashboard)/settings/organization/page.tsx`

- Organization name, logo
- Contact information
- Tax ID (OIB)
- Invoice settings (default terms, payment instructions)

#### 8.2 User Settings
Create: `app/(dashboard)/settings/profile/page.tsx`

- Personal information
- Hourly rate
- Notification preferences
- 2FA settings (via Clerk)

#### 8.3 Team Management
Create: `app/(dashboard)/settings/team/page.tsx`

- List of users
- Invite new users (send email)
- Edit user roles
- Deactivate users
- Check: Don't exceed subscription limit

**API routes:**
- `app/api/users/invite/route.ts`
- `app/api/users/[id]/route.ts`

#### 8.4 Billing Settings
Create: `app/(dashboard)/settings/billing/page.tsx`

- Current subscription plan
- Usage statistics (users, storage)
- Upgrade/downgrade buttons
- Billing history
- Payment method (via Stripe Customer Portal)

**API routes:**
- `app/api/billing/portal/route.ts` (create Stripe portal session)
- `app/api/billing/checkout/route.ts` (create checkout for new subscription)

---

### Phase 9: Subscription & Payments (Week 5)

#### 9.1 Subscription Upgrade Flow
1. User clicks "Upgrade to Pro"
2. Create Stripe Checkout Session
3. Redirect to Stripe
4. User completes payment
5. Stripe webhook updates database
6. User redirected back with success message

**Files to create:**
- `app/api/billing/create-checkout/route.ts`
- `app/api/webhooks/stripe/route.ts` (already created, test it)

#### 9.2 Feature Gates
Create: `lib/feature-gates.ts`

```typescript
export function canAccessFeature(
  tier: SubscriptionTier, 
  feature: string
): boolean {
  // Check if user's subscription includes feature
}

export function withFeatureGate(
  tier: SubscriptionTier, 
  feature: string, 
  component: React.ReactNode
) {
  // Wrap component to show only if feature is available
}
```

Use throughout app to show/hide PRO and ENTERPRISE features.

---

### Phase 10: AI Features - Document Analyzer (Week 6-7) [PRO]

#### 10.1 Document Analysis Trigger
When document is uploaded (PRO+ only):
1. Extract text from PDF
2. Send to OpenAI for analysis
3. Store results in database
4. Show analysis in document viewer

**Create:**
- `lib/document-analyzer.ts`
- `app/api/documents/[id]/analyze/route.ts`

#### 10.2 Analysis Results UI
Update: `app/(dashboard)/documents/[id]/page.tsx`

Show:
- Summary
- Extracted entities (dates, names, amounts)
- Key clauses
- Risk score with explanation
- Suggested actions

**Component:**
- `components/documents/document-analysis.tsx`

---

### Phase 11: AI Features - Chatbot (Week 8-9) [ENTERPRISE]

#### 11.1 Document Embeddings
When document is analyzed:
1. Chunk document text
2. Generate embeddings (OpenAI)
3. Store in vector database (Pinecone or Supabase Vector)

**Create:**
- `lib/vector-db.ts`
- Background job to generate embeddings

#### 11.2 AI Chat Interface
Create: `app/(dashboard)/ai-assistant/page.tsx`

Features:
- Chat interface
- Conversation history
- Context from current case (optional)
- Streaming responses
- Source citations

**Components:**
- `components/ai/chat-interface.tsx`
- `components/ai/message-list.tsx`
- `components/ai/chat-input.tsx`

**API:**
- `app/api/ai/chat/route.ts` (streaming response)
- `app/api/ai/search/route.ts` (semantic search)

---

### Phase 12: Croatian Localization (Week 10)

#### 12.1 Translation Setup
Install: `next-intl` or `react-i18next`

Create translation files:
- `locales/hr/common.json`
- `locales/en/common.json`

#### 12.2 Translate All UI
- Landing page
- Dashboard
- Forms
- Error messages
- Email templates

---

### Phase 13: Testing & Polish (Week 11-12)

#### 13.1 Manual Testing
- [ ] Sign up flow
- [ ] Create organization
- [ ] Add clients
- [ ] Create cases
- [ ] Upload documents
- [ ] Track time
- [ ] Create invoice
- [ ] Subscription upgrade
- [ ] AI features (PRO/ENTERPRISE)

#### 13.2 Security Audit
- [ ] Test authentication bypass attempts
- [ ] Test cross-organization data access
- [ ] Verify all documents are encrypted
- [ ] Check audit logs are created
- [ ] Test 2FA enforcement

#### 13.3 Performance Optimization
- [ ] Add loading states
- [ ] Implement optimistic updates
- [ ] Add pagination to all lists
- [ ] Optimize database queries
- [ ] Compress images and assets

#### 13.4 Error Handling
- [ ] Add error boundaries
- [ ] User-friendly error messages
- [ ] Logging and monitoring (Sentry)
- [ ] Graceful fallbacks

---

### Phase 14: Launch Preparation (Week 13)

#### 14.1 Production Setup
- [ ] Set up production database
- [ ] Configure production Clerk instance
- [ ] Set up Stripe products (live mode)
- [ ] Configure custom domain
- [ ] Set up SSL certificate (automatic with Vercel)
- [ ] Configure email (Resend)

#### 14.2 Legal & Compliance
- [ ] Create Terms of Service
- [ ] Create Privacy Policy
- [ ] Create Cookie Policy
- [ ] Add GDPR consent banners
- [ ] Create Data Processing Agreement (DPA)
- [ ] Consult with Croatian lawyer

#### 14.3 Marketing Site
- [ ] Finalize landing page copy
- [ ] Add testimonials (from beta users)
- [ ] Create demo video
- [ ] Set up blog (optional)
- [ ] SEO optimization

#### 14.4 Launch!
- [ ] Soft launch to beta users
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Public launch
- [ ] Marketing push (LinkedIn, Croatian legal forums)

---

## 📝 Code Templates to Accelerate Development

### API Route Template
```typescript
// app/api/[entity]/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ 
    where: { clerkUserId: userId },
    include: { organization: true }
  })
  
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const items = await db.entity.findMany({
    where: { organizationId: user.organizationId }
  })

  return NextResponse.json(items)
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ 
    where: { clerkUserId: userId },
    include: { organization: true }
  })
  
  const data = await request.json()
  
  const item = await db.entity.create({
    data: { ...data, organizationId: user.organizationId }
  })

  await createAuditLog({
    action: 'CREATE',
    entity: 'Entity',
    entityId: item.id,
    userId: user.id,
    organizationId: user.organizationId,
  })

  return NextResponse.json(item)
}
```

### Data Table Component Template
```typescript
// components/[entity]/[entity]-table.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

export function EntityTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['entities'],
    queryFn: () => fetch('/api/entities').then(r => r.json())
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <table>
        {/* Table implementation */}
      </table>
    </div>
  )
}
```

---

## 🎯 Daily Development Checklist

Each day:
- [ ] Start with `npm run dev`
- [ ] Check for TypeScript errors
- [ ] Test in browser
- [ ] Commit working code to git
- [ ] Update this checklist
- [ ] Document any issues

---

## 🚀 You've Got This!

Start with Phase 1, work through systematically. Don't try to do everything at once.

**Pro Tips:**
1. Test each feature thoroughly before moving to the next
2. Commit to git frequently
3. Deploy to Vercel early and often
4. Get feedback from real lawyers as soon as possible
5. Focus on the happy path first, edge cases later

**Estimated time to MVP: 13 weeks (with focus and dedication)**

Good luck! 🎉
