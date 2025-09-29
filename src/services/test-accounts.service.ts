// Test accounts service for demo purposes
export interface TestAccount {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role: 'admin' | 'vendor' | 'customer';
  status: 'active' | 'pending' | 'suspended';
  createdAt: Date;
}

class TestAccountsService {
  private accounts: TestAccount[] = [
    // Admin Account
    {
      id: 'admin_001',
      email: 'admin@soukel-syarat.com',
      password: 'SoukAdmin2024!@#',
      displayName: 'مدير النظام',
      role: 'admin',
      status: 'active',
      createdAt: new Date('2024-01-01'),
    },
    
    // Vendor Accounts
    {
      id: 'vendor_001',
      email: 'vendor1@example.com',
      password: 'Vendor123!',
      displayName: 'أحمد محمد - معرض النصر',
      role: 'vendor',
      status: 'active',
      createdAt: new Date('2024-02-15'),
    },
    {
      id: 'vendor_002',
      email: 'vendor2@example.com',
      password: 'Vendor123!',
      displayName: 'محمد علي - قطع غيار الفتح',
      role: 'vendor',
      status: 'active',
      createdAt: new Date('2024-03-01'),
    },
    {
      id: 'vendor_003',
      email: 'vendor3@example.com',
      password: 'Vendor123!',
      displayName: 'سارة أحمد - مركز الصيانة المتقدم',
      role: 'vendor',
      status: 'pending',
      createdAt: new Date('2024-03-20'),
    },
    
    // Customer Accounts
    {
      id: 'customer_001',
      email: 'customer1@example.com',
      password: 'Customer123!',
      displayName: 'عمر حسن',
      role: 'customer',
      status: 'active',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: 'customer_002',
      email: 'customer2@example.com',
      password: 'Customer123!',
      displayName: 'فاطمة محمود',
      role: 'customer',
      status: 'active',
      createdAt: new Date('2024-02-01'),
    },
    {
      id: 'customer_003',
      email: 'customer3@example.com',
      password: 'Customer123!',
      displayName: 'خالد أحمد',
      role: 'customer',
      status: 'active',
      createdAt: new Date('2024-02-20'),
    },
  ];

  // Get all test accounts
  getAllAccounts(): TestAccount[] {
    return [...this.accounts];
  }

  // Get accounts by role
  getAccountsByRole(role: TestAccount['role']): TestAccount[] {
    return this.accounts.filter(account => account.role === role);
  }

  // Get account by email
  getAccountByEmail(email: string): TestAccount | undefined {
    return this.accounts.find(account => account.email === email);
  }

  // Create sample vendor applications
  createSampleApplications() {
    // This would create sample vendor applications for testing
    // Integration with vendorApplicationService would happen here
    return [
      {
        businessName: 'معرض الأهرام للسيارات',
        contactPerson: 'يوسف الشربيني',
        email: 'pyramid.cars@example.com',
        businessType: 'dealership',
        subscriptionPlan: 'premium',
        phoneNumber: '01123456789',
      },
      {
        businessName: 'قطع غيار النيل',
        contactPerson: 'أمينة عبدالله',
        email: 'nile.parts@example.com',
        businessType: 'parts_supplier',
        subscriptionPlan: 'basic',
        phoneNumber: '01234567890',
      },
      {
        businessName: 'مركز صيانة المدينة',
        contactPerson: 'محمود رشاد',
        email: 'city.service@example.com',
        businessType: 'service_center',
        subscriptionPlan: 'enterprise',
        phoneNumber: '01345678901',
      },
    ];
  }

  // Get account statistics
  getAccountStats() {
    const total = this.accounts.length;
    const adminCount = this.accounts.filter(acc => acc.role === 'admin').length;
    const vendorCount = this.accounts.filter(acc => acc.role === 'vendor').length;
    const customerCount = this.accounts.filter(acc => acc.role === 'customer').length;
    const activeCount = this.accounts.filter(acc => acc.status === 'active').length;
    const pendingCount = this.accounts.filter(acc => acc.status === 'pending').length;

    return {
      total,
      adminCount,
      vendorCount,
      customerCount,
      activeCount,
      pendingCount,
    };
  }

  // Demo login info for users
  getDemoLoginInfo() {
    return {
      admin: {
        email: 'admin@soukel-syarat.com',
        password: 'SoukAdmin2024!@#',
        description: 'Full admin access to review applications and manage platform',
      },
      vendor: {
        email: 'vendor1@example.com',
        password: 'Vendor123!',
        description: 'Active vendor account with dashboard access',
      },
      customer: {
        email: 'customer1@example.com',
        password: 'Customer123!',
        description: 'Regular customer account for shopping and orders',
      },
    };
  }
}

export const testAccountsService = new TestAccountsService();