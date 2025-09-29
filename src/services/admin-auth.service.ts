// Admin Authentication Service with secure credentials
class AdminAuthService {
  private readonly ADMIN_CREDENTIALS = {
    email: 'admin@soukel-syarat.com',
    password: 'SoukAdmin2024!@#',
    name: 'مدير النظام',
    role: 'admin'
  };

  private currentAdmin: any = null;

  // Admin login
  async loginAdmin(email: string, password: string): Promise<{ success: boolean; admin?: any; error?: string }> {
    try {
      // Check credentials
      if (email === this.ADMIN_CREDENTIALS.email && password === this.ADMIN_CREDENTIALS.password) {
        this.currentAdmin = {
          id: 'admin_001',
          email: this.ADMIN_CREDENTIALS.email,
          displayName: this.ADMIN_CREDENTIALS.name,
          role: 'admin',
          loginTime: new Date(),
        };

        // Store in localStorage for persistence
        localStorage.setItem('admin_session', JSON.stringify(this.currentAdmin));

        return { 
          success: true, 
          admin: this.currentAdmin 
        };
      } else {
        return { 
          success: false, 
          error: 'Invalid email or password' 
        };
      }
    } catch (error) {
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