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

describe('EnhancedSecurityAuthService Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User'
      }

      const mockAuth = {
        currentUser: mockUser,
        signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: mockUser }),
        createUserWithEmailAndPassword: vi.fn().mockResolvedValue({ user: mockUser }),
        signOut: vi.fn().mockResolvedValue(undefined)
      }

      vi.mocked(require('firebase/auth').getAuth).mockReturnValue(mockAuth)

      // Test sign up
      const signUpResult = await EnhancedSecurityAuthService.secureSignUp(
        'test@example.com',
        'password123',
        'Test User'
      )

      expect(signUpResult.success).toBe(true)
      expect(signUpResult.user).toEqual(mockUser)

      // Test sign in
      const signInResult = await EnhancedSecurityAuthService.secureSignIn(
        'test@example.com',
        'password123'
      )

      expect(signInResult.success).toBe(true)
      expect(signInResult.user).toEqual(mockUser)

      // Test sign out
      const signOutResult = await EnhancedSecurityAuthService.secureSignOut()
      expect(signOutResult.success).toBe(true)
    })

    it('should handle authentication errors gracefully', async () => {
      const mockAuth = {
        signInWithEmailAndPassword: vi.fn().mockRejectedValue(new Error('Invalid credentials')),
        createUserWithEmailAndPassword: vi.fn().mockRejectedValue(new Error('Email already exists'))
      }

      vi.mocked(require('firebase/auth').getAuth).mockReturnValue(mockAuth)

      // Test sign in error
      const signInResult = await EnhancedSecurityAuthService.secureSignIn(
        'test@example.com',
        'wrongpassword'
      )

      expect(signInResult.success).toBe(false)
      expect(signInResult.error).toContain('Invalid credentials')

      // Test sign up error
      const signUpResult = await EnhancedSecurityAuthService.secureSignUp(
        'existing@example.com',
        'password123',
        'Test User'
      )

      expect(signUpResult.success).toBe(false)
      expect(signUpResult.error).toContain('Email already exists')
    })
  })

  describe('Security Features', () => {
    it('should implement account lockout after failed attempts', async () => {
      const mockAuth = {
        signInWithEmailAndPassword: vi.fn().mockRejectedValue(new Error('Invalid credentials'))
      }

      vi.mocked(require('firebase/auth').getAuth).mockReturnValue(mockAuth)

      // Simulate multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await EnhancedSecurityAuthService.secureSignIn(
          'test@example.com',
          'wrongpassword'
        )
      }

      // Should be locked out after 5 attempts
      const result = await EnhancedSecurityAuthService.secureSignIn(
        'test@example.com',
        'wrongpassword'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Account locked')
    })

    it('should detect suspicious activity', async () => {
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
  })

  describe('User Management', () => {
    it('should update user profile successfully', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User'
      }

      const mockAuth = {
        currentUser: mockUser,
        updateProfile: vi.fn().mockResolvedValue(undefined)
      }

      vi.mocked(require('firebase/auth').getAuth).mockReturnValue(mockAuth)

      const result = await EnhancedSecurityAuthService.updateUserProfile({
        displayName: 'Updated Name',
        photoURL: 'https://example.com/photo.jpg'
      })

      expect(result.success).toBe(true)
      expect(mockAuth.updateProfile).toHaveBeenCalledWith({
        displayName: 'Updated Name',
        photoURL: 'https://example.com/photo.jpg'
      })
    })

    it('should change password successfully', async () => {
      const mockAuth = {
        currentUser: {
          updatePassword: vi.fn().mockResolvedValue(undefined)
        }
      }

      vi.mocked(require('firebase/auth').getAuth).mockReturnValue(mockAuth)

      const result = await EnhancedSecurityAuthService.changePassword('newpassword123')

      expect(result.success).toBe(true)
      expect(mockAuth.currentUser.updatePassword).toHaveBeenCalledWith('newpassword123')
    })
  })
})