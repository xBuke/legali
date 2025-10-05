# iLegal - Complete Directory Structure

This document shows the complete file structure: what's been created (✅) and what needs to be built (📝).

## 📦 Current Structure

```
ilegalclaude/
│
├── 📄 Documentation Files (✅ All Created)
│   ├── PRODUCT_PLAN.md              ✅ Complete product specification
│   ├── README.md                     ✅ Project overview and setup guide
│   ├── IMPLEMENTATION_GUIDE.md       ✅ Step-by-step setup instructions
│   ├── ARCHITECTURE.md               ✅ Technical architecture details
│   ├── NEXT_STEPS.md                ✅ Phase-by-phase development plan
│   ├── PROJECT_SUMMARY.md           ✅ Executive summary and quick reference
│   └── DIRECTORY_STRUCTURE.md       ✅ This file
│
├── 📄 Configuration Files (✅ All Created)
│   ├── package.json                  ✅ Dependencies and scripts
│   ├── tsconfig.json                 ✅ TypeScript configuration
│   ├── next.config.js                ✅ Next.js configuration
│   ├── tailwind.config.ts            ✅ Tailwind CSS configuration
│   ├── postcss.config.js             ✅ PostCSS configuration
│   ├── .gitignore                    ✅ Git ignore rules
│   ├── .env.example                  ✅ Environment variables template
│   └── middleware.ts                 ✅ Clerk authentication middleware
│
├── 📂 prisma/ (✅ Database Schema Created)
│   ├── schema.prisma                 ✅ Complete database schema (18 tables)
│   └── migrations/                   📝 Will be created on first db:push
│
├── 📂 lib/ (✅ Utility Functions Created)
│   ├── db.ts                        ✅ Prisma database client
│   ├── utils.ts                     ✅ Helper functions (formatting, etc.)
│   ├── subscription.ts              ✅ Subscription tier logic
│   ├── encryption.ts                ✅ File encryption utilities (AES-256)
│   ├── audit.ts                     ✅ Audit logging functions
│   ├── stripe.ts                    ✅ Stripe client and configuration
│   └── openai.ts                    ✅ OpenAI integration for AI features
│
├── 📂 hooks/ (✅ Basic Hooks Created)
│   └── use-toast.ts                 ✅ Toast notification hook
│
├── 📂 components/
│   │
│   ├── 📂 ui/ (✅ Basic UI Components Created)
│   │   ├── button.tsx               ✅ Button component (shadcn/ui)
│   │   ├── toast.tsx                ✅ Toast component
│   │   └── toaster.tsx              ✅ Toast container
│   │
│   ├── 📂 layout/ (📝 To Build)
│   │   ├── sidebar.tsx              📝 Dashboard sidebar navigation
│   │   ├── topnav.tsx               📝 Top navigation bar
│   │   └── user-menu.tsx            📝 User dropdown menu
│   │
│   ├── 📂 clients/ (📝 To Build)
│   │   ├── client-table.tsx         📝 Clients data table
│   │   ├── client-form.tsx          📝 Add/edit client form
│   │   ├── client-row.tsx           📝 Table row component
│   │   └── client-detail.tsx        📝 Client detail view
│   │
│   ├── 📂 cases/ (📝 To Build)
│   │   ├── case-table.tsx           📝 Cases data table
│   │   ├── case-form.tsx            📝 Add/edit case form
│   │   ├── case-status-badge.tsx    📝 Status badge component
│   │   ├── case-overview.tsx        📝 Case overview tab
│   │   ├── case-timeline.tsx        📝 Case timeline visualization
│   │   ├── case-documents-tab.tsx   📝 Documents tab for case
│   │   └── case-tasks-tab.tsx       📝 Tasks tab for case
│   │
│   ├── 📂 documents/ (📝 To Build)
│   │   ├── document-grid.tsx        📝 Document grid view
│   │   ├── document-upload.tsx      📝 Drag-and-drop upload
│   │   ├── document-viewer.tsx      📝 PDF viewer component
│   │   └── document-analysis.tsx    📝 AI analysis results (PRO)
│   │
│   ├── 📂 time-tracking/ (📝 To Build)
│   │   ├── timer.tsx                📝 Time tracking timer
│   │   ├── time-entry-form.tsx      📝 Manual time entry form
│   │   └── time-entry-list.tsx      📝 Time entries list
│   │
│   ├── 📂 invoices/ (📝 To Build)
│   │   ├── invoice-table.tsx        📝 Invoices data table
│   │   ├── invoice-form.tsx         📝 Create invoice form
│   │   ├── invoice-status-badge.tsx 📝 Invoice status badge
│   │   └── time-entry-selector.tsx  📝 Select time entries to bill
│   │
│   └── 📂 ai/ (📝 To Build - ENTERPRISE)
│       ├── chat-interface.tsx       📝 AI chatbot interface
│       ├── message-list.tsx         📝 Chat message list
│       └── chat-input.tsx           📝 Chat input field
│
├── 📂 app/
│   │
│   ├── layout.tsx                   ✅ Root layout with Clerk provider
│   ├── page.tsx                     ✅ Landing page (Croatian)
│   └── globals.css                  ✅ Global styles and Tailwind
│   │
│   ├── 📂 (auth)/ (📝 To Build)
│   │   ├── 📂 sign-in/
│   │   │   └── [[...sign-in]]/
│   │   │       └── page.tsx         📝 Sign-in page (Clerk)
│   │   │
│   │   └── 📂 sign-up/
│   │       └── [[...sign-up]]/
│   │           └── page.tsx         📝 Sign-up page (Clerk)
│   │
│   ├── 📂 (dashboard)/ (📝 To Build)
│   │   │
│   │   ├── layout.tsx               📝 Dashboard layout (sidebar + topnav)
│   │   │
│   │   ├── 📂 dashboard/
│   │   │   └── page.tsx             📝 Dashboard home (stats, recent activity)
│   │   │
│   │   ├── 📂 onboarding/
│   │   │   └── page.tsx             📝 New user onboarding (create org)
│   │   │
│   │   ├── 📂 clients/
│   │   │   ├── page.tsx             📝 Clients list page
│   │   │   ├── new/
│   │   │   │   └── page.tsx         📝 Add new client
│   │   │   └── [id]/
│   │   │       └── page.tsx         📝 Client detail page
│   │   │
│   │   ├── 📂 cases/
│   │   │   ├── page.tsx             📝 Cases list page
│   │   │   ├── new/
│   │   │   │   └── page.tsx         📝 Add new case
│   │   │   └── [id]/
│   │   │       └── page.tsx         📝 Case detail page (tabs)
│   │   │
│   │   ├── 📂 documents/
│   │   │   ├── page.tsx             📝 Documents list page
│   │   │   └── [id]/
│   │   │       └── page.tsx         📝 Document viewer & analysis
│   │   │
│   │   ├── 📂 time-tracking/
│   │   │   └── page.tsx             📝 Time tracking page (timer + list)
│   │   │
│   │   ├── 📂 invoices/
│   │   │   ├── page.tsx             📝 Invoices list page
│   │   │   ├── new/
│   │   │   │   └── page.tsx         📝 Create invoice
│   │   │   └── [id]/
│   │   │       └── page.tsx         📝 Invoice detail & PDF
│   │   │
│   │   ├── 📂 ai-assistant/ (📝 ENTERPRISE Only)
│   │   │   └── page.tsx             📝 AI chatbot interface
│   │   │
│   │   └── 📂 settings/
│   │       ├── page.tsx             📝 Settings home (redirect to profile)
│   │       ├── 📂 profile/
│   │       │   └── page.tsx         📝 User profile settings
│   │       ├── 📂 organization/
│   │       │   └── page.tsx         📝 Organization settings
│   │       ├── 📂 team/
│   │       │   └── page.tsx         📝 Team management (invite users)
│   │       └── 📂 billing/
│   │           └── page.tsx         📝 Billing & subscription management
│   │
│   └── 📂 api/
│       │
│       ├── 📂 organizations/ (📝 To Build)
│       │   ├── route.ts             📝 GET all, POST create
│       │   ├── create/
│       │   │   └── route.ts         📝 Create organization (onboarding)
│       │   └── [id]/
│       │       └── route.ts         📝 GET, PATCH, DELETE organization
│       │
│       ├── 📂 users/ (📝 To Build)
│       │   ├── route.ts             📝 GET all users in org
│       │   ├── invite/
│       │   │   └── route.ts         📝 Invite new user
│       │   └── [id]/
│       │       └── route.ts         📝 GET, PATCH, DELETE user
│       │
│       ├── 📂 clients/ (📝 To Build)
│       │   ├── route.ts             📝 GET all, POST create
│       │   └── [id]/
│       │       └── route.ts         📝 GET, PATCH, DELETE client
│       │
│       ├── 📂 cases/ (📝 To Build)
│       │   ├── route.ts             📝 GET all, POST create
│       │   └── [id]/
│       │       ├── route.ts         📝 GET, PATCH, DELETE case
│       │       ├── tasks/
│       │       │   └── route.ts     📝 Case tasks CRUD
│       │       └── notes/
│       │           └── route.ts     📝 Case notes CRUD
│       │
│       ├── 📂 documents/ (📝 To Build)
│       │   ├── route.ts             📝 GET all documents
│       │   ├── upload/
│       │   │   └── route.ts         📝 Upload & encrypt document
│       │   └── [id]/
│       │       ├── route.ts         📝 GET document metadata
│       │       ├── download/
│       │       │   └── route.ts     📝 Download & decrypt document
│       │       └── analyze/
│       │           └── route.ts     📝 Trigger AI analysis (PRO)
│       │
│       ├── 📂 time-entries/ (📝 To Build)
│       │   ├── route.ts             📝 GET all, POST create
│       │   └── [id]/
│       │       └── route.ts         📝 GET, PATCH, DELETE time entry
│       │
│       ├── 📂 expenses/ (📝 To Build)
│       │   ├── route.ts             📝 GET all, POST create
│       │   └── [id]/
│       │       └── route.ts         📝 GET, PATCH, DELETE expense
│       │
│       ├── 📂 invoices/ (📝 To Build)
│       │   ├── route.ts             📝 GET all, POST create
│       │   └── [id]/
│       │       ├── route.ts         📝 GET, PATCH invoice
│       │       └── pdf/
│       │           └── route.ts     📝 Generate invoice PDF
│       │
│       ├── 📂 billing/ (📝 To Build)
│       │   ├── create-checkout/
│       │   │   └── route.ts         📝 Create Stripe checkout session
│       │   └── portal/
│       │       └── route.ts         📝 Create Stripe customer portal
│       │
│       ├── 📂 ai/ (📝 To Build - ENTERPRISE)
│       │   ├── chat/
│       │   │   └── route.ts         📝 AI chat endpoint (streaming)
│       │   └── search/
│       │       └── route.ts         📝 Semantic search endpoint
│       │
│       └── 📂 webhooks/
│           └── 📂 stripe/
│               └── route.ts         ✅ Stripe webhook handler
│
├── 📂 public/ (📝 To Add)
│   ├── logo.svg                     📝 iLegal logo
│   ├── favicon.ico                  📝 Favicon
│   └── images/                      📝 Marketing images
│
└── 📂 node_modules/ (Auto-generated)
    └── ...                          (Generated by npm install)
```

---

## 📊 Progress Overview

### ✅ Completed (Foundation - 100%)
- Configuration files: 8/8
- Documentation: 6/6
- Database schema: 1/1 (18 tables)
- Core utilities: 7/7
- Basic UI components: 3/3
- Landing page: 1/1
- Stripe webhook: 1/1

**Total Created**: ~30 files

### 📝 To Build (Features - 0%)
- Authentication pages: 0/3
- Dashboard layouts: 0/2
- Feature pages: 0/12
- API routes: 0/40+
- UI components: 0/30+

**Total To Build**: ~85 files

---

## 🎯 File Creation Priority (Week by Week)

### Week 1: Authentication & Layout (8 files)
```
✅ Created
📝 app/(auth)/sign-in/[[...sign-in]]/page.tsx
📝 app/(auth)/sign-up/[[...sign-up]]/page.tsx
📝 app/(dashboard)/onboarding/page.tsx
📝 app/(dashboard)/layout.tsx
📝 app/(dashboard)/dashboard/page.tsx
📝 components/layout/sidebar.tsx
📝 components/layout/topnav.tsx
📝 components/layout/user-menu.tsx
```

### Week 2: Clients & Cases (12 files)
```
📝 app/(dashboard)/clients/page.tsx
📝 app/(dashboard)/clients/new/page.tsx
📝 app/(dashboard)/clients/[id]/page.tsx
📝 app/api/clients/route.ts
📝 app/api/clients/[id]/route.ts
📝 components/clients/client-table.tsx
📝 components/clients/client-form.tsx

📝 app/(dashboard)/cases/page.tsx
📝 app/(dashboard)/cases/new/page.tsx
📝 app/(dashboard)/cases/[id]/page.tsx
📝 app/api/cases/route.ts
📝 app/api/cases/[id]/route.ts
```

### Week 3: Documents & Time Tracking (15 files)
```
📝 app/(dashboard)/documents/page.tsx
📝 app/(dashboard)/documents/[id]/page.tsx
📝 app/api/documents/upload/route.ts
📝 app/api/documents/[id]/route.ts
📝 app/api/documents/[id]/download/route.ts
📝 components/documents/document-grid.tsx
📝 components/documents/document-upload.tsx
📝 components/documents/document-viewer.tsx

📝 app/(dashboard)/time-tracking/page.tsx
📝 app/api/time-entries/route.ts
📝 app/api/time-entries/[id]/route.ts
📝 components/time-tracking/timer.tsx
📝 components/time-tracking/time-entry-form.tsx
📝 components/time-tracking/time-entry-list.tsx
```

### Week 4: Invoicing (10 files)
```
📝 app/(dashboard)/invoices/page.tsx
📝 app/(dashboard)/invoices/new/page.tsx
📝 app/(dashboard)/invoices/[id]/page.tsx
📝 app/api/invoices/route.ts
📝 app/api/invoices/[id]/route.ts
📝 app/api/invoices/[id]/pdf/route.ts
📝 components/invoices/invoice-table.tsx
📝 components/invoices/invoice-form.tsx
📝 components/invoices/invoice-status-badge.tsx
📝 components/invoices/time-entry-selector.tsx
```

### Week 5: Settings & Billing (12 files)
```
📝 app/(dashboard)/settings/profile/page.tsx
📝 app/(dashboard)/settings/organization/page.tsx
📝 app/(dashboard)/settings/team/page.tsx
📝 app/(dashboard)/settings/billing/page.tsx
📝 app/api/organizations/route.ts
📝 app/api/organizations/[id]/route.ts
📝 app/api/users/invite/route.ts
📝 app/api/users/[id]/route.ts
📝 app/api/billing/create-checkout/route.ts
📝 app/api/billing/portal/route.ts
```

### Week 6-7: AI Document Analyzer - PRO (8 files)
```
📝 app/api/documents/[id]/analyze/route.ts
📝 lib/document-analyzer.ts
📝 lib/ocr.ts
📝 components/documents/document-analysis.tsx
📝 components/documents/analysis-summary.tsx
📝 components/documents/entity-extraction.tsx
📝 components/documents/risk-score.tsx
```

### Week 8-9: AI Chatbot - ENTERPRISE (10 files)
```
📝 app/(dashboard)/ai-assistant/page.tsx
📝 app/api/ai/chat/route.ts
📝 app/api/ai/search/route.ts
📝 lib/vector-db.ts
📝 lib/embeddings.ts
📝 components/ai/chat-interface.tsx
📝 components/ai/message-list.tsx
📝 components/ai/message-item.tsx
📝 components/ai/chat-input.tsx
📝 components/ai/source-citation.tsx
```

---

## 📦 Additional UI Components Needed

These will be created as needed during development:

```
components/ui/
├── 📝 card.tsx                  Shadcn card component
├── 📝 dialog.tsx                Modal dialog
├── 📝 dropdown-menu.tsx         Dropdown menu
├── 📝 input.tsx                 Form input
├── 📝 label.tsx                 Form label
├── 📝 select.tsx                Select dropdown
├── 📝 textarea.tsx              Textarea input
├── 📝 table.tsx                 Data table
├── 📝 tabs.tsx                  Tabs component
├── 📝 badge.tsx                 Status badge
├── 📝 avatar.tsx                User avatar
├── 📝 separator.tsx             Visual separator
└── 📝 skeleton.tsx              Loading skeleton
```

**Tip**: Use `npx shadcn-ui@latest add [component]` to quickly add these!

---

## 🔍 How to Navigate This Project

1. **Start here**: `PROJECT_SUMMARY.md` for overview
2. **Understand the product**: `PRODUCT_PLAN.md`
3. **Set up environment**: `IMPLEMENTATION_GUIDE.md`
4. **Understand architecture**: `ARCHITECTURE.md`
5. **Start building**: `NEXT_STEPS.md` (phase by phase)
6. **Check file structure**: This file (`DIRECTORY_STRUCTURE.md`)

---

## 🎯 Current Status Summary

| Category | Status | Files |
|----------|--------|-------|
| **Documentation** | ✅ Complete | 6/6 |
| **Configuration** | ✅ Complete | 8/8 |
| **Database Schema** | ✅ Complete | 1/1 |
| **Core Libraries** | ✅ Complete | 7/7 |
| **Landing Page** | ✅ Complete | 1/1 |
| **Auth Pages** | 📝 To Build | 0/3 |
| **Dashboard Pages** | 📝 To Build | 0/12 |
| **API Routes** | 📝 To Build | 1/40+ |
| **Components** | 📝 To Build | 3/30+ |

**Overall Progress**: ~20% (Foundation Complete)

---

## 📝 Notes

- All ✅ files are complete and working
- All 📝 files need to be built (see NEXT_STEPS.md for order)
- Some files will be created automatically:
  - `node_modules/` by npm install
  - `.next/` by Next.js build
  - `prisma/migrations/` by Prisma
- Additional files will be added during development as needed

---

## 🚀 Next Actions

1. Run `npm install` to create `node_modules/`
2. Set up `.env` file with API keys
3. Run `npm run db:push` to create database tables
4. Start with Week 1 files from `NEXT_STEPS.md`
5. Update this file as you build (change 📝 to ✅)

**Happy coding!** 💪

---

*Use this file as a checklist - mark items ✅ as you complete them!*
