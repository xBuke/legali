# Week 2 Testing Guide

## 🚀 Dev Server Running on: http://localhost:3001

---

## Test 1: User Registration ✅

1. Open **http://localhost:3001**
2. Click "Registrirajte se" (Register)
3. Fill in the form:
   ```
   Ime: Test
   Prezime: User
   Naziv kancelarije: Test Law Firm
   Email: test@example.com
   Lozinka: password123
   Potvrdite lozinku: password123
   ```
4. Click "Kreiraj račun"
5. **Expected**: Redirect to sign-in page

---

## Test 2: User Login ✅

1. You should see the sign-in page
2. Enter credentials:
   ```
   Email: test@example.com
   Lozinka: password123
   ```
3. Click "Prijavite se"
4. **Expected**: Dashboard page loads with your name

---

## Test 3: Dashboard Overview ✅

1. Check the dashboard page
2. **Expected to see**:
   - Welcome message with your name
   - 4 stat cards (all showing 0):
     - Aktivni klijenti
     - Otvoreni predmeti
     - Dokumenti
     - Ovaj mjesec (€0)
   - Sidebar with navigation
   - Theme toggle in header

---

## Test 4: Create Individual Client ✅

1. Click "Klijenti" in sidebar
2. Click "Dodaj klijenta" button
3. Keep "Pojedinac" (Individual) selected
4. Fill in form:
   ```
   Ime: Ivan
   Prezime: Horvat
   Email: ivan.horvat@example.com
   Telefon: +385 91 123 4567
   Adresa: Ilica 123
   Grad: Zagreb
   Poštanski broj: 10000
   ```
5. Click "Dodaj klijenta"
6. **Expected**: 
   - Success toast notification
   - Dialog closes
   - Client appears in table

---

## Test 5: Create Company Client ✅

1. Click "Dodaj klijenta" again
2. Click "Tvrtka" (Company) button
3. Fill in form:
   ```
   Naziv tvrtke: Horvat Consulting d.o.o.
   Email: info@horvat-consulting.hr
   Telefon: +385 1 234 5678
   Adresa: Savska cesta 50
   Grad: Zagreb
   Poštanski broj: 10000
   ```
4. Click "Dodaj klijenta"
5. **Expected**: Company appears in table with building icon

---

## Test 6: View Client List ✅

Check the clients table shows:
- Client name
- Type badge (Pojedinac or Tvrtka)
- Contact info (email & phone)
- Status badge (ACTIVE - green)
- "0 predmeta" (0 cases)
- Action buttons (eye, pencil, trash)

---

## Test 7: Edit Client ✅

1. Click the **pencil icon** on Ivan Horvat
2. Change some data:
   ```
   Telefon: +385 91 999 8888
   ```
3. Click "Spremi"
4. **Expected**: 
   - Success toast
   - Dialog closes
   - Table updates with new phone number

---

## Test 8: View Client Details ✅

1. Click the **eye icon** on Ivan Horvat
2. **Expected to see**:
   - Client name as page title
   - Status badge
   - Contact information card
   - Predmeti card showing "0"
   - Dokumenti card showing "0"
   - Back arrow button

---

## Test 9: Delete Client ✅

1. Click back arrow or navigate to Clients
2. Click the **trash icon** on a client
3. Confirm deletion
4. **Expected**: 
   - Client removed from list
   - Success toast
   - (Data still in database with deletedAt timestamp)

---

## Test 10: Dark Mode Toggle ✅

1. Click the theme toggle button (sun/moon icon) in header
2. **Expected**: App switches between light and dark mode

---

## Test 11: Navigation ✅

Test all sidebar links:
- ✅ Nadzorna ploča (Dashboard) - works
- ✅ Klijenti (Clients) - works
- ⏳ Predmeti (Cases) - not built yet
- ⏳ Dokumenti (Documents) - not built yet
- ⏳ Vrijeme i naplata (Time) - not built yet
- ⏳ Računi (Invoices) - not built yet
- ⏳ Postavke (Settings) - not built yet

---

## Test 12: Sign Out ✅

1. Click "Odjava" (Logout) at bottom of sidebar
2. **Expected**: Redirect to sign-in page

---

## Test 13: Protected Routes ✅

1. After signing out, try to access:
   - http://localhost:3001/dashboard
   - http://localhost:3001/dashboard/clients
2. **Expected**: Automatically redirected to sign-in page

---

## Test 14: Database Viewer ✅

Open a new terminal and run:
```bash
npx prisma studio
```

This opens http://localhost:5555 where you can:
- View all database tables
- See your organization
- See your user account
- See all clients you created
- Verify soft deletes (deletedAt field)

---

## 🐛 Common Issues & Fixes

### Issue: Port 3000 in use
**Solution**: Already handled! App runs on port 3001 ✅

### Issue: Can't sign in
**Check**:
- Email and password are correct
- User was created successfully
- Check terminal for error messages

### Issue: Clients not showing
**Check**:
- Browser console (F12) for errors
- Terminal for API errors
- Network tab in DevTools

### Issue: Database errors
**Fix**:
```bash
npx prisma db push --force-reset
```
Then re-register your account.

---

## 📊 Test Results

Track your tests here:

- [ ] Test 1: User Registration
- [ ] Test 2: User Login
- [ ] Test 3: Dashboard Overview
- [ ] Test 4: Create Individual Client
- [ ] Test 5: Create Company Client
- [ ] Test 6: View Client List
- [ ] Test 7: Edit Client
- [ ] Test 8: View Client Details
- [ ] Test 9: Delete Client
- [ ] Test 10: Dark Mode Toggle
- [ ] Test 11: Navigation
- [ ] Test 12: Sign Out
- [ ] Test 13: Protected Routes
- [ ] Test 14: Database Viewer

---

## ✅ Success Criteria

Week 2 is complete when:
- ✅ User can register and login
- ✅ Dashboard displays correctly
- ✅ Can create both individual and company clients
- ✅ Client list displays all clients
- ✅ Can edit client information
- ✅ Can view client details
- ✅ Can soft-delete clients
- ✅ Dark mode works
- ✅ Navigation works
- ✅ Sign out works
- ✅ Routes are protected

---

## 🎉 Ready to Test!

Start with Test 1 and work your way through. Let me know if you encounter any issues!
