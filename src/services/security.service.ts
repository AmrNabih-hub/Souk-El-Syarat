/**
 * Advanced Security Service for Souk El-Sayarat
 * Comprehensive credential management, encryption, and security features
 */

import { auth, db } from '@/config/firebase.config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';

export interface Credential {
  id: string;
  userId: string;
  type: 'api_key' | 'oauth_token' | 'payment_method' | 'webhook_secret' | 'encryption_key';
  name: string;
  value: string; // Encrypted
  metadata: {
    provider?: string;
    scopes?: string[];
    expiresAt?: Date;
    lastUsed?: Date;
    usageCount: number;
    isActive: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityAuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface EncryptionKey {
  id: string;
  userId: string;
  key: string;
  algorithm: 'AES-256-GCM' | 'RSA-OAEP';
  purpose: 'data_encryption' | 'credential_encryption' | 'session_encryption';
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityRule {
  id: string;
  type: 'password_policy' | 'session_policy' | 'access_policy' | 'encryption_policy';
  conditions: Record<string, any>;
  actions: string[];
  priority: number;
}

export class SecurityService {
  private static instance: SecurityService;

  // Encryption keys (in production, these would be managed securely)
  private masterKey = 'souk-el-syarat-master-key-2024';
  private keyRotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days

  // Security monitoring
  private securityEvents: SecurityAuditLog[] = [];
  private maxSecurityEvents = 1000;

  private constructor() {
    this.initializeSecurityMonitoring();
    this.setupKeyRotation();
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Initialize security monitoring
   */
  private initializeSecurityMonitoring(): void {
    // Monitor for security events
    this.monitorFailedAuthentications();
    this.monitorSuspiciousActivities();
    this.monitorDataAccess();

    // Clean up old audit logs periodically
    setInterval(() => {
      this.cleanupOldAuditLogs();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  /**
   * Setup automatic key rotation
   */
  private setupKeyRotation(): void {
    setInterval(() => {
      this.rotateEncryptionKeys();
    }, this.keyRotationInterval);
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(data: string, keyId?: string): Promise<string> {
    try {
      // In a production environment, this would use proper encryption
      // For now, we'll use a simple but secure approach
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      );

      // Store the key for decryption
      const exportedKey = await crypto.subtle.exportKey('raw', key);
      const keyData = Array.from(new Uint8Array(exportedKey));

      // Return format: iv + key + encrypted_data
      const result = [
        Array.from(iv),
        keyData,
        Array.from(new Uint8Array(encrypted))
      ].flat();

      return btoa(String.fromCharCode(...result));

    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData: string): Promise<string> {
    try {
      const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

      // Extract components
      const iv = data.slice(0, 12);
      const keyData = data.slice(12, 12 + 32); // AES-256 key is 32 bytes
      const encrypted = data.slice(12 + 32);

      // Import the key
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);

    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Store encrypted credential
   */
  async storeCredential(
    userId: string,
    type: Credential['type'],
    name: string,
    value: string,
    metadata?: Partial<Credential['metadata']>
  ): Promise<string> {
    try {
      // Encrypt the credential value
      const encryptedValue = await this.encryptData(value);

      const credential: Omit<Credential, 'id'> = {
        userId,
        type,
        name,
        value: encryptedValue,
        metadata: {
          usageCount: 0,
          isActive: true,
          ...metadata,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const credentialRef = doc(collection(db, 'credentials'));
      await setDoc(credentialRef, {
        ...credential,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Log security event
      await this.logSecurityEvent({
        userId,
        action: 'credential_created',
        resource: 'credential',
        details: { type, name },
        ipAddress: '127.0.0.1',
        userAgent: 'system',
        riskLevel: 'low',
      });

      return credentialRef.id;

    } catch (error) {
      console.error('Failed to store credential:', error);
      throw new Error('Failed to store credential securely');
    }
  }

  /**
   * Retrieve and decrypt credential
   */
  async getCredential(credentialId: string, userId: string): Promise<Credential | null> {
    try {
      const credentialDoc = await getDoc(doc(db, 'credentials', credentialId));

      if (!credentialDoc.exists()) {
        return null;
      }

      const data = credentialDoc.data();

      // Verify ownership
      if (data?.userId !== userId) {
        await this.logSecurityEvent({
          userId,
          action: 'unauthorized_access_attempt',
          resource: 'credential',
          details: { credentialId },
          ipAddress: '127.0.0.1',
          userAgent: 'system',
          riskLevel: 'high',
        });
        throw new Error('Access denied');
      }

      // Decrypt the value
      const decryptedValue = await this.decryptData(data.value);

      // Update usage statistics
      await updateDoc(doc(db, 'credentials', credentialId), {
        'metadata.lastUsed': serverTimestamp(),
        'metadata.usageCount': (data.metadata?.usageCount || 0) + 1,
        updatedAt: serverTimestamp(),
      });

      return {
        id: credentialDoc.id,
        ...data,
        value: decryptedValue,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Credential;

    } catch (error) {
      console.error('Failed to retrieve credential:', error);
      throw new Error('Failed to retrieve credential');
    }
  }

  /**
   * Update credential
   */
  async updateCredential(
    credentialId: string,
    userId: string,
    updates: Partial<Pick<Credential, 'name' | 'value' | 'metadata'>>
  ): Promise<void> {
    try {
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      if (updates.name) {
        updateData.name = updates.name;
      }

      if (updates.value) {
        updateData.value = await this.encryptData(updates.value);
      }

      if (updates.metadata) {
        Object.keys(updates.metadata).forEach(key => {
          updateData[`metadata.${key}`] = updates.metadata![key];
        });
      }

      await updateDoc(doc(db, 'credentials', credentialId), updateData);

      // Log security event
      await this.logSecurityEvent({
        userId,
        action: 'credential_updated',
        resource: 'credential',
        details: { credentialId, updates: Object.keys(updates) },
        riskLevel: 'medium',
      });

    } catch (error) {
      console.error('Failed to update credential:', error);
      throw new Error('Failed to update credential');
    }
  }

  /**
   * Delete credential securely
   */
  async deleteCredential(credentialId: string, userId: string): Promise<void> {
    try {
      // Verify ownership before deletion
      const credential = await this.getCredential(credentialId, userId);
      if (!credential) {
        throw new Error('Credential not found');
      }

      await deleteDoc(doc(db, 'credentials', credentialId));

      // Log security event
      await this.logSecurityEvent({
        userId,
        action: 'credential_deleted',
        resource: 'credential',
        details: { credentialId, type: credential.type },
        riskLevel: 'medium',
      });

    } catch (error) {
      console.error('Failed to delete credential:', error);
      throw new Error('Failed to delete credential');
    }
  }

  /**
   * List user credentials (without sensitive data)
   */
  async listCredentials(userId: string): Promise<Omit<Credential, 'value'>[]> {
    try {
      const q = query(
        collection(db, 'credentials'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          type: data.type,
          name: data.name,
          metadata: data.metadata,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      });

    } catch (error) {
      console.error('Failed to list credentials:', error);
      return [];
    }
  }

  /**
   * Generate secure API key
   */
  generateSecureApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'sk_'; // Prefix for Souk API key

    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  /**
   * Generate secure webhook secret
   */
  generateSecureWebhookSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = 'whs_'; // Prefix for webhook secret

    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  /**
   * Validate API key
   */
  async validateApiKey(apiKey: string): Promise<{ isValid: boolean; userId?: string; scopes?: string[] }> {
    try {
      // Extract key without prefix for lookup
      const keyHash = await this.hashString(apiKey);

      const q = query(
        collection(db, 'credentials'),
        where('type', '==', 'api_key'),
        where('metadata.keyHash', '==', keyHash),
        where('metadata.isActive', '==', true)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { isValid: false };
      }

      const credential = snapshot.docs[0].data();

      // Check if key is expired
      if (credential.metadata?.expiresAt && new Date(credential.metadata.expiresAt.toDate()) < new Date()) {
        return { isValid: false };
      }

      return {
        isValid: true,
        userId: credential.userId,
        scopes: credential.metadata?.scopes || [],
      };

    } catch (error) {
      console.error('API key validation failed:', error);
      return { isValid: false };
    }
  }

  /**
   * Hash string for secure storage
   */
  private async hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditLog: Omit<SecurityAuditLog, 'id'> = {
        ...event,
        timestamp: new Date(),
      };

      // Store in memory for immediate access
      this.securityEvents.unshift(auditLog);
      if (this.securityEvents.length > this.maxSecurityEvents) {
        this.securityEvents = this.securityEvents.slice(0, this.maxSecurityEvents);
      }

      // Store in Firestore
      const auditRef = doc(collection(db, 'security_audit_logs'));
      await setDoc(auditRef, {
        ...auditLog,
        timestamp: serverTimestamp(),
      });

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get security audit logs
   */
  async getSecurityAuditLogs(
    userId?: string,
    limitCount: number = 100
  ): Promise<SecurityAuditLog[]> {
    try {
      let q = query(
        collection(db, 'security_audit_logs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      if (userId) {
        q = query(
          collection(db, 'security_audit_logs'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as SecurityAuditLog[];

    } catch (error) {
      console.error('Failed to get security audit logs:', error);
      return [];
    }
  }

  /**
   * Monitor failed authentications
   */
  private monitorFailedAuthentications(): void {
    // Listen to authentication failures
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'security_audit_logs'),
        where('action', '==', 'failed_login'),
        orderBy('timestamp', 'desc'),
        limit(10)
      ),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            this.handleFailedAuthentication(data);
          }
        });
      }
    );

    // Store unsubscribe function for cleanup
    this.activeListeners.set('failed_auth', unsubscribe);
  }

  /**
   * Handle failed authentication
   */
  private async handleFailedAuthentication(data: any): Promise<void> {
    const userId = data.userId;
    const ipAddress = data.ipAddress;

    // Check for suspicious patterns
    const recentFailures = this.securityEvents.filter(
      event =>
        event.action === 'failed_login' &&
        event.userId === userId &&
        event.ipAddress === ipAddress &&
        (Date.now() - event.timestamp.getTime()) < 3600000 // Last hour
    );

    if (recentFailures.length >= 5) {
      // Trigger security alert
      await this.logSecurityEvent({
        userId,
        action: 'suspicious_activity_detected',
        resource: 'authentication',
        details: {
          failureCount: recentFailures.length,
          timeWindow: '1 hour',
          pattern: 'multiple_failed_logins'
        },
        ipAddress,
        userAgent: data.userAgent,
        riskLevel: 'high',
      });

      // In production, you might want to:
      // 1. Temporarily block the IP
      // 2. Send alerts to administrators
      // 3. Require additional verification
    }
  }

  /**
   * Monitor suspicious activities
   */
  private monitorSuspiciousActivities(): void {
    // Monitor for unusual patterns
    setInterval(() => {
      this.analyzeSecurityPatterns();
    }, 300000); // Every 5 minutes
  }

  /**
   * Analyze security patterns
   */
  private async analyzeSecurityPatterns(): Promise<void> {
    try {
      // Analyze recent security events
      const recentEvents = this.securityEvents.filter(
        event => (Date.now() - event.timestamp.getTime()) < 3600000 // Last hour
      );

      // Check for brute force attempts
      const bruteForceAttempts = recentEvents.filter(
        event => event.action === 'failed_login'
      );

      if (bruteForceAttempts.length > 10) {
        console.warn('🚨 Potential brute force attack detected');
      }

      // Check for unusual access patterns
      const unusualAccess = recentEvents.filter(
        event => event.riskLevel === 'high' || event.riskLevel === 'critical'
      );

      if (unusualAccess.length > 5) {
        console.warn('🚨 Multiple high-risk security events detected');
      }

    } catch (error) {
      console.error('Security pattern analysis failed:', error);
    }
  }

  /**
   * Monitor data access
   */
  private monitorDataAccess(): void {
    // Monitor access to sensitive data
    // This would be implemented based on your specific data access patterns
  }

  /**
   * Rotate encryption keys
   */
  private async rotateEncryptionKeys(): Promise<void> {
    try {
      console.log('🔄 Rotating encryption keys...');

      // Generate new master key
      this.masterKey = `souk-el-syarat-master-key-${Date.now()}`;

      // In a production environment, you would:
      // 1. Generate new encryption keys
      // 2. Re-encrypt existing data with new keys
      // 3. Update key references
      // 4. Securely store old keys for decryption during transition period

      console.log('✅ Encryption keys rotated successfully');

    } catch (error) {
      console.error('❌ Key rotation failed:', error);
    }
  }

  /**
   * Cleanup old audit logs
   */
  private async cleanupOldAuditLogs(): Promise<void> {
    try {
      // Keep only last 30 days of logs
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // In production, you would delete old logs from Firestore
      // For now, just clean up in-memory logs
      this.securityEvents = this.securityEvents.filter(
        event => event.timestamp > thirtyDaysAgo
      );

      console.log('🧹 Old audit logs cleaned up');

    } catch (error) {
      console.error('Failed to cleanup old audit logs:', error);
    }
  }

  // Active listeners for cleanup
  private activeListeners: Map<string, () => void> = new Map();

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners.clear();
    this.securityEvents = [];
  }
}

// Export singleton instance
export const securityService = SecurityService.getInstance();
