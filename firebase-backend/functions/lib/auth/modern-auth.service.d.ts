/**
 * Modern Authentication Service - 2025 Standards
 * Implements passwordless, biometric, and social authentication
 */
export declare class ModernAuthService {
    private db;
    private auth;
    private realtimeDb;
    private readonly JWT_SECRET;
    private readonly REFRESH_SECRET;
    /**
     * Initialize passwordless authentication
     */
    initPasswordlessAuth(email: string, deviceInfo: any): Promise<{
        success: boolean;
        challengeId?: string;
    }>;
    /**
     * Verify passwordless authentication
     */
    verifyPasswordlessAuth(challengeId: string, token: string): Promise<{
        success: boolean;
        authToken?: string;
        refreshToken?: string;
    }>;
    /**
     * Social authentication with multiple providers
     */
    socialAuth(provider: string, idToken: string): Promise<{
        success: boolean;
        authToken?: string;
        refreshToken?: string;
    }>;
    /**
     * Refresh authentication token
     */
    refreshAuthToken(refreshToken: string): Promise<{
        success: boolean;
        authToken?: string;
    }>;
    /**
     * Multi-factor authentication
     */
    initMFA(userId: string, method: 'sms' | 'totp' | 'email'): Promise<{
        success: boolean;
        secret?: string;
    }>;
    /**
     * Verify MFA code
     */
    verifyMFA(userId: string, code: string): Promise<boolean>;
    /**
     * Calculate risk score for authentication
     */
    private calculateRiskScore;
    /**
     * Generate backup codes for MFA
     */
    private generateBackupCodes;
    /**
     * Session management - logout
     */
    logout(userId: string): Promise<void>;
    /**
     * Check if session is valid
     */
    validateSession(token: string): Promise<{
        valid: boolean;
        user?: any;
    }>;
}
export declare const modernAuth: ModernAuthService;
//# sourceMappingURL=modern-auth.service.d.ts.map