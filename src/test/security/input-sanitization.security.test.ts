import { describe, it, expect, vi } from 'vitest'
import { InputSanitizationService } from '@/services/input-sanitization.service'

describe('InputSanitizationService Security Tests', () => {
  describe('XSS Prevention', () => {
    it('should sanitize script tags', () => {
      const maliciousInput = '<script>alert("XSS")</script>'
      const sanitized = InputSanitizationService.sanitizeInput(maliciousInput)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
    })

    it('should sanitize javascript: URLs', () => {
      const maliciousInput = 'javascript:alert("XSS")'
      const sanitized = InputSanitizationService.sanitizeInput(maliciousInput)
      expect(sanitized).not.toContain('javascript:')
    })

    it('should sanitize on* event handlers', () => {
      const maliciousInput = '<img src="x" onerror="alert(\'XSS\')">'
      const sanitized = InputSanitizationService.sanitizeInput(maliciousInput)
      expect(sanitized).not.toContain('onerror')
    })

    it('should sanitize iframe tags', () => {
      const maliciousInput = '<iframe src="javascript:alert(\'XSS\')"></iframe>'
      const sanitized = InputSanitizationService.sanitizeInput(maliciousInput)
      expect(sanitized).not.toContain('<iframe')
    })

    it('should sanitize object and embed tags', () => {
      const maliciousInput = '<object data="javascript:alert(\'XSS\')"></object>'
      const sanitized = InputSanitizationService.sanitizeInput(maliciousInput)
      expect(sanitized).not.toContain('<object')
    })
  })

  describe('SQL Injection Prevention', () => {
    it('should detect SQL injection patterns', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "' UNION SELECT * FROM users --"
      ]

      maliciousInputs.forEach(input => {
        const isMalicious = InputSanitizationService.detectSQLInjection(input)
        expect(isMalicious).toBe(true)
      })
    })

    it('should sanitize SQL injection attempts', () => {
      const maliciousInput = "'; DROP TABLE users; --"
      const sanitized = InputSanitizationService.sanitizeInput(maliciousInput)
      expect(sanitized).not.toContain('DROP TABLE')
      expect(sanitized).not.toContain('--')
    })
  })

  describe('HTML Sanitization', () => {
    it('should allow safe HTML tags', () => {
      const safeInput = '<p>Hello <strong>world</strong>!</p>'
      const sanitized = InputSanitizationService.sanitizeInput(safeInput)
      expect(sanitized).toContain('<p>')
      expect(sanitized).toContain('<strong>')
      expect(sanitized).toContain('</strong>')
      expect(sanitized).toContain('</p>')
    })

    it('should remove dangerous HTML attributes', () => {
      const maliciousInput = '<div onclick="alert(\'XSS\')" style="background: red;">Content</div>'
      const sanitized = InputSanitizationService.sanitizeInput(maliciousInput)
      expect(sanitized).not.toContain('onclick')
      expect(sanitized).toContain('Content')
    })

    it('should sanitize CSS expressions', () => {
      const maliciousInput = '<div style="background: expression(alert(\'XSS\'))">Content</div>'
      const sanitized = InputSanitizationService.sanitizeInput(maliciousInput)
      expect(sanitized).not.toContain('expression')
    })
  })

  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@subdomain.example.com'
      ]

      validEmails.forEach(email => {
        const isValid = InputSanitizationService.validateEmail(email)
        expect(isValid).toBe(true)
      })
    })

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@.com',
        'user@example..com'
      ]

      invalidEmails.forEach(email => {
        const isValid = InputSanitizationService.validateEmail(email)
        expect(isValid).toBe(false)
      })
    })

    it('should sanitize email input', () => {
      const maliciousEmail = 'user@example.com<script>alert("XSS")</script>'
      const sanitized = InputSanitizationService.sanitizeEmail(maliciousEmail)
      expect(sanitized).toBe('user@example.com')
    })
  })

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'Password123!',
        'MyStr0ng#Pass',
        'ComplexP@ssw0rd',
        'Secure123$'
      ]

      strongPasswords.forEach(password => {
        const isValid = InputSanitizationService.validatePassword(password)
        expect(isValid).toBe(true)
      })
    })

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'password',
        '12345678',
        'Password',
        'password123',
        'P@ss',
        'password!'
      ]

      weakPasswords.forEach(password => {
        const isValid = InputSanitizationService.validatePassword(password)
        expect(isValid).toBe(false)
      })
    })
  })

  describe('Phone Number Validation', () => {
    it('should validate correct phone numbers', () => {
      const validPhones = [
        '+201234567890',
        '01234567890',
        '+20 12 3456 7890',
        '0123-456-7890'
      ]

      validPhones.forEach(phone => {
        const isValid = InputSanitizationService.validatePhoneNumber(phone)
        expect(isValid).toBe(true)
      })
    })

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123',
        'abc123',
        '+12345678901234567890',
        'phone'
      ]

      invalidPhones.forEach(phone => {
        const isValid = InputSanitizationService.validatePhoneNumber(phone)
        expect(isValid).toBe(false)
      })
    })
  })

  describe('File Upload Security', () => {
    it('should validate safe file extensions', () => {
      const safeFiles = [
        'image.jpg',
        'document.pdf',
        'photo.png',
        'file.docx'
      ]

      safeFiles.forEach(filename => {
        const isValid = InputSanitizationService.validateFileExtension(filename)
        expect(isValid).toBe(true)
      })
    })

    it('should reject dangerous file extensions', () => {
      const dangerousFiles = [
        'malware.exe',
        'script.js',
        'virus.bat',
        'hack.php',
        'backdoor.sh'
      ]

      dangerousFiles.forEach(filename => {
        const isValid = InputSanitizationService.validateFileExtension(filename)
        expect(isValid).toBe(false)
      })
    })
  })

  describe('Rate Limiting Detection', () => {
    it('should detect rapid input attempts', () => {
      const rapidInputs = Array.from({ length: 100 }, (_, i) => `input${i}`)
      
      rapidInputs.forEach((input, index) => {
        const isRateLimited = InputSanitizationService.checkRateLimit('test-user', input)
        if (index >= 50) { // After 50 attempts
          expect(isRateLimited).toBe(true)
        }
      })
    })
  })
})