# 🧪 Complete Testing Guide - Vendor & Customer Request Workflows

**Date:** October 1, 2025  
**Purpose:** Step-by-step guide to test all request workflows

---

## 🚀 **Quick Start Testing**

### **Prerequisites:**
```bash
✅ Dev server running: http://localhost:5001
✅ Test accounts ready (see below)
✅ Browser DevTools open (F12) to see console logs
```

### **Test Accounts:**

| Role | Email | Password |
|------|-------|----------|
| **Admin** | soukalsayarat1@gmail.com | MZ:!z4kbg4QK22r |
| **Customer** | customer@test.com | Customer123!@# |
| **Vendor** | vendor@test.com | Vendor123!@# |

---

## 📋 **Test 1: Vendor Application Workflow** (15 mins)

### **Step 1: Submit Vendor Application**

```bash
⏱️ Time: 5 minutes

1. Open http://localhost:5001
2. Click "تسجيل الدخول" (Login)
3. Login with: customer@test.com / Customer123!@#
4. ✅ Verify: You're logged in (see user icon in navbar)

5. Go to: /vendor/apply or click "كن تاجراً" in footer
6. Fill the vendor application form:
   - Business Name: "Test Auto Parts Shop"
   - Business Type: "قطع غيار" (Auto Parts)
   - Contact Person: "Ahmed Mohamed"
   - Email: "customer@test.com"
   - Phone: "01012345678"
   - Street: "123 Test Street"
   - City: "Cairo"
   - Governorate: "القاهرة"
   - Business License: "123456789"
   - Select specializations (check at least 2)
   - Expected Monthly Volume: Select any
   - Upload documents (optional in dev)
   
7. Click "إرسال الطلب" (Submit Application)
8. ✅ Verify: Success message appears
9. ✅ Check Console: Should see log about application submission

✅ EXPECTED RESULT:
- Success toast: "تم إرسال طلبك بنجاح!"
- Application ID logged in console
- Status: "pending"
```

### **Step 2: Admin Sees Application**

```bash
⏱️ Time: 3 minutes

1. LOGOUT (click user icon → logout)
2. Go to: /admin/login
3. Login with: soukalsayarat1@gmail.com / MZ:!z4kbg4QK22r
4. ✅ Verify: Redirected to /admin/dashboard

5. Go to "Applications" or "الطلبات" tab
6. ✅ Verify: You see "Test Auto Parts Shop" application
7. ✅ Verify: Status shows "في الانتظار" (Pending)
8. ✅ Verify: Application details visible (contact, phone, etc.)

9. Click "مراجعة" or "Review" button
10. ✅ Verify: Review modal opens with all application details

✅ EXPECTED RESULT:
- Application visible in admin dashboard
- All submitted data displayed correctly
- Can open review modal
```

### **Step 3: Admin Approves Application**

```bash
⏱️ Time: 2 minutes

1. In review modal:
2. Select "Approve" / "الموافقة"
3. Add optional comment: "Welcome to the platform!"
4. Click "Submit" / "إرسال"
5. ✅ Verify: Success message appears
6. ✅ Verify: Application status changes to "Approved" / "تمت الموافقة"
7. ✅ Check Console: Should see approval logs

✅ EXPECTED RESULT:
- Success toast: "تمت الموافقة على الطلب"
- Application status updated
- Approval logged in console
```

### **Step 4: Vendor Gets Notified & Can Access Dashboard**

```bash
⏱️ Time: 5 minutes

1. LOGOUT from admin
2. Login again with: customer@test.com / Customer123!@#
3. ✅ Verify: User role should now be "vendor"
4. ✅ Verify: Navbar changed (no more "بيع عربيتك" button)
5. ✅ Verify: Navbar shows "لوحة التحكم" (Dashboard) option

6. Click "لوحة التحكم" or go to /vendor/dashboard
7. ✅ Verify: You can access vendor dashboard
8. ✅ Verify: Dashboard shows vendor-specific options
9. ✅ Verify: Can see "Add Product", "My Products", etc.

✅ EXPECTED RESULT:
- Role changed from customer → vendor
- Access to vendor dashboard granted
- Vendor-specific UI elements visible
```

---

## 🚗 **Test 2: Customer Car Listing Workflow** (20 mins)

### **Step 1: Submit Car Listing**

```bash
⏱️ Time: 8 minutes

1. Create NEW customer account (or use existing)
2. Register at /register:
   - Email: "testcustomer2@test.com"
   - Password: "Test123!@#"
   - Name: "Test Customer 2"
   - Role: "Customer" / "عميل"
   
3. Login with new account
4. ✅ Verify: "بيع عربيتك" button visible in navbar

5. Click "بيع عربيتك" (Sell Your Car)
6. ✅ Verify: Redirected to /sell-your-car
7. Fill car details form:

   **Step 1 - Car Info:**
   - Make: "Toyota"
   - Model: "Corolla"
   - Year: "2015"
   - Mileage: "80000"
   - Transmission: "Automatic"
   - Fuel Type: "Gasoline"
   - Color: "Silver"
   → Click "التالي" (Next)

   **Step 2 - Condition & Price:**
   - Asking Price: "150000"
   - Condition: "Good"
   - Has Ownership Papers: ✅ Yes
   - Has Service History: ✅ Yes
   → Click "التالي" (Next)

   **Step 3 - Description:**
   - Description: "Well maintained car, single owner"
   - Features: Add a few (AC, Power Windows, etc.)
   → Click "التالي" (Next)

   **Step 4 - Contact:**
   - Seller Name: "Ahmed Hassan"
   - Phone: "01098765432"
   - Location: "Cairo, Egypt"
   → Click "التالي" (Next)

   **Step 5 - Images:**
   - Upload 6+ images (or use mock images in dev)
   → Click "Submit" / "إرسال"

8. ✅ Verify: Success message
9. ✅ Check Console: Listing ID logged

✅ EXPECTED RESULT:
- Success toast: "تم إرسال طلب بيع السيارة بنجاح!"
- Listing created with status: "pending"
- Listing ID in console
```

### **Step 2: Admin Sees Car Listing**

```bash
⏱️ Time: 3 minutes

1. LOGOUT and login as admin
2. Go to /admin/dashboard
3. Look for "Car Listings" or "Products" tab
4. ✅ Verify: See "Toyota Corolla 2015" listing
5. ✅ Verify: Status shows "Pending"
6. ✅ Verify: Can see all car details, price, seller info

✅ EXPECTED RESULT:
- Car listing visible in admin dashboard
- All car details displayed
- Pending status shown
```

### **Step 3: Admin Approves Car Listing**

```bash
⏱️ Time: 2 minutes

1. Click "Review" or "مراجعة" on car listing
2. Select "Approve" / "الموافقة"
3. Add comment: "Car looks good, approved for marketplace"
4. Click "Submit"
5. ✅ Verify: Success message
6. ✅ Verify: Status changes to "Approved"

✅ EXPECTED RESULT:
- Listing approved
- Status updated
- Product should be created in marketplace (check console)
```

### **Step 4: Customer Sees Approved Listing**

```bash
⏱️ Time: 7 minutes

1. LOGOUT and login as customer (testcustomer2@test.com)
2. Go to "My Listings" page (if available) or check notifications
3. ✅ Verify: Notification about approval

4. Go to /marketplace
5. ✅ Verify: Can see "Toyota Corolla 2015" in marketplace
6. ✅ Verify: Product is live and visible to all users

7. (Optional) Test as another customer:
   - Login with different account
   - Go to marketplace
   - ✅ Verify: Can see the car
   - ✅ Verify: Can click and view details

✅ EXPECTED RESULT:
- Customer notified of approval
- Car appears in marketplace
- Car is publicly visible
- Other customers can see and inquire
```

---

## 🔄 **Test 3: Rejection Workflow** (10 mins)

### **Test 3A: Reject Vendor Application**

```bash
⏱️ Time: 5 minutes

1. Create new customer account: "testvendor2@test.com"
2. Submit vendor application (see Test 1, Step 1)
3. Login as admin
4. Go to Applications tab
5. Click "Review" on new application
6. Select "Reject" / "رفض"
7. Add reason: "Incomplete documentation"
8. Submit
9. ✅ Verify: Status changes to "Rejected"

10. LOGOUT, login as testvendor2@test.com
11. ✅ Verify: Role still "customer" (not changed)
12. ✅ Verify: Can see rejection notification
13. ✅ Verify: Cannot access /vendor/dashboard

✅ EXPECTED RESULT:
- Application rejected
- User stays as customer
- Rejection reason visible
```

### **Test 3B: Reject Car Listing**

```bash
⏱️ Time: 5 minutes

1. Create new customer: "testcar2@test.com"
2. Submit car listing (see Test 2, Step 1)
3. Login as admin
4. Review car listing
5. Select "Reject" / "رفض"
6. Add reason: "Photos quality too low"
7. Submit
8. ✅ Verify: Listing status = "Rejected"

9. LOGOUT, login as testcar2@test.com
10. ✅ Verify: Notification about rejection
11. ✅ Verify: Can see rejection reason
12. Go to /marketplace
13. ✅ Verify: Car NOT visible in marketplace

✅ EXPECTED RESULT:
- Listing rejected
- Not published to marketplace
- Customer can see reason
```

---

## 🎯 **Quick Smoke Test (5 mins)**

If you're short on time, test the bare minimum:

```bash
1. ✅ Login as customer
2. ✅ Click "بيع عربيتك" → Form opens
3. ✅ Go to /vendor/apply → Form opens
4. ✅ Login as admin
5. ✅ Access /admin/dashboard → Dashboard loads
6. ✅ See tabs: Overview, Applications, Vendors
7. ✅ No console errors
```

---

## 📊 **Expected Console Logs**

### **When Submitting Vendor Application:**
```
🔐 Using mock authentication for test accounts
✅ Vendor application submitted: app_1234567890_abc123
📧 Email notification sent to admin
📨 Real-time event emitted: VENDOR_APPLICATION
```

### **When Admin Approves:**
```
✅ Vendor application approved: app_1234567890_abc123
🔄 User role updated: customer → vendor
📧 Approval email sent to vendor
📨 Real-time event emitted: VENDOR_APPROVED
```

### **When Submitting Car Listing:**
```
🚗 Car listing submitted: listing_1234567890_xyz789
📧 Email notification sent to admin
📨 Real-time event emitted: CAR_LISTING_CREATED
```

### **When Admin Approves Car:**
```
✅ Car listing approved: listing_1234567890_xyz789
🏷️ Product created in marketplace: prod_1234567890_def456
📧 Approval email sent to customer
📨 Real-time event emitted: CAR_LISTING_APPROVED
```

---

## ⚠️ **Known Development Limitations**

### **What Won't Work (Expected):**

1. **WebSocket Connection Errors:**
   ```
   WebSocket connection to 'ws://localhost:5001/ws' failed
   ```
   **EXPECTED:** No WebSocket server in dev
   **IMPACT:** None - uses fallback state management

2. **Email Sending:**
   ```
   Email sent (mock)
   ```
   **EXPECTED:** No real email service configured
   **IMPACT:** Emails logged to console only

3. **File Uploads:**
   ```
   File uploaded to: uploads/documents/...
   ```
   **EXPECTED:** No real storage configured
   **IMPACT:** Files not actually stored

### **What SHOULD Work:**

✅ Complete form submissions  
✅ Status changes (pending → approved/rejected)  
✅ Role updates (customer → vendor)  
✅ Route protection (vendor-only routes)  
✅ UI updates and redirects  
✅ Toast notifications  
✅ Console logging  
✅ localStorage state persistence  

---

## 🐛 **Troubleshooting**

### **Problem: Can't Login**
**Solution:** See `AUTH_PERSISTENCE_FIX_SUMMARY.md`
- Clear browser storage (F12 → Application → Clear storage)
- Reload page
- Try again

### **Problem: Role Not Updating After Approval**
**Solution:**
- Logout and login again
- Check `localStorage` → `demo_user` → `role` field
- Should be "vendor" after approval

### **Problem: Can't Access Vendor Dashboard**
**Solution:**
- Verify role is "vendor" (check localStorage)
- Try direct URL: `/vendor/dashboard`
- Check console for route protection errors

### **Problem: "بيع عربيتك" Button Not Showing**
**Solution:**
- Must be logged in as "customer" role
- Vendors and admins don't see this button
- Check user role in navbar user menu

---

## ✅ **Success Criteria**

After completing all tests, you should have verified:

- ✅ Vendor applications submitted successfully
- ✅ Admin receives and can review applications
- ✅ Admin can approve/reject applications
- ✅ Vendor role updates after approval
- ✅ Vendor can access vendor dashboard
- ✅ Car listings submitted successfully
- ✅ Admin receives and can review car listings
- ✅ Admin can approve/reject listings
- ✅ Approved cars appear in marketplace
- ✅ Customers receive appropriate notifications
- ✅ Rejected requests show rejection reasons
- ✅ No blocking errors in console
- ✅ Auth persistence works across page reloads

---

## 📝 **Testing Notes Template**

Use this to track your testing:

```markdown
# Test Session - [Date]

## Vendor Application Workflow
- [ ] Step 1: Submit ✅/❌
- [ ] Step 2: Admin sees ✅/❌
- [ ] Step 3: Admin approves ✅/❌
- [ ] Step 4: Vendor notified ✅/❌
- Notes: _______________

## Car Listing Workflow
- [ ] Step 1: Submit ✅/❌
- [ ] Step 2: Admin sees ✅/❌
- [ ] Step 3: Admin approves ✅/❌
- [ ] Step 4: Customer notified ✅/❌
- [ ] Step 5: Car in marketplace ✅/❌
- Notes: _______________

## Rejection Workflow
- [ ] Vendor rejection ✅/❌
- [ ] Car listing rejection ✅/❌
- Notes: _______________

## Issues Found
1. _______________
2. _______________
3. _______________
```

---

## 🎉 **Ready to Test!**

Everything is set up and ready. Just follow the steps above and check off each test. Good luck! 🚀

**Time Required:**
- Full Testing: ~45 minutes
- Quick Smoke Test: ~5 minutes
- Essential Tests Only (Tests 1-2): ~35 minutes

