# 🔐 Test Accounts Guide
## Souk El-Sayarat - Development & Testing Credentials

---

## 📋 **Available Test Accounts**

### **1. Production Admin Account** 👑

**Purpose:** Real admin account for receiving vendor application emails

```
Email:    soukalsayarat1@gmail.com
Password: MZ:!z4kbg4QK22r
Role:     Admin
Status:   Active
```

**Capabilities:**
- ✅ Approve/reject vendor applications
- ✅ Approve/reject car listings (C2C)
- ✅ Manage all users
- ✅ View platform analytics
- ✅ Moderate products and reviews
- ✅ Receive real-time notifications
- ✅ Receive email notifications

**Access Routes:**
- `/admin/login` - Admin login page
- `/admin/dashboard` - Admin dashboard
- `/admin/vendors` - Vendor management
- `/admin/applications` - Vendor applications

---

### **2. Test Customer Account** 🛒

**Purpose:** Test customer shopping workflows

```
Email:    customer@test.com
Password: Customer123!@#
Role:     Customer
Status:   Active
```

**Capabilities:**
- ✅ Browse marketplace
- ✅ Search and filter products
- ✅ Add to cart and wishlist
- ✅ Place orders (COD)
- ✅ Sell used cars ("بيع عربيتك")
- ✅ View order history
- ✅ Write reviews
- ✅ Update profile

**Access Routes:**
- `/login` - Customer login
- `/marketplace` - Browse products
- `/cart` - Shopping cart
- `/sell-your-car` - Sell car form (customer only)
- `/customer/orders` - Order history
- `/customer/profile` - Profile page

---

### **3. Test Vendor Account** 🏪

**Purpose:** Test vendor business workflows

```
Email:    vendor@test.com
Password: Vendor123!@#
Role:     Vendor
Status:   Approved
```

**Business Details:**
```
Business Name (EN): Auto Parts Pro
Business Name (AR): قطع غيار السيارات المحترفة
Subscription Plan:  Premium
Approval Status:    Approved
```

**Capabilities:**
- ✅ Manage products (CRUD)
- ✅ View orders
- ✅ Track sales analytics
- ✅ View real-time dashboard
- ✅ Respond to reviews
- ✅ Upload product images
- ✅ Manage inventory

**Access Routes:**
- `/login` - Vendor login
- `/vendor/dashboard` - Vendor dashboard
- `/vendor/products` - Product management
- `/vendor/orders` - Order management
- `/vendor/analytics` - Sales analytics

---

## 🔒 **Security Notes**

### **Production Admin Account**
- **CRITICAL:** This is a REAL Gmail account
- Will receive actual vendor application emails
- Credentials stored securely in `src/config/test-accounts.config.ts`
- In production, will be migrated to AWS Cognito
- Email notifications sent to this address

### **Test Accounts**
- For development and testing only
- Not connected to real email services
- Stored in local configuration
- Will be replaced by AWS Cognito in production

---

## 🚀 **How to Login**

### **Method 1: Regular Login Page**

1. **Open app** - http://localhost:5001
2. **Click "تسجيل الدخول"** (Login button)
3. **Enter credentials:**
   - Email: One of the test account emails
   - Password: Corresponding password
4. **Click "تسجيل الدخول"**
5. **Redirected** to appropriate dashboard

### **Method 2: Admin Login (Separate Page)**

1. **Navigate** to http://localhost:5001/admin/login
2. **Enter admin credentials:**
   - Email: soukalsayarat1@gmail.com
   - Password: MZ:!z4kbg4QK22r
3. **Click "تسجيل الدخول كمدير"**
4. **Redirected** to Admin Dashboard

---

## 🧪 **Testing Workflows**

### **Test Customer Workflow:**

1. **Login** as customer@test.com
2. **Browse marketplace** - View products
3. **Add to cart** - Select products
4. **Checkout** - Fill delivery info
5. **Place order** - Complete COD purchase
6. **Sell car** - Click "بيع عربيتك"
7. **Fill form** - Upload 6+ images
8. **Submit** - Wait for admin approval

### **Test Vendor Workflow:**

1. **Login** as vendor@test.com
2. **View dashboard** - See sales stats
3. **Add product** - Create new product
4. **Upload images** - Add product photos
5. **Submit for approval** - Admin reviews
6. **View orders** - Check customer orders
7. **Update inventory** - Manage stock

### **Test Admin Workflow:**

1. **Login** as soukalsayarat1@gmail.com
2. **View dashboard** - Platform overview
3. **Check notifications** - New applications
4. **Review vendor application** - Approve/reject
5. **Review car listing** - Approve/reject
6. **Manage products** - Moderate listings
7. **View analytics** - Platform metrics

---

## 🔄 **Testing Real-Time Features**

### **Vendor Application Flow:**

1. **Open two browsers:**
   - Browser A: Login as customer
   - Browser B: Login as admin (soukalsayarat1@gmail.com)

2. **In Browser A (Customer):**
   - Navigate to `/vendor/apply`
   - Fill vendor application form
   - Submit application

3. **In Browser B (Admin):**
   - Check notifications (should appear in real-time)
   - Click notification to view application
   - Approve or reject application

4. **Back in Browser A:**
   - Check notifications (should receive approval/rejection)
   - If approved, access vendor dashboard

### **Car Listing Flow:**

1. **Open two browsers:**
   - Browser A: Login as customer
   - Browser B: Login as admin

2. **In Browser A (Customer):**
   - Click "بيع عربيتك" button
   - Fill car listing form
   - Upload 6+ images
   - Submit listing

3. **In Browser B (Admin):**
   - Receive real-time notification
   - Review car listing
   - Approve or reject

4. **Back in Browser A:**
   - Receive approval/rejection notification
   - If approved, car appears in marketplace

---

## 📧 **Email Notifications**

### **Production Admin Receives:**

1. **Vendor Applications:**
   ```
   To: soukalsayarat1@gmail.com
   Subject: طلب انضمام تاجر جديد
   Content: Vendor details and application link
   ```

2. **Car Listing Submissions:**
   ```
   To: soukalsayarat1@gmail.com
   Subject: طلب نشر سيارة جديدة
   Content: Car details and approval link
   ```

3. **System Alerts:**
   - Critical errors
   - Security alerts
   - Important updates

### **Customers/Vendors Receive:**

- Application status updates
- Order confirmations
- Listing approval/rejection
- System notifications

---

## 🛠️ **Technical Implementation**

### **Authentication Flow:**

```typescript
// Login attempt
1. User enters email/password
   ↓
2. Check admin accounts (admin-auth.service.ts)
   ↓
3. If not admin, check test accounts (mock-auth.service.ts)
   ↓
4. If match found, create user session
   ↓
5. Store in localStorage
   ↓
6. Redirect to appropriate dashboard
```

### **Files Involved:**

```
src/config/test-accounts.config.ts       // Test account credentials
src/services/admin-auth.service.ts       // Admin authentication
src/services/mock-auth.service.ts        // Test account authentication
src/contexts/AuthContext.tsx             // Auth state management
src/stores/authStore.ts                  // Auth store (Zustand)
```

---

## 🔐 **Credential Storage**

### **Development (Current):**
```typescript
// Stored in: src/config/test-accounts.config.ts
export const PRODUCTION_ADMIN_ACCOUNT = {
  email: 'soukalsayarat1@gmail.com',
  password: 'MZ:!z4kbg4QK22r',
  // ...
};
```

### **Production (Future - AWS Cognito):**
```bash
# Admin user created in AWS Cognito
amplify add auth
# Create user in Cognito User Pool
# Assign to "Admin" group
# Configure email via SES
```

---

## 📊 **Account Features Matrix**

| Feature | Customer | Vendor | Admin |
|---------|----------|--------|-------|
| Browse Products | ✅ | ✅ | ✅ |
| Shopping Cart | ✅ | ✅ | ❌ |
| Place Orders | ✅ | ✅ | ❌ |
| Sell Used Cars | ✅ | ❌ | ❌ |
| Apply as Vendor | ✅ | ❌ | ❌ |
| Manage Products | ❌ | ✅ | ✅ |
| View Orders | Own | Own | All |
| Sales Analytics | ❌ | ✅ | ✅ |
| Approve Vendors | ❌ | ❌ | ✅ |
| Approve Listings | ❌ | ❌ | ✅ |
| Platform Analytics | ❌ | ❌ | ✅ |
| User Management | ❌ | ❌ | ✅ |

---

## 🧪 **Creating Additional Test Accounts**

### **During Development:**

You can create additional test accounts by adding them to `src/config/test-accounts.config.ts`:

```typescript
export const TEST_ACCOUNTS: Record<string, TestAccount> = {
  // Existing accounts...
  
  // Add new test account
  newCustomer: {
    id: 'customer_test_002',
    email: 'newcustomer@test.com',
    password: 'NewCustomer123!@#',
    displayName: 'فاطمة أحمد',
    role: 'customer',
    phoneNumber: '+201122334455',
  },
};
```

### **In Production (AWS Cognito):**

```bash
# Create user via AWS CLI
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username newuser@test.com \
  --user-attributes Name=email,Value=newuser@test.com \
  --temporary-password TempPass123!
```

---

## ⚠️ **Important Warnings**

### **DO NOT:**
- ❌ Commit sensitive credentials to public repos
- ❌ Share admin password publicly
- ❌ Use test accounts in production
- ❌ Hard-code credentials in components

### **DO:**
- ✅ Keep credentials in config files
- ✅ Use environment variables for production
- ✅ Rotate passwords regularly
- ✅ Implement proper AWS Cognito in production
- ✅ Use `.env` files for sensitive data

---

## 🚀 **Migration to Production**

### **Step 1: Create AWS Cognito Users**

```bash
# Initialize Amplify Auth
amplify add auth

# Create admin user
amplify console auth
# In Cognito console:
# - Create user: soukalsayarat1@gmail.com
# - Set password: MZ:!z4kbg4QK22r
# - Add to "Admin" group
```

### **Step 2: Configure Email**

```bash
# Set up SES for email notifications
amplify add notifications

# Verify email: soukalsayarat1@gmail.com
# Configure SES templates
```

### **Step 3: Update Auth Service**

```typescript
// Remove mock auth, use only AWS Amplify
// Update: src/services/auth.service.ts
// Connect to Cognito User Pool
```

### **Step 4: Test Production Auth**

```bash
# Build for production
npm run build:production

# Test login with real AWS
# Verify emails sent correctly
# Test all user flows
```

---

## 📞 **Support**

### **Issues with Test Accounts:**
1. Clear browser cache and localStorage
2. Restart development server
3. Check browser console for errors
4. Verify credentials match exactly

### **Common Problems:**

**"Invalid credentials"**
- Double-check email/password
- Ensure no extra spaces
- Check caps lock

**"User not found"**
- Test accounts may not be initialized
- Check `src/config/test-accounts.config.ts`
- Restart dev server

**"No access to this route"**
- User role doesn't match route requirement
- Login with correct role account
- Check route protection logic

---

## ✅ **Quick Test Checklist**

Before deploying or testing features:

- [ ] Admin login works (soukalsayarat1@gmail.com)
- [ ] Customer login works (customer@test.com)
- [ ] Vendor login works (vendor@test.com)
- [ ] Each role sees appropriate dashboard
- [ ] Real-time notifications working
- [ ] Email notifications sent (check Gmail)
- [ ] Vendor application flow complete
- [ ] Car listing flow complete
- [ ] All protected routes enforcing roles

---

**Document Created:** October 1, 2025  
**Last Updated:** October 1, 2025  
**Version:** 1.0  
**Status:** Active - All Accounts Ready

---

**🔐 Keep credentials secure! Use AWS Cognito for production!** 🚀


