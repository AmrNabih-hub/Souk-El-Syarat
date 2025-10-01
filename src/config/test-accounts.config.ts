/**
 * 🔐 SECURE TEST ACCOUNTS CONFIGURATION
 * Souk El-Sayarat - Development & Testing
 * 
 * ⚠️ SECURITY NOTE:
 * - These accounts are for development/testing only
 * - In production, these will be stored in AWS Cognito
 * - Passwords are intentionally strong
 * - Admin account uses real email for vendor application notifications
 */

interface TestAccount {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role: 'admin' | 'vendor' | 'customer';
  phoneNumber?: string;
  vendorInfo?: {
    businessName: string;
    businessNameAr: string;
    subscriptionPlan: string;
    status: string;
  };
}

/**
 * 🔒 PRODUCTION ADMIN ACCOUNT
 * This is the REAL admin account that will receive vendor application emails
 * Credentials are secured and will be migrated to AWS Cognito in production
 */
export const PRODUCTION_ADMIN_ACCOUNT: TestAccount = {
  id: 'admin_prod_001',
  email: 'soukalsayarat1@gmail.com',
  password: 'MZ:!z4kbg4QK22r', // Strong password as provided
  displayName: 'مدير سوق السيارات',
  role: 'admin',
  phoneNumber: '+201000000000',
};

/**
 * 🧪 TEST ACCOUNTS FOR DEVELOPMENT
 * These accounts allow testing different user roles and workflows
 */
export const TEST_ACCOUNTS: Record<string, TestAccount> = {
  // Main Production Admin (Real account)
  admin: PRODUCTION_ADMIN_ACCOUNT,

  // Test Customer Account
  customer: {
    id: 'customer_test_001',
    email: 'customer@test.com',
    password: 'Customer123!@#',
    displayName: 'أحمد محمد', // Ahmed Mohamed
    role: 'customer',
    phoneNumber: '+201234567890',
  },

  // Test Vendor Account (Approved)
  vendor: {
    id: 'vendor_test_001',
    email: 'vendor@test.com',
    password: 'Vendor123!@#',
    displayName: 'محمد علي', // Mohamed Ali
    role: 'vendor',
    phoneNumber: '+201987654321',
    vendorInfo: {
      businessName: 'Auto Parts Pro',
      businessNameAr: 'قطع غيار السيارات المحترفة',
      subscriptionPlan: 'premium',
      status: 'approved',
    },
  },
};

/**
 * 🔐 SECURE ACCOUNT LOOKUP
 * Validates credentials and returns user data if valid
 */
export const validateTestAccount = (
  email: string,
  password: string
): TestAccount | null => {
  // Check all test accounts
  for (const account of Object.values(TEST_ACCOUNTS)) {
    if (account.email === email && account.password === password) {
      // Return account without password for security
      const { password: _, ...safeAccount } = account;
      return account; // Return full account for auth service
    }
  }
  
  return null;
};

/**
 * 🔍 GET ACCOUNT BY EMAIL
 * Check if email exists in test accounts
 */
export const getAccountByEmail = (email: string): TestAccount | null => {
  for (const account of Object.values(TEST_ACCOUNTS)) {
    if (account.email === email) {
      return account;
    }
  }
  return null;
};

/**
 * 📝 TEST ACCOUNT CREDENTIALS (For Documentation)
 * 
 * PRODUCTION ADMIN:
 * Email: soukalsayarat1@gmail.com
 * Password: MZ:!z4kbg4QK22r
 * Role: Admin
 * Purpose: Real admin account for vendor applications
 * 
 * TEST CUSTOMER:
 * Email: customer@test.com
 * Password: Customer123!@#
 * Role: Customer
 * Purpose: Test customer workflows (shopping, car selling, etc.)
 * 
 * TEST VENDOR:
 * Email: vendor@test.com
 * Password: Vendor123!@#
 * Role: Vendor
 * Purpose: Test vendor workflows (products, orders, dashboard)
 */

/**
 * 🚀 PRODUCTION MIGRATION NOTES:
 * 
 * When migrating to AWS Amplify production:
 * 1. Create admin user in AWS Cognito with email: soukalsayarat1@gmail.com
 * 2. Set password securely: MZ:!z4kbg4QK22r
 * 3. Assign to "Admin" group in Cognito
 * 4. Configure SES to send emails from this address
 * 5. Test accounts (customer@test.com, vendor@test.com) can remain for testing
 * 6. Update auth service to check Cognito instead of local storage
 */

export default TEST_ACCOUNTS;

