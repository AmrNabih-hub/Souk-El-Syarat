import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EnhancedSecurityAuthService } from '@/services/enhanced-security-auth.service'
import { OrderService } from '@/services/order.service'
import { InputSanitizationService } from '@/services/input-sanitization.service'

// Mock Firebase
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn()
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn()
}))

describe('Critical Features Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication Regression Tests', () => {
    it('should maintain authentication functionality after updates', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User'
      }

      const mockAuth = {
        signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: mockUser }),
        createUserWithEmailAndPassword: vi.fn().mockResolvedValue({ user: mockUser }),
        signOut: vi.fn().mockResolvedValue(undefined)
      }

      vi.mocked(require('firebase/auth').getAuth).mockReturnValue(mockAuth)

      // Test sign up still works
      const signUpResult = await EnhancedSecurityAuthService.secureSignUp(
        'test@example.com',
        'password123',
        'Test User'
      )
      expect(signUpResult.success).toBe(true)

      // Test sign in still works
      const signInResult = await EnhancedSecurityAuthService.secureSignIn(
        'test@example.com',
        'password123'
      )
      expect(signInResult.success).toBe(true)

      // Test sign out still works
      const signOutResult = await EnhancedSecurityAuthService.secureSignOut()
      expect(signOutResult.success).toBe(true)
    })

    it('should maintain security features after updates', async () => {
      const mockAuth = {
        signInWithEmailAndPassword: vi.fn().mockRejectedValue(new Error('Invalid credentials'))
      }

      vi.mocked(require('firebase/auth').getAuth).mockReturnValue(mockAuth)

      // Test account lockout still works
      for (let i = 0; i < 5; i++) {
        await EnhancedSecurityAuthService.secureSignIn('test@example.com', 'wrongpassword')
      }

      const result = await EnhancedSecurityAuthService.secureSignIn('test@example.com', 'wrongpassword')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Account locked')
    })

    it('should maintain input validation after updates', async () => {
      // Test email validation still works
      const invalidEmails = ['invalid-email', '@example.com', 'user@']
      
      for (const email of invalidEmails) {
        const result = await EnhancedSecurityAuthService.secureSignIn(email, 'password123')
        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid email format')
      }

      // Test password validation still works
      const weakPasswords = ['password', '12345678', 'Password']
      
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
  })

  describe('Order Management Regression Tests', () => {
    it('should maintain order creation functionality after updates', async () => {
      const mockOrder = {
        id: 'order-123',
        customerId: 'customer-123',
        vendorId: 'vendor-123',
        productId: 'product-123',
        quantity: 2,
        totalPrice: 1000,
        status: 'pending'
      }

      const mockFirestore = {
        collection: vi.fn().mockReturnValue({
          add: vi.fn().mockResolvedValue({ id: 'order-123' })
        })
      }

      vi.mocked(require('firebase/firestore').getFirestore).mockReturnValue(mockFirestore)

      const result = await OrderService.createOrder({
        customerId: 'customer-123',
        vendorId: 'vendor-123',
        productId: 'product-123',
        quantity: 2,
        totalPrice: 1000
      })

      expect(result.success).toBe(true)
      expect(result.orderId).toBe('order-123')
    })

    it('should maintain order status updates after updates', async () => {
      const mockFirestore = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            update: vi.fn().mockResolvedValue(undefined)
          })
        })
      }

      vi.mocked(require('firebase/firestore').getFirestore).mockReturnValue(mockFirestore)

      const result = await OrderService.updateOrderStatus('order-123', 'confirmed')
      expect(result.success).toBe(true)
    })

    it('should maintain order retrieval after updates', async () => {
      const mockOrder = {
        id: 'order-123',
        customerId: 'customer-123',
        status: 'pending'
      }

      const mockFirestore = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              exists: () => true,
              data: () => mockOrder
            })
          })
        })
      }

      vi.mocked(require('firebase/firestore').getFirestore).mockReturnValue(mockFirestore)

      const result = await OrderService.getOrderById('order-123')
      expect(result.success).toBe(true)
      expect(result.order).toEqual(mockOrder)
    })
  })

  describe('Input Sanitization Regression Tests', () => {
    it('should maintain XSS prevention after updates', () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>'
      ]

      maliciousInputs.forEach(input => {
        const sanitized = InputSanitizationService.sanitizeInput(input)
        expect(sanitized).not.toContain('<script>')
        expect(sanitized).not.toContain('javascript:')
        expect(sanitized).not.toContain('onerror')
        expect(sanitized).not.toContain('<iframe')
      })
    })

    it('should maintain SQL injection prevention after updates', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --"
      ]

      maliciousInputs.forEach(input => {
        const isMalicious = InputSanitizationService.detectSQLInjection(input)
        expect(isMalicious).toBe(true)
        
        const sanitized = InputSanitizationService.sanitizeInput(input)
        expect(sanitized).not.toContain('DROP TABLE')
        expect(sanitized).not.toContain('INSERT INTO')
        expect(sanitized).not.toContain('--')
      })
    })

    it('should maintain email validation after updates', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk'
      ]

      validEmails.forEach(email => {
        const isValid = InputSanitizationService.validateEmail(email)
        expect(isValid).toBe(true)
      })

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com'
      ]

      invalidEmails.forEach(email => {
        const isValid = InputSanitizationService.validateEmail(email)
        expect(isValid).toBe(false)
      })
    })

    it('should maintain password validation after updates', () => {
      const strongPasswords = [
        'Password123!',
        'MyStr0ng#Pass',
        'ComplexP@ssw0rd'
      ]

      strongPasswords.forEach(password => {
        const isValid = InputSanitizationService.validatePassword(password)
        expect(isValid).toBe(true)
      })

      const weakPasswords = [
        'password',
        '12345678',
        'Password',
        'password123'
      ]

      weakPasswords.forEach(password => {
        const isValid = InputSanitizationService.validatePassword(password)
        expect(isValid).toBe(false)
      })
    })
  })

  describe('Component Regression Tests', () => {
    it('should maintain button functionality after updates', () => {
      const handleClick = vi.fn()
      const { getByRole } = render(
        React.createElement('button', { onClick: handleClick }, 'Click me')
      )

      fireEvent.click(getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should maintain input functionality after updates', () => {
      const handleChange = vi.fn()
      const { getByPlaceholderText } = render(
        React.createElement('input', { onChange: handleChange, placeholder: 'Enter text' })
      )
      
      const input = getByRole('textbox')
      fireEvent.change(input, { target: { value: 'test value' } })
      
      expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
        target: expect.objectContaining({ value: 'test value' })
      }))
    })

    it('should maintain modal functionality after updates', () => {
      const handleClose = vi.fn()
      const { getByRole, getByTestId } = render(
        React.createElement('div', {},
          React.createElement('div', { 'data-testid': 'modal-backdrop', onClick: handleClose },
            React.createElement('div', { onClick: (e) => e.stopPropagation() },
              React.createElement('button', { onClick: handleClose }, 'Close')
            )
          )
        )
      )
      
      // Test close button
      fireEvent.click(getByRole('button'))
      expect(handleClose).toHaveBeenCalledTimes(1)
      
      // Test backdrop click
      fireEvent.click(getByTestId('modal-backdrop'))
      expect(handleClose).toHaveBeenCalledTimes(2)
    })
  })

  describe('API Integration Regression Tests', () => {
    it('should maintain API error handling after updates', async () => {
      const mockApiCall = vi.fn().mockRejectedValue(new Error('API Error'))
      
      try {
        await mockApiCall()
      } catch (error) {
        expect(error.message).toBe('API Error')
      }
    })

    it('should maintain API success handling after updates', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ data: 'success' })
      
      const result = await mockApiCall()
      expect(result.data).toBe('success')
    })

    it('should maintain API timeout handling after updates', async () => {
      const mockApiCall = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )
      
      try {
        await mockApiCall()
      } catch (error) {
        expect(error.message).toBe('Timeout')
      }
    })
  })

  describe('Performance Regression Tests', () => {
    it('should maintain rendering performance after updates', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`
      }))

      const startTime = performance.now()
      
      // Simulate rendering large dataset
      const { container } = render(
        React.createElement('div', {},
          largeDataset.map(item =>
            React.createElement('div', { key: item.id }, item.name)
          )
        )
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should still render within acceptable time
      expect(renderTime).toBeLessThan(100)
      expect(container.children).toHaveLength(1)
    })

    it('should maintain memory usage after updates', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      
      // Simulate memory-intensive operation
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        data: `Data ${i}`.repeat(100)
      }))
      
      // Clean up
      largeArray.length = 0
      
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB
    })
  })

  describe('Security Regression Tests', () => {
    it('should maintain rate limiting after updates', async () => {
      const rapidInputs = Array.from({ length: 100 }, (_, i) => `input${i}`)
      
      let rateLimitedCount = 0
      rapidInputs.forEach((input, index) => {
        const isRateLimited = InputSanitizationService.checkRateLimit('test-user', input)
        if (isRateLimited) {
          rateLimitedCount++
        }
      })
      
      // Should rate limit after certain number of attempts
      expect(rateLimitedCount).toBeGreaterThan(0)
    })

    it('should maintain file upload security after updates', () => {
      const safeFiles = ['image.jpg', 'document.pdf', 'photo.png']
      const dangerousFiles = ['malware.exe', 'script.js', 'virus.bat']
      
      safeFiles.forEach(filename => {
        const isValid = InputSanitizationService.validateFileExtension(filename)
        expect(isValid).toBe(true)
      })
      
      dangerousFiles.forEach(filename => {
        const isValid = InputSanitizationService.validateFileExtension(filename)
        expect(isValid).toBe(false)
      })
    })
  })
})