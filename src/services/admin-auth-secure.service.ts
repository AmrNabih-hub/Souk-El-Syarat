// 🔐 SECURE ADMIN AUTHENTICATION SERVICE
// Enterprise-grade security for production admin account

import { PRODUCTION_ADMIN_ACCOUNT } from '@/config/test-accounts.config';
import { 
  adminSecurityManager, 
  SECURE_ADMIN_CREDENTIALS,
  ADMIN_SECURITY_CONFIG,
  AdminSecurityUtils
} from '@/config/admin-security.config';

interface AdminSession {
  id: string;
  email: string;
  displayName: string;
  role: 'admin';
  loginTime: Date;
  isProductionAdmin: boolean;
  sessionToken?: string;
  securityLevel: 'high' | 'development';
}

/**
 * Secure Admin Authentication Service
 * Implements enterprise-level security for admin accounts
 */
class SecureAdminAuthService {
  private currentAdmin: AdminSession | null = null;

  // Legacy admin for development only
  private readonly DEV_ADMIN = {
    email: 'admin@soukel-syarat.com',
    password: 'SoukAdmin2024!@#',
    name: 'مدير النظام (تطوير)',
    role: 'admin'
  };

  /**
   * Secure admin login with multi-layer security
   */
  async loginAdmin(
    email: string, 
    password: string
  ): Promise<{ 
    success: boolean; 
    admin?: AdminSession; 
    error?: string;
    requires2FA?: boolean;
  }> {
    try {
      console.log('🔐 [SECURE] Attempting admin login...', { email });

      // 🔒 PRODUCTION ADMIN - Maximum Security
      if (email === PRODUCTION_ADMIN_ACCOUNT.email) {
        return await this.loginProductionAdmin(email, password);
      }

      // 🔓 DEVELOPMENT ADMIN - Development Only
      if (import.meta.env.DEV && email === this.DEV_ADMIN.email) {
        return this.loginDevelopmentAdmin(email, password);
      }

      console.warn('❌ [SECURE] Invalid admin email');
      return { 
        success: false, 
        error: 'Invalid admin credentials' 
      };

    } catch (error: any) {
      console.error('❌ [SECURE] Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Authentication error' 
      };
    }
  }

  /**
   * Production admin login with enterprise security
   */
  private async loginProductionAdmin(
    email: string, 
    password: string
  ): Promise<{ 
    success: boolean; 
    admin?: AdminSession; 
    error?: string;
    requires2FA?: boolean;
  }> {
    try {
      // Verify credentials with secure hashing
      const isValid = SECURE_ADMIN_CREDENTIALS.verify(email, password);
      
      if (!isValid) {
        return { 
          success: false, 
          error: 'Invalid credentials' 
        };
      }

      // Check if password rotation is needed
      if (AdminSecurityUtils.isPasswordRotationNeeded()) {
        console.warn('⚠️ Password rotation recommended');
      }

      // Create secure session with token
      const sessionToken = adminSecurityManager.createSession(email);
      
      this.currentAdmin = {
        id: 'admin_prod_001',
        email: PRODUCTION_ADMIN_ACCOUNT.email,
        displayName: PRODUCTION_ADMIN_ACCOUNT.displayName,
        role: 'admin',
        loginTime: new Date(),
        isProductionAdmin: true,
        sessionToken,
        securityLevel: 'high',
      };

      // Store encrypted session in sessionStorage (more secure than localStorage)
      this.storeSecureSession(this.currentAdmin);

      // Log successful authentication
      console.log('✅ [SECURE] Production admin authenticated');
      console.log(`🔒 [SECURE] Session timeout: ${ADMIN_SECURITY_CONFIG.SESSION_TIMEOUT / 60000}min`);
      console.log(`⏰ [SECURE] Idle timeout: ${ADMIN_SECURITY_CONFIG.MAX_IDLE_TIME / 60000}min`);
      
      // Check if 2FA is required (for future implementation)
      if (ADMIN_SECURITY_CONFIG.REQUIRE_2FA && import.meta.env.PROD) {
        return {
          success: true,
          admin: this.currentAdmin,
          requires2FA: true
        };
      }

      return { 
        success: true, 
        admin: this.currentAdmin 
      };

    } catch (error: any) {
      console.error('❌ [SECURE] Production admin login failed:', error.message);
      throw error;
    }
  }

  /**
   * Development admin login (simple authentication)
   */
  private loginDevelopmentAdmin(
    email: string, 
    password: string
  ): { success: boolean; admin?: AdminSession; error?: string } {
    if (password !== this.DEV_ADMIN.password) {
      return { 
        success: false, 
        error: 'Invalid development credentials' 
      };
    }

    this.currentAdmin = {
      id: 'admin_dev_001',
      email: this.DEV_ADMIN.email,
      displayName: this.DEV_ADMIN.name,
      role: 'admin',
      loginTime: new Date(),
      isProductionAdmin: false,
      securityLevel: 'development',
    };

    sessionStorage.setItem('admin_session_dev', JSON.stringify(this.currentAdmin));

    console.log('✅ [DEV] Development admin logged in');
    
    return { 
      success: true, 
      admin: this.currentAdmin 
    };
  }

  /**
   * Store encrypted session
   */
  private storeSecureSession(admin: AdminSession): void {
    try {
      const sessionData = {
        ...admin,
        timestamp: Date.now(),
      };

      const encrypted = adminSecurityManager.encrypt(JSON.stringify(sessionData));
      sessionStorage.setItem('admin_session_secure', encrypted);
      
      // Also store a flag for quick session check
      sessionStorage.setItem('admin_session_active', 'true');
    } catch (error) {
      console.error('Failed to store secure session:', error);
      throw new Error('Session storage failed');
    }
  }

  /**
   * Validate and refresh current session
   */
  validateSession(): boolean {
    // Quick check
    if (!sessionStorage.getItem('admin_session_active')) {
      return false;
    }

    // Check production admin secure session
    const secureSession = sessionStorage.getItem('admin_session_secure');
    if (secureSession) {
      try {
        const decrypted = adminSecurityManager.decrypt(secureSession);
        const session: AdminSession = JSON.parse(decrypted);
        
        // Validate session with security manager
        if (session.sessionToken && session.email) {
          const isValid = adminSecurityManager.validateSession(
            session.email, 
            session.sessionToken
          );
          
          if (isValid) {
            this.currentAdmin = session;
            return true;
          } else {
            // Session expired or invalid
            console.log('⏰ [SECURE] Session expired');
            this.logoutAdmin();
            return false;
          }
        }
      } catch (error) {
        console.warn('❌ [SECURE] Invalid session data');
        this.logoutAdmin();
        return false;
      }
    }

    // Check development session
    if (import.meta.env.DEV) {
      const devSession = sessionStorage.getItem('admin_session_dev');
      if (devSession) {
        try {
          this.currentAdmin = JSON.parse(devSession);
          return true;
        } catch {
          this.logoutAdmin();
          return false;
        }
      }
    }

    return false;
  }

  /**
   * Check if admin is logged in
   */
  isAdminLoggedIn(): boolean {
    if (this.currentAdmin) {
      return this.validateSession();
    }

    return this.validateSession();
  }

  /**
   * Get current admin
   */
  getCurrentAdmin(): AdminSession | null {
    if (!this.validateSession()) {
      return null;
    }

    return this.currentAdmin;
  }

  /**
   * Secure logout
   */
  logoutAdmin(): void {
    // End production admin session
    if (this.currentAdmin?.isProductionAdmin && this.currentAdmin?.sessionToken) {
      adminSecurityManager.endSession(this.currentAdmin.email);
      console.log('🔒 [SECURE] Production admin session ended');
    }
    
    // Clear all session data
    this.currentAdmin = null;
    sessionStorage.removeItem('admin_session_secure');
    sessionStorage.removeItem('admin_session_dev');
    sessionStorage.removeItem('admin_session_active');
    
    console.log('✅ [SECURE] Admin logged out');
  }

  /**
   * Verify admin session (for critical operations)
   */
  verifyAdminSession(): boolean {
    return this.validateSession();
  }

  /**
   * Require re-authentication for critical operations
   */
  async requireReAuth(password: string): Promise<boolean> {
    if (!this.currentAdmin) {
      return false;
    }

    if (!this.currentAdmin.isProductionAdmin) {
      return true; // Skip for development
    }

    try {
      return SECURE_ADMIN_CREDENTIALS.verify(
        this.currentAdmin.email, 
        password
      );
    } catch {
      return false;
    }
  }

  /**
   * Get security audit log
   */
  getSecurityAuditLog(limit: number = 50): Array<any> {
    return adminSecurityManager.getAuditLog(limit);
  }

  /**
   * Check security status
   */
  getSecurityStatus(): {
    isSecure: boolean;
    warnings: string[];
    info: {
      sessionTimeout: number;
      idleTimeout: number;
      maxLoginAttempts: number;
      passwordRotationDays: number;
      require2FA: boolean;
    };
  } {
    const warnings: string[] = [];

    // Check for password rotation
    if (AdminSecurityUtils.isPasswordRotationNeeded()) {
      warnings.push('Password rotation recommended');
    }

    // Check if 2FA is enabled in production
    if (import.meta.env.PROD && !ADMIN_SECURITY_CONFIG.REQUIRE_2FA) {
      warnings.push('Two-factor authentication is disabled');
    }

    // Check encryption key
    if (import.meta.env.VITE_ADMIN_ENCRYPTION_KEY === undefined) {
      warnings.push('Custom encryption key not set');
    }

    return {
      isSecure: warnings.length === 0,
      warnings,
      info: {
        sessionTimeout: ADMIN_SECURITY_CONFIG.SESSION_TIMEOUT / 60000,
        idleTimeout: ADMIN_SECURITY_CONFIG.MAX_IDLE_TIME / 60000,
        maxLoginAttempts: ADMIN_SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
        passwordRotationDays: ADMIN_SECURITY_CONFIG.PASSWORD_ROTATION_DAYS,
        require2FA: ADMIN_SECURITY_CONFIG.REQUIRE_2FA,
      }
    };
  }
}

// Export singleton instance
export const secureAdminAuthService = new SecureAdminAuthService();

// Also export for backward compatibility (will be migrated)
export { secureAdminAuthService as adminAuthService };

