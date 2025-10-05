# iLegal - Week 4 Development Plan
## Phase 2: BASIC Tier Features - Billing & Polish

**Date**: December 19, 2024  
**Status**: 🚀 **READY TO START**  
**Previous Week**: Week 3 Complete (100% success rate)  
**Current Server**: http://localhost:3000  

---

## 🎯 **Week 4 Objectives**

### **Primary Goals**
1. **Invoice PDF Generation** - Generate professional PDF invoices
2. **Payment Tracking** - Track invoice payments and status
3. **Expense Tracking** - Manage and track business expenses
4. **Case Timeline & Activity Log** - Visual case progress tracking
5. **Global Search Functionality** - Search across all entities

### **Success Criteria**
- ✅ Professional PDF invoices generated with Croatian formatting
- ✅ Payment tracking system with status updates
- ✅ Expense management with categorization
- ✅ Case timeline with visual progress indicators
- ✅ Global search across clients, cases, documents, and time entries

---

## 📋 **Detailed Task Breakdown**

### **Task 1: Invoice PDF Generation** 
**Priority**: HIGH  
**Estimated Time**: 2-3 days

#### **1.1 PDF Library Setup**
- [ ] Install `@react-pdf/renderer` or `pdf-lib`
- [ ] Create PDF template with Croatian formatting
- [ ] Add organization letterhead support
- [ ] Implement Croatian PDV (25%) tax display

#### **1.2 Invoice PDF Template**
- [ ] Organization header with logo
- [ ] Client information section
- [ ] Invoice details (number, dates, terms)
- [ ] Line items table (time entries, expenses)
- [ ] Tax calculation section (PDV 25%)
- [ ] Payment instructions in Croatian
- [ ] Terms and conditions

#### **1.3 PDF Generation API**
- [ ] Create `/api/invoices/[id]/pdf` endpoint
- [ ] Generate PDF from invoice data
- [ ] Return PDF as downloadable file
- [ ] Add PDF generation to invoice actions

#### **1.4 PDF Download Integration**
- [ ] Add "Download PDF" button to invoice list
- [ ] Add "Download PDF" button to invoice details
- [ ] Implement PDF preview (optional)
- [ ] Add PDF generation status indicators

### **Task 2: Payment Tracking System**
**Priority**: HIGH  
**Estimated Time**: 2 days

#### **2.1 Payment Model Enhancement**
- [ ] Add payment tracking fields to Invoice model
- [ ] Create Payment model for detailed tracking
- [ ] Add payment status enum (PENDING, PARTIAL, PAID, OVERDUE)
- [ ] Add payment method tracking

#### **2.2 Payment Management UI**
- [ ] Add payment status badges to invoice list
- [ ] Create payment entry form
- [ ] Add payment history to invoice details
- [ ] Implement payment status updates

#### **2.3 Payment API Endpoints**
- [ ] Create `/api/payments` CRUD endpoints
- [ ] Add payment creation from invoice
- [ ] Implement payment status calculations
- [ ] Add payment validation logic

#### **2.4 Payment Notifications**
- [ ] Add overdue invoice alerts
- [ ] Create payment reminder system
- [ ] Add payment confirmation emails (future)

### **Task 3: Expense Tracking System**
**Priority**: MEDIUM  
**Estimated Time**: 2 days

#### **3.1 Expense Model & API**
- [ ] Create Expense model with categories
- [ ] Add expense CRUD API endpoints
- [ ] Implement expense categorization
- [ ] Add expense approval workflow

#### **3.2 Expense Management UI**
- [ ] Create expense list page
- [ ] Add expense creation form
- [ ] Implement expense editing
- [ ] Add expense filtering and search

#### **3.3 Expense Integration**
- [ ] Link expenses to cases
- [ ] Add expenses to invoice generation
- [ ] Implement expense reporting
- [ ] Add expense approval system

### **Task 4: Case Timeline & Activity Log**
**Priority**: MEDIUM  
**Estimated Time**: 2 days

#### **4.1 Activity Log System**
- [ ] Create ActivityLog model
- [ ] Implement activity tracking for all entities
- [ ] Add activity types and descriptions
- [ ] Create activity log API endpoints

#### **4.2 Case Timeline UI**
- [ ] Create timeline component
- [ ] Add timeline to case details page
- [ ] Implement visual progress indicators
- [ ] Add timeline filtering options

#### **4.3 Activity Integration**
- [ ] Track case status changes
- [ ] Track document uploads
- [ ] Track time entries
- [ ] Track invoice generation

### **Task 5: Global Search Functionality**
**Priority**: MEDIUM  
**Estimated Time**: 1-2 days

#### **5.1 Search API**
- [ ] Create global search endpoint
- [ ] Implement search across clients, cases, documents
- [ ] Add search result ranking
- [ ] Implement search filters

#### **5.2 Search UI**
- [ ] Add global search bar to navigation
- [ ] Create search results page
- [ ] Implement search suggestions
- [ ] Add search result highlighting

#### **5.3 Search Integration**
- [ ] Add search to all list pages
- [ ] Implement search shortcuts
- [ ] Add search history
- [ ] Implement search analytics

---

## 🛠 **Technical Implementation Details**

### **Dependencies to Install**
```bash
# PDF Generation
npm install @react-pdf/renderer
# OR
npm install pdf-lib

# Search functionality
npm install fuse.js
# OR
npm install @elastic/elasticsearch

# Date handling
npm install date-fns

# Icons
npm install lucide-react
```

### **Database Schema Updates**
```sql
-- Payment tracking
ALTER TABLE invoices ADD COLUMN paymentStatus VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE invoices ADD COLUMN paidAmount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN paidAt TIMESTAMP;

-- Expense tracking
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL,
  caseId TEXT,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  receiptUrl TEXT,
  status VARCHAR(20) DEFAULT 'PENDING',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP
);

-- Activity logging
CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL,
  userId TEXT NOT NULL,
  entityType VARCHAR(50) NOT NULL,
  entityId TEXT NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **API Endpoints to Create**
```
POST /api/invoices/[id]/pdf - Generate invoice PDF
GET /api/payments - List payments
POST /api/payments - Create payment
GET /api/expenses - List expenses
POST /api/expenses - Create expense
GET /api/activity-logs - List activities
GET /api/search - Global search
```

---

## 📅 **Daily Schedule**

### **Day 1 (Monday)**
- [ ] Set up PDF generation library
- [ ] Create invoice PDF template
- [ ] Implement basic PDF generation
- [ ] Test PDF generation

### **Day 2 (Tuesday)**
- [ ] Complete invoice PDF generation
- [ ] Add payment tracking model
- [ ] Create payment management UI
- [ ] Test payment tracking

### **Day 3 (Wednesday)**
- [ ] Complete payment tracking system
- [ ] Start expense tracking model
- [ ] Create expense management UI
- [ ] Test expense tracking

### **Day 4 (Thursday)**
- [ ] Complete expense tracking
- [ ] Start activity log system
- [ ] Create case timeline UI
- [ ] Test activity logging

### **Day 5 (Friday)**
- [ ] Complete case timeline
- [ ] Implement global search
- [ ] Test all Week 4 features
- [ ] Document Week 4 completion

---

## 🧪 **Testing Checklist**

### **Invoice PDF Generation**
- [ ] PDF generates correctly
- [ ] Croatian formatting applied
- [ ] PDV tax calculation correct
- [ ] Organization details included
- [ ] Client information accurate
- [ ] Line items display properly
- [ ] Download functionality works

### **Payment Tracking**
- [ ] Payment status updates correctly
- [ ] Payment history displays
- [ ] Overdue detection works
- [ ] Payment calculations accurate
- [ ] Payment UI responsive

### **Expense Tracking**
- [ ] Expense CRUD operations work
- [ ] Expense categorization works
- [ ] Expense-case linking works
- [ ] Expense reporting accurate
- [ ] Expense UI functional

### **Case Timeline**
- [ ] Activity logging works
- [ ] Timeline displays correctly
- [ ] Progress indicators accurate
- [ ] Timeline filtering works
- [ ] Timeline responsive

### **Global Search**
- [ ] Search finds relevant results
- [ ] Search ranking works
- [ ] Search filters work
- [ ] Search UI responsive
- [ ] Search performance good

---

## 🚀 **Success Metrics**

### **Technical Metrics**
- [ ] All Week 4 features implemented
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Code quality maintained
- [ ] Tests passing

### **User Experience Metrics**
- [ ] PDF invoices professional
- [ ] Payment tracking intuitive
- [ ] Expense management easy
- [ ] Timeline visualization clear
- [ ] Search results relevant

### **Business Metrics**
- [ ] Croatian compliance maintained
- [ ] Legal requirements met
- [ ] User workflow improved
- [ ] System ready for production
- [ ] Documentation complete

---

## 📝 **Notes & Considerations**

### **Croatian Localization**
- All new features must be in Croatian
- PDF invoices must follow Croatian format
- Payment terms in Croatian
- Expense categories in Croatian
- Search results in Croatian

### **Legal Compliance**
- Expense tracking for tax purposes
- Payment tracking for accounting
- Activity logs for audit trails
- PDF invoices for legal requirements
- Data retention policies

### **Performance Considerations**
- PDF generation should be fast
- Search should be responsive
- Timeline should load quickly
- Payment calculations should be accurate
- Activity logs should not impact performance

---

## 🎯 **Week 4 Completion Criteria**

**Week 4 will be considered complete when:**
1. ✅ Professional PDF invoices generate correctly
2. ✅ Payment tracking system is fully functional
3. ✅ Expense management system is working
4. ✅ Case timeline displays activity logs
5. ✅ Global search finds relevant results
6. ✅ All features tested and working
7. ✅ Croatian localization maintained
8. ✅ Performance is acceptable
9. ✅ Code quality is maintained
10. ✅ Documentation is updated

**Target Completion**: December 26, 2024  
**Next Phase**: Week 5 - Security & Testing

---

## 🚀 **Ready to Start Week 4!**

The foundation from Weeks 1-3 is solid and ready for Week 4 enhancements. All core features are working, and we can now focus on the billing and polish features that will make iLegal production-ready.

**Let's build an amazing legal practice management system!** 🎉
