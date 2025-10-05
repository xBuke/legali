# 🧪 Test Credentials for iLegal

## ✅ Test Account Created Successfully!

### 🔑 Login Credentials

**Email**: `test@lawfirm.hr`  
**Password**: `password123`  
**Role**: ADMIN  
**Organization**: Test Law Firm

---

## 🌐 How to Test

### 1. **Login**
1. Open: **http://localhost:3001/sign-in**
2. Enter credentials:
   - Email: `test@lawfirm.hr`
   - Password: `password123`
3. Click "Prijavite se" (Sign In)

### 2. **Dashboard**
- You'll see the dashboard with stats
- All counts will show 0 initially (except clients/cases we created)

### 3. **Test Client Management**
1. Click "Klijenti" in sidebar
2. You'll see **Ivan Horvat** (test client already created)
3. Try:
   - ✅ View client details (click eye icon)
   - ✅ Edit client (click pencil icon)
   - ✅ Add new client (click "Dodaj klijenta")

### 4. **Test Case Management**
1. Click "Predmeti" in sidebar
2. You'll see **"Radni spor - Ivan Horvat"** (test case already created)
3. Try:
   - ✅ View case details (click eye icon)
   - ✅ Edit case (click pencil icon)
   - ✅ Add new case (click "Dodaj predmet")

### 5. **Test Navigation**
- ✅ Dashboard home
- ✅ Clients list & details
- ✅ Cases list & details
- ✅ Dark/Light mode toggle
- ✅ Sign out

---

## 📊 Pre-loaded Test Data

### **Organization**
- Name: Test Law Firm
- Email: test@lawfirm.hr
- Subscription: BASIC (Trial)
- Trial ends: 14 days from now

### **User**
- Name: Test User
- Email: test@lawfirm.hr
- Role: ADMIN (full access)
- Organization: Test Law Firm

### **Client**
- Name: Ivan Horvat
- Type: Individual
- Email: ivan.horvat@example.com
- Phone: +385 91 123 4567
- Address: Ilica 123, Zagreb
- Status: Active

### **Case**
- Title: Radni spor - Ivan Horvat
- Type: Radno pravo (Labor Law)
- Status: OPEN
- Priority: MEDIUM
- Case Number: CASE-000001
- Client: Ivan Horvat

---

## 🎯 Test Scenarios

### **Scenario 1: Add New Client**
1. Go to Clients → "Dodaj klijenta"
2. Choose "Tvrtka" (Company)
3. Fill in:
   - Company: "ABC Consulting d.o.o."
   - Email: "info@abc-consulting.hr"
   - Phone: "+385 1 234 5678"
4. Save and verify it appears in the list

### **Scenario 2: Create Case for New Client**
1. Go to Cases → "Dodaj predmet"
2. Fill in:
   - Title: "Ugovorni spor - ABC Consulting"
   - Client: Select "ABC Consulting d.o.o."
   - Type: "Trgovačko pravo"
   - Priority: "HIGH"
3. Save and verify it appears in the list

### **Scenario 3: Edit Existing Case**
1. Click pencil icon on "Radni spor - Ivan Horvat"
2. Change:
   - Status: "IN_PROGRESS"
   - Priority: "HIGH"
   - Add court info: "Općinski sud u Zagrebu"
3. Save and verify changes

### **Scenario 4: View Case Details**
1. Click eye icon on any case
2. Verify you see:
   - Case information
   - Client card (clickable link)
   - Court information
   - Next hearing date
   - Document/Time/Task counts

---

## 🐛 Troubleshooting

### **Can't Login?**
- Check email: `test@lawfirm.hr` (exact spelling)
- Check password: `password123` (exact spelling)
- Make sure dev server is running on port 3001

### **Database Issues?**
```bash
# Reset database and recreate test data
npx prisma db push --force-reset
node scripts/create-test-user.js
```

### **Port Issues?**
- App runs on: **http://localhost:3001** (not 3000)
- If port 3001 is busy, Next.js will use 3002, 3003, etc.

### **NextAuth Errors?**
- The middleware has been fixed for NextAuth v5
- If you see auth errors, restart the dev server:
```bash
Ctrl+C
npm run dev
```

---

## 📱 Features to Test

### ✅ **Working Features**
- User authentication (login/logout)
- Dashboard with stats
- Client CRUD (Create, Read, Update, Delete)
- Case CRUD (Create, Read, Update, Delete)
- Client-Case linking
- Status & priority badges
- Dark/Light mode
- Responsive design
- Form validation
- Toast notifications

### ⏳ **Future Features** (Not Yet Built)
- Document upload
- Time tracking
- Invoice generation
- User invitations
- Role-based permissions
- Email notifications

---

## 🎉 Success Criteria

You've successfully tested the system when you can:
- ✅ Login with test credentials
- ✅ View dashboard
- ✅ See existing client (Ivan Horvat)
- ✅ See existing case (Radni spor)
- ✅ Add new client
- ✅ Add new case
- ✅ Edit existing records
- ✅ View detail pages
- ✅ Navigate between pages
- ✅ Toggle dark/light mode
- ✅ Sign out

---

## 🚀 Ready to Test!

**Login URL**: http://localhost:3001/sign-in  
**Email**: test@lawfirm.hr  
**Password**: password123

**Happy Testing!** 🎯
