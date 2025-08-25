// Test Accounts for Souk El-Syarat Platform

export interface TestAccount {
  email: string;
  password: string;
  displayName: string;
  role: 'admin' | 'vendor' | 'customer';
  description: string;
}

export const TEST_ACCOUNTS: TestAccount[] = [
  // Admin Account
  {
    email: 'admin@souk-el-syarat.com',
    password: 'SoukAdmin2024!@#$',
    displayName: 'مدير النظام الرئيسي',
    role: 'admin',
    description: 'حساب المدير الرئيسي مع جميع الصلاحيات'
  },

  // Vendor Test Accounts
  {
    email: 'vendor1@alamancar.com',
    password: 'VendorTest123!',
    displayName: 'أحمد محمد علي - معرض الأمان',
    role: 'vendor',
    description: 'معرض الأمان للسيارات الفاخرة - الجيزة'
  },
  {
    email: 'vendor2@carservice.com',
    password: 'VendorTest456!',
    displayName: 'محمود حسن الشافعي - مركز الخدمة',
    role: 'vendor',
    description: 'مركز خدمة السيارات المتطور - مدينة نصر'
  },
  {
    email: 'vendor3@parts-egypt.com',
    password: 'VendorTest789!',
    displayName: 'فاطمة أحمد عبدالله - قطع الغيار',
    role: 'vendor',
    description: 'شركة قطع الغيار الأصلية - الإسكندرية'
  },
  {
    email: 'vendor4@cairocars.com',
    password: 'VendorCairo123!',
    displayName: 'محمد عبدالرحمن - معرض القاهرة',
    role: 'vendor',
    description: 'معرض القاهرة للسيارات الحديثة - وسط القاهرة'
  },
  {
    email: 'vendor5@luxcars.com',
    password: 'VendorLux456!',
    displayName: 'سارة أحمد حسن - السيارات الفاخرة',
    role: 'vendor',
    description: 'معرض السيارات الفاخرة المتميزة - الزمالك'
  },

  // Customer Test Accounts
  {
    email: 'customer1@gmail.com',
    password: 'Customer123!',
    displayName: 'علي محمد خالد',
    role: 'customer',
    description: 'عميل تجريبي - باحث عن سيارة عائلية'
  },
  {
    email: 'customer2@gmail.com',
    password: 'Customer456!',
    displayName: 'منى أحمد السيد',
    role: 'customer',
    description: 'عميل تجريبي - مهتمة بالسيارات الصغيرة'
  },
  {
    email: 'customer3@yahoo.com',
    password: 'Customer789!',
    displayName: 'أحمد عبدالله محمد',
    role: 'customer',
    description: 'عميل تجريبي - يبحث عن سيارة رياضية'
  }
];

// Quick reference for testing
export const QUICK_TEST_LOGINS = {
  admin: {
    email: 'admin@souk-el-syarat.com',
    password: 'SoukAdmin2024!@#$'
  },
  vendor1: {
    email: 'vendor1@alamancar.com',
    password: 'VendorTest123!'
  },
  vendor2: {
    email: 'vendor2@carservice.com',
    password: 'VendorTest456!'
  },
  customer1: {
    email: 'customer1@gmail.com',
    password: 'Customer123!'
  },
  customer2: {
    email: 'customer2@gmail.com',
    password: 'Customer456!'
  }
};

export const createTestAccounts = async () => {
  console.log('🧪 Test accounts ready for:', TEST_ACCOUNTS.length, 'users');
  
  console.log('\n🔐 ADMIN LOGIN:');
  console.log(`Email: ${QUICK_TEST_LOGINS.admin.email}`);
  console.log(`Password: ${QUICK_TEST_LOGINS.admin.password}`);
  
  console.log('\n🏪 VENDOR LOGINS:');
  console.log(`Vendor 1: ${QUICK_TEST_LOGINS.vendor1.email} / ${QUICK_TEST_LOGINS.vendor1.password}`);
  console.log(`Vendor 2: ${QUICK_TEST_LOGINS.vendor2.email} / ${QUICK_TEST_LOGINS.vendor2.password}`);
  
  console.log('\n👤 CUSTOMER LOGINS:');
  console.log(`Customer 1: ${QUICK_TEST_LOGINS.customer1.email} / ${QUICK_TEST_LOGINS.customer1.password}`);
  console.log(`Customer 2: ${QUICK_TEST_LOGINS.customer2.email} / ${QUICK_TEST_LOGINS.customer2.password}`);
  
  console.log('\n✨ All accounts are ready for testing!');
};

// Export for easy import
export default TEST_ACCOUNTS;