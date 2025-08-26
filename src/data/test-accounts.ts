// Test Accounts for Easy Access and Testing
// أدمن، تجار، وعملاء للاختبار المباشر

export interface TestAccount {
  email: string;
  password: string;
  role: 'admin' | 'vendor' | 'customer';
  displayName: string;
  description: string;
  permissions?: string[];
}

// =============================================================================
// 👨‍💼 ADMIN ACCOUNTS - حسابات المدراء
// =============================================================================

export const ADMIN_ACCOUNTS: TestAccount[] = [
  {
    email: 'admin@souk-el-syarat.com',
    password: 'Admin123456!',
    role: 'admin',
    displayName: 'مدير النظام الرئيسي',
    description: 'Admin account with full system access',
    permissions: [
      'manage_vendors',
      'manage_users',
      'view_analytics',
      'manage_content',
      'system_settings',
      'financial_reports'
    ]
  },
  {
    email: 'admin@alamancar.com',
    password: 'AdminSouk2024!',
    role: 'admin',
    displayName: 'أحمد المدير العام',
    description: 'Secondary admin account for testing',
    permissions: [
      'manage_vendors',
      'manage_users',
      'view_analytics'
    ]
  }
];

// =============================================================================
// 🏪 VENDOR ACCOUNTS - حسابات التجار
// =============================================================================

export const VENDOR_ACCOUNTS: TestAccount[] = [
  {
    email: 'vendor1@alamancar.com',
    password: 'Vendor123456!',
    role: 'vendor',
    displayName: 'أحمد محمد علي',
    description: 'معرض الأمان للسيارات الفاخرة - شارع الهرم، الجيزة'
  },
  {
    email: 'vendor2@carservice.com',
    password: 'ServiceVendor123!',
    role: 'vendor',
    displayName: 'محمود حسن الشافعي',
    description: 'مركز خدمة السيارات المتطور - مدينة نصر، القاهرة'
  },
  {
    email: 'vendor3@parts-egypt.com',
    password: 'PartsVendor123!',
    role: 'vendor',
    displayName: 'فاطمة أحمد عبدالله',
    description: 'شركة قطع الغيار الأصلية - الإسكندرية'
  },
  {
    email: 'vendor4@cairocars.com',
    password: 'CairoVendor123!',
    role: 'vendor',
    displayName: 'محمد عبدالرحمن',
    description: 'معرض القاهرة للسيارات الحديثة - وسط القاهرة'
  },
  {
    email: 'vendor5@luxcars.com',
    password: 'LuxVendor123!',
    role: 'vendor',
    displayName: 'سارة أحمد حسن',
    description: 'معرض السيارات الفاخرة المتميزة - الزمالك، القاهرة'
  }
];

// =============================================================================
// 👥 CUSTOMER ACCOUNTS - حسابات العملاء
// =============================================================================

export const CUSTOMER_ACCOUNTS: TestAccount[] = [
  {
    email: 'customer1@gmail.com',
    password: 'Customer123!',
    role: 'customer',
    displayName: 'محمد أحمد السيد',
    description: 'عميل عادي - القاهرة'
  },
  {
    email: 'customer2@gmail.com',
    password: 'Customer456!',
    role: 'customer',
    displayName: 'فاطمة محمود علي',
    description: 'عميلة عادية - الإسكندرية'
  },
  {
    email: 'customer3@yahoo.com',
    password: 'Customer789!',
    role: 'customer',
    displayName: 'أحمد محمد حسن',
    description: 'عميل VIP - الجيزة'
  },
  {
    email: 'test@souk-el-syarat.com',
    password: 'Test123456!',
    role: 'customer',
    displayName: 'مستخدم تجريبي',
    description: 'حساب تجريبي للاختبار السريع'
  }
];

// =============================================================================
// 🔗 ALL ACCOUNTS COMBINED - جميع الحسابات
// =============================================================================

export const ALL_TEST_ACCOUNTS: TestAccount[] = [
  ...ADMIN_ACCOUNTS,
  ...VENDOR_ACCOUNTS,
  ...CUSTOMER_ACCOUNTS
];

// =============================================================================
// 🎯 QUICK ACCESS FUNCTIONS - وظائف الوصول السريع
// =============================================================================

export const getAccountByEmail = (email: string): TestAccount | undefined => {
  return ALL_TEST_ACCOUNTS.find(account => account.email === email);
};

export const getAccountsByRole = (role: TestAccount['role']): TestAccount[] => {
  return ALL_TEST_ACCOUNTS.filter(account => account.role === role);
};

export const validateCredentials = (email: string, password: string): TestAccount | null => {
  const account = getAccountByEmail(email);
  return account && account.password === password ? account : null;
};

// =============================================================================
// 📋 QUICK REFERENCE GUIDE - دليل مرجعي سريع
// =============================================================================

export const QUICK_LOGIN_GUIDE = {
  admin: {
    email: 'admin@souk-el-syarat.com',
    password: 'Admin123456!',
    description: 'استخدم هذا الحساب للدخول كمدير'
  },
  vendor: {
    email: 'vendor1@alamancar.com',
    password: 'Vendor123456!',
    description: 'استخدم هذا الحساب للدخول كتاجر'
  },
  customer: {
    email: 'test@souk-el-syarat.com',
    password: 'Test123456!',
    description: 'استخدم هذا الحساب للدخول كعميل'
  }
};

// =============================================================================
// 🚀 EXPORT FOR EASY IMPORT
// =============================================================================

export default {
  ADMIN_ACCOUNTS,
  VENDOR_ACCOUNTS,
  CUSTOMER_ACCOUNTS,
  ALL_TEST_ACCOUNTS,
  QUICK_LOGIN_GUIDE,
  getAccountByEmail,
  getAccountsByRole,
  validateCredentials
};