# 🔐 LOGIN CREDENTIALS FOR TESTING

## Live App URL
**https://souk-el-syarat.web.app**

---

## 👨‍💼 ADMIN ACCOUNTS

### Primary Admin Account
- **Email:** admin@souk-el-syarat.com
- **Password:** Admin123456!
- **Role:** Admin
- **Access:** Full system access, vendor management, analytics, user management

### Secondary Admin Account
- **Email:** admin@alamancar.com
- **Password:** AdminSouk2024!
- **Role:** Admin
- **Access:** Vendor management, analytics, user management

---

## 🏪 VENDOR ACCOUNTS

### Test Vendor 1
- **Email:** vendor1@alamancar.com
- **Password:** Vendor123456!
- **Business:** معرض الأمان للسيارات الفاخرة
- **Location:** شارع الهرم، الجيزة

### Test Vendor 2
- **Email:** vendor2@carservice.com
- **Password:** ServiceVendor123!
- **Business:** مركز خدمة السيارات المتطور
- **Location:** مدينة نصر، القاهرة

### Test Vendor 3
- **Email:** vendor3@parts-egypt.com
- **Password:** PartsVendor123!
- **Business:** شركة قطع الغيار الأصلية
- **Location:** الإسكندرية

---

## 👥 CUSTOMER ACCOUNTS

### Test Customer 1
- **Email:** customer1@gmail.com
- **Password:** Customer123!
- **Name:** محمد أحمد السيد

### Test Customer 2
- **Email:** test@souk-el-syarat.com
- **Password:** Test123456!
- **Name:** مستخدم تجريبي

### Test Customer 3
- **Email:** customer2@gmail.com
- **Password:** Customer456!
- **Name:** فاطمة محمود علي

---

## 🧪 TESTING INSTRUCTIONS

1. **Test Admin Login:**
   - Go to https://souk-el-syarat.web.app/login
   - Use admin credentials above
   - Should redirect to `/admin/dashboard`

2. **Test Vendor Login:**
   - Use vendor credentials above
   - Should redirect to `/vendor/dashboard`

3. **Test Customer Login:**
   - Use customer credentials above
   - Should redirect to `/dashboard`

4. **Test Regular Firebase Registration:**
   - Create new account with any email/password
   - Should work with Firebase Auth

---

## 🔧 RECENT FIXES DEPLOYED

✅ **Authentication System:**
- Fixed unified authentication flow (Admin → Vendor → Customer)
- Fixed admin login and dashboard redirect
- Fixed regular user email/password login

✅ **UI Improvements:**
- Fixed cart and wishlist badge positioning (-top-2 -right-2, larger size)
- Enhanced theme toggle with debugging
- Enhanced language toggle with AR/EN indicator
- Added proper error handling for toggle functions

✅ **System Integration:**
- All components now use unified auth store
- Proper auth state management
- Smart routing based on user role

---

## 📱 Test Cases to Verify

1. **Login Flow:** Try all account types above
2. **Theme Toggle:** Click moon/sun icon - should switch themes
3. **Language Toggle:** Click globe icon - should show AR/EN
4. **Cart/Wishlist:** Numbers should be visible and well-positioned
5. **Admin Dashboard:** Admin login should show full dashboard
6. **Role-Based Routing:** Each role should redirect to correct dashboard

---

*Last Updated: Current Deployment*
*Status: 🟢 LIVE AND READY FOR TESTING*