/**
 * Admin Security Configuration
 */

export const adminSecurityConfig = {
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  passwordMinLength: 12,
  requireMFA: false,
  allowedIPs: [], // Empty = allow all
};

export default adminSecurityConfig;
