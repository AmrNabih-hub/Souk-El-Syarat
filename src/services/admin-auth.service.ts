import { PRODUCTION_ADMIN_ACCOUNT, TEST_ACCOUNTS, validateTestAccount } from '@/config/test-accounts.config';

// Admin Authentication Service with secure credentials
class AdminAuthService {
  // Support both legacy and new admin accounts
  private readonly ADMIN_CREDENTIALS = [
    // Legacy admin (for backward compatibility)
    {
      email: 'admin@soukel-syarat.com',
      password: 'SoukAdmin2024!@#',
      name: 'مدير النظام',
      role: 'admin'
    },
    // New production admin (real Gmail account)
    {
      email: PRODUCTION_ADMIN_ACCOUNT.email,
      password: PRODUCTION_ADMIN_ACCOUNT.password,
      name: PRODUCTION_ADMIN_ACCOUNT.displayName,
      role: 'admin'
    },
  ];

  private currentAdmin: any = null;

  // Admin login
  async loginAdmin(email: string, password: string): Promise<{ success: boolean; admin?: any; error?: string }> {
    try {
      // Check against all admin credentials
      const matchedCredentials = this.ADMIN_CREDENTIALS.find(
        cred => cred.email === email && cred.password === password
      );

      if (matchedCredentials) {
        this.currentAdmin = {
          id: email === PRODUCTION_ADMIN_ACCOUNT.email ? 'admin_prod_001' : 'admin_001',
          email: matchedCredentials.email,
          displayName: matchedCredentials.name,
          role: 'admin',
          loginTime: new Date(),
          isProductionAdmin: email === PRODUCTION_ADMIN_ACCOUNT.email,
        };

        // Store in localStorage for persistence
        localStorage.setItem('admin_session', JSON.stringify(this.currentAdmin));

        console.log('✅ Admin login successful:', {
          email: matchedCredentials.email,
          role: 'admin',
          isProduction: email === PRODUCTION_ADMIN_ACCOUNT.email,
        });

        return { 
          success: true, 
          admin: this.currentAdmin 
        };
      } else {
        console.warn('❌ Admin login failed: Invalid credentials');
        return { 
          success: false, 
          error: 'Invalid email or password' 
        };
      }
    } catch (error) {
      console.error('❌ Admin login error:', error);
      return { 
        success: false, 
        error: 'Login failed' 
      };
    }
  }

  // Check if admin is logged in
  isAdminLoggedIn(): boolean {
    if (this.currentAdmin) return true;

    // Check localStorage
    const stored = localStorage.getItem('admin_session');
    if (stored) {
      try {
        this.currentAdmin = JSON.parse(stored);
        return true;
      } catch {
        localStorage.removeItem('admin_session');
      }
    }

    return false;
  }

  // Get current admin
  getCurrentAdmin(): any | null {
    if (this.currentAdmin) return this.currentAdmin;

    // Check localStorage
    const stored = localStorage.getItem('admin_session');
    if (stored) {
      try {
        this.currentAdmin = JSON.parse(stored);
        return this.currentAdmin;
      } catch {
        localStorage.removeItem('admin_session');
      }
    }

    return null;
  }

  // Admin logout
  logoutAdmin(): void {
    this.currentAdmin = null;
    localStorage.removeItem('admin_session');
  }

  // Verify admin session
  verifyAdminSession(): boolean {
    const admin = this.getCurrentAdmin();
    if (!admin) return false;

    // Check if session is still valid (24 hours)
    const loginTime = new Date(admin.loginTime);
    const now = new Date();
    const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      this.logoutAdmin();
      return false;
    }

    return true;
  }
}

export const adminAuthService = new AdminAuthService();