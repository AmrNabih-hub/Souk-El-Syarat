import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EnhancedSecurityAuthService } from '@/services/enhanced-security-auth.service'

// Mock Firebase
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  updatePassword: vi.fn(),
  sendPasswordResetEmail: vi.fn()
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn()
}))

describe('Authentication Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Account Lockout Security', () => {
    it('should lock account after 5 failed attempts', async () => {
      const mockAuth = {
        signInWithEmailAndPassword: vi.fn().mockRejectedValue(new Error('Invalid credentials'))
      }

      vi.mocked(require('firebase/auth').getAuth).mockReturnValue(mockAuth)

      // Simulate 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await EnhancedSecurityAuthService.secureSignIn('test@example.com', 'wrongpassword')
      }

      // 6th attempt should be locked
      const result = await EnhancedSecurityAuthService.secureSignIn('test@example.com', 'wrongpassword')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Account locked')
    })

    it('should unlock account after lockout period', async () => {
      const mockAuth = {
        signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: { uid: 'test-uid' } })
      }

      vi.mocked(require('firebase/auth').getAuth).mockReturnValue(mockAuth)

      // Mock time passage to unlock account
      vi.useFakeTimers()
      
      // Lock account
      for (let i = 0; i < 5; i++) {
        await EnhancedSecurityAuthService.secureSignIn('test@example.com', 'wrongpassword')
      }

      // Fast forward time past lockout period
      vi.advanceTimersByTime(30 * 60 * 1000) // 30 minutes

      // Should be able to sign in again
      const result = await EnhancedSecurityAuthService.secureSignIn('test@example.com', 'correctpassword')
      
      expect(result.success).toBe(true)
      
      vi.useRealTimers()
    })
  })

  describe('Suspicious Activity Detection', () => {
    it('should detect rapid login attempts from different IPs', async () => {
      const mockAuth = {
        signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: { uid: 'test-uid' } })
      }

      vi.mocked(require('firebase/auth').getAuth).mockReturnValue(mockAuth)

      // Simulate rapid login attempts from different IPs
      const promises = Array.from({ length: 10 }, (_, i) =>
        EnhancedSecurityAuthService.secureSignIn(
          `user${i}@example.com`,
          'password123'
        )
      )

      const results = await Promise.all(promises)
      
      // Should detect suspicious activity
      const suspiciousResults = results.filter(result => 
        result.error?.includes('Suspicious activity detected')
      )

      expect(suspiciousResults.length).toBeGreaterThan(0)
    })

    it('should detect unusual login patterns', async () => {
      const mockAuth = {
        signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: { uid: 'test-uid' } })
      }

      vi.mocked(require('firebase/auth').getAuth).mockReturnValue(mockAuth)

      // Simulate login at unusual hours (3 AM)
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-01T03:00:00Z'))

      const result = await EnhancedSecurityAuthService.secureSignIn(
        'test@example.com',
        'password123'
      )

      // Should flag as suspicious due to unusual time
      expect(result.warning).toContain('Unusual login time detected')
      
      vi.useRealTimers()
    })
  })

  describe('Password Security', () => {
    it('should enforce strong password requirements', async () => {
      const weakPasswords = [
        'password',
        '12345678',
        'Password',
        'password123',
        'P@ss'
      ]

      for (const password of weakPasswords) {
        const result = await EnhancedSecurityAuthService.secureSignUp(
          'test@example.com',
          password,
          'Test User'
        )

        expect(result.success).toBe(false)
        expect(result.error).toContain('Password does not meet security requirements')
      }
    })

    it('should detect common password patterns', async () => {
      const commonPasswords = [
        'password123',
        'qwerty123',
        'admin123',
        'welcome123'
      ]

      for (const password of commonPasswords) {
        const result = await EnhancedSecurityAuthService.secureSignUp(
          'test@example.com',
          password,
          'Test User'
        )

        expect(result.success).toBe(false)
        expect(result.error).toContain('Password is too common')
      }
    })

    it('should require password history check', async () => {
      const mockAuth = {
        currentUser: {
          updatePassword: vi.fn().mockResolvedValue(undefined)
        }
      }

      vi.mocked(require('firebase/auth').getAuth).mockReturnValue(mockAuth)

      // Mock previous password in history
      const result = await EnhancedSecurityAuthService.changePassword('oldpassword123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Cannot reuse previous password')
    })
  })

  describe('Session Security', () => {
    it('should implement secure session management', async () => {
      const mockAuth = {
        currentUser: { uid: 'test-uid' },
        signOut: vi.fn().mockResolvedValue(undefined)
      }

      vi.mocked(require('firebase/auth').getAuth).mockReturnValue(mockAuth)

      // Test session timeout
      vi.useFakeTimers()
      
      await EnhancedSecurityAuthService.secureSignIn('test@example.com', 'password123')
      
      // Fast forward past session timeout
      vi.advanceTimersByTime(24 * 60 * 60 * 1000) // 24 hours

      const isSessionValid = await EnhancedSecurityAuthService.validateSession()
      expect(isSessionValid).toBe(false)
      
      vi.useRealTimers()
    })

    it('should handle concurrent sessions', async () => {
      const mockAuth = {
        signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: { uid: 'test-uid' } })
      }

      vi.mocked(require('firebase/auth').getAuth).mockReturnValue(mockAuth)

      // Simulate multiple concurrent sessions
      const promises = Array.from({ length: 5 }, () =>
        EnhancedSecurityAuthService.secureSignIn('test@example.com', 'password123')
      )

      const results = await Promise.all(promises)
      
      // Should limit concurrent sessions
      const successfulResults = results.filter(result => result.success)
      expect(successfulResults.length).toBeLessThanOrEqual(3) // Max 3 concurrent sessions
    })
  })

  describe('Token Security', () => {
    it('should implement secure token management', async () => {
      const mockAuth = {
        currentUser: {
          getIdToken: vi.fn().mockResolvedValue('valid-token'),
          getIdTokenResult: vi.fn().mockResolvedValue({
            token: 'valid-token',
            expirationTime: Date.now() + 3600000 // 1 hour
          })
        }
      }

      vi.mocked(require('firebase/auth').getAuth).mockReturnValue(mockAuth)

      const token = await EnhancedSecurityAuthService.getValidToken()
      expect(token).toBe('valid-token')
    })

    it('should refresh expired tokens', async () => {
      const mockAuth = {
        currentUser: {
          getIdToken: vi.fn()
            .mockResolvedValueOnce('expired-token')
            .mockResolvedValueOnce('refreshed-token'),
          getIdTokenResult: vi.fn()
            .mockResolvedValueOnce({
              token: 'expired-token',
              expirationTime: Date.now() - 1000 // Expired
            })
            .mockResolvedValueOnce({
              token: 'refreshed-token',
              expirationTime: Date.now() + 3600000 // Valid
            })
        }
      }

      vi.mocked(require('firebase/auth').getAuth).mockReturnValue(mockAuth)

      const token = await EnhancedSecurityAuthService.getValidToken()
      expect(token).toBe('refreshed-token')
    })
  })

  describe('Input Validation Security', () => {
    it('should sanitize email input', async () => {
      const maliciousEmail = 'test@example.com<script>alert("XSS")</script>'
      
      const result = await EnhancedSecurityAuthService.secureSignIn(maliciousEmail, 'password123')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid email format')
    })

    it('should validate email format', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com'
      ]

      for (const email of invalidEmails) {
        const result = await EnhancedSecurityAuthService.secureSignIn(email, 'password123')
        
        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid email format')
      }
    })
  })

  describe('Audit Logging Security', () => {
    it('should log all authentication attempts', async () => {
      const mockFirestore = {
        collection: vi.fn().mockReturnValue({
          add: vi.fn().mockResolvedValue({ id: 'log-id' })
        })
      }

      vi.mocked(require('firebase/firestore').getFirestore).mockReturnValue(mockFirestore)

      await EnhancedSecurityAuthService.secureSignIn('test@example.com', 'password123')

      expect(mockFirestore.collection).toHaveBeenCalledWith('auditLogs')
    })

    it('should log security events', async () => {
      const mockFirestore = {
        collection: vi.fn().mockReturnValue({
          add: vi.fn().mockResolvedValue({ id: 'log-id' })
        })
      }

      vi.mocked(require('firebase/firestore').getFirestore).mockReturnValue(mockFirestore)

      // Simulate account lockout
      for (let i = 0; i < 5; i++) {
        await EnhancedSecurityAuthService.secureSignIn('test@example.com', 'wrongpassword')
      }

      expect(mockFirestore.collection).toHaveBeenCalledWith('securityEvents')
    })
  })
})