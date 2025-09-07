/**
 * Input Sanitization Service
 * Comprehensive XSS protection and input validation
 */

export interface SanitizationResult {
  isValid: boolean;
  sanitizedValue: string;
  originalValue: string;
  errors: string[];
  warnings: string[];
}

export interface ValidationRules {
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  required?: boolean;
  allowHTML?: boolean;
  allowedTags?: string[];
  allowedAttributes?: string[];
}

export class InputSanitizationService {
  private static readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
    /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    /vbscript:/gi,
    /data:/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /@import/gi,
  ];

  private static readonly ALLOWED_HTML_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre',
    'code', 'span', 'div', 'a', 'img'
  ];

  private static readonly ALLOWED_ATTRIBUTES = [
    'href', 'title', 'alt', 'src', 'class', 'id', 'target'
  ];

  /**
   * Sanitize string input to prevent XSS attacks
   */
  static sanitizeString(input: string): SanitizationResult {
    const originalValue = input;
    let sanitizedValue = input;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input || typeof input !== 'string') {
      return {
        isValid: false,
        sanitizedValue: '',
        originalValue: input || '',
        errors: ['Input must be a non-empty string'],
        warnings: []
      };
    }

    // Remove XSS patterns
    for (const pattern of this.XSS_PATTERNS) {
      if (pattern.test(sanitizedValue)) {
        warnings.push(`Potentially malicious content detected and removed: ${pattern.source}`);
        sanitizedValue = sanitizedValue.replace(pattern, '');
      }
    }

    // Remove null bytes
    sanitizedValue = sanitizedValue.replace(/\0/g, '');

    // Trim whitespace
    sanitizedValue = sanitizedValue.trim();

    // Check for suspicious patterns
    if (this.containsSuspiciousPatterns(sanitizedValue)) {
      errors.push('Input contains suspicious patterns');
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue,
      originalValue,
      errors,
      warnings
    };
  }

  /**
   * Sanitize HTML input with allowed tags
   */
  static sanitizeHTML(input: string, allowedTags: string[] = this.ALLOWED_HTML_TAGS): SanitizationResult {
    const stringResult = this.sanitizeString(input);
    
    if (!stringResult.isValid) {
      return stringResult;
    }

    let sanitizedValue = stringResult.sanitizedValue;
    const errors: string[] = [...stringResult.errors];
    const warnings: string[] = [...stringResult.warnings];

    // Remove all HTML tags not in allowed list
    const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^<>]*>/g;
    let match;
    const foundTags = new Set<string>();

    while ((match = tagPattern.exec(sanitizedValue)) !== null) {
      const tagName = match[1].toLowerCase();
      foundTags.add(tagName);
      
      if (!allowedTags.includes(tagName)) {
        warnings.push(`Disallowed HTML tag removed: <${tagName}>`);
        sanitizedValue = sanitizedValue.replace(match[0], '');
      }
    }

    // Remove dangerous attributes
    const attrPattern = /\s([a-zA-Z][a-zA-Z0-9]*)\s*=/g;
    while ((match = attrPattern.exec(sanitizedValue)) !== null) {
      const attrName = match[1].toLowerCase();
      if (!this.ALLOWED_ATTRIBUTES.includes(attrName)) {
        warnings.push(`Disallowed attribute removed: ${attrName}`);
        sanitizedValue = sanitizedValue.replace(new RegExp(`\\s${attrName}\\s*=[^\\s>]*`, 'g'), '');
      }
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue,
      originalValue: input,
      errors,
      warnings
    };
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): SanitizationResult {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    const sanitized = this.sanitizeString(email);
    
    if (!sanitized.isValid) {
      return sanitized;
    }

    const isValid = emailRegex.test(sanitized.sanitizedValue);
    
    return {
      isValid,
      sanitizedValue: sanitized.sanitizedValue,
      originalValue: email,
      errors: isValid ? [] : ['Invalid email format'],
      warnings: sanitized.warnings
    };
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): SanitizationResult {
    const sanitized = this.sanitizeString(password);
    
    if (!sanitized.isValid) {
      return sanitized;
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      warnings.push('Password should contain at least one special character (@$!%*?&)');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common, please choose a stronger password');
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: sanitized.sanitizedValue,
      originalValue: password,
      errors,
      warnings
    };
  }

  /**
   * Validate phone number
   */
  static validatePhoneNumber(phone: string): SanitizationResult {
    const sanitized = this.sanitizeString(phone);
    
    if (!sanitized.isValid) {
      return sanitized;
    }

    // Remove all non-digit characters
    const digitsOnly = sanitized.sanitizedValue.replace(/\D/g, '');
    
    // Egyptian phone number validation
    const egyptianPhoneRegex = /^(01[0-9]{9}|20[0-9]{8})$/;
    const isValid = egyptianPhoneRegex.test(digitsOnly);

    return {
      isValid,
      sanitizedValue: digitsOnly,
      originalValue: phone,
      errors: isValid ? [] : ['Invalid Egyptian phone number format'],
      warnings: sanitized.warnings
    };
  }

  /**
   * Validate and sanitize user input with custom rules
   */
  static validateInput(input: string, rules: ValidationRules): SanitizationResult {
    const sanitized = this.sanitizeString(input);
    
    if (!sanitized.isValid) {
      return sanitized;
    }

    const errors: string[] = [...sanitized.errors];
    const warnings: string[] = [...sanitized.warnings];

    // Check required
    if (rules.required && !sanitized.sanitizedValue) {
      errors.push('This field is required');
    }

    // Check length
    if (rules.minLength && sanitized.sanitizedValue.length < rules.minLength) {
      errors.push(`Minimum length is ${rules.minLength} characters`);
    }

    if (rules.maxLength && sanitized.sanitizedValue.length > rules.maxLength) {
      errors.push(`Maximum length is ${rules.maxLength} characters`);
    }

    // Check pattern
    if (rules.pattern && !rules.pattern.test(sanitized.sanitizedValue)) {
      errors.push('Input does not match required format');
    }

    // Sanitize HTML if needed
    let finalValue = sanitized.sanitizedValue;
    if (rules.allowHTML && rules.allowedTags) {
      const htmlResult = this.sanitizeHTML(sanitized.sanitizedValue, rules.allowedTags);
      finalValue = htmlResult.sanitizedValue;
      errors.push(...htmlResult.errors);
      warnings.push(...htmlResult.warnings);
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: finalValue,
      originalValue: input,
      errors,
      warnings
    };
  }

  /**
   * Sanitize object with multiple fields
   */
  static sanitizeObject<T extends Record<string, any>>(
    obj: T,
    fieldRules: Partial<Record<keyof T, ValidationRules>>
  ): { isValid: boolean; sanitizedObject: T; errors: Record<string, string[]> } {
    const sanitizedObject = { ...obj };
    const errors: Record<string, string[]> = {};
    let isValid = true;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        const rules = fieldRules[key as keyof T] || {};
        const result = this.validateInput(value, rules);
        
        if (!result.isValid) {
          isValid = false;
          errors[key] = result.errors;
        }
        
        sanitizedObject[key as keyof T] = result.sanitizedValue as T[keyof T];
      }
    }

    return { isValid, sanitizedObject, errors };
  }

  /**
   * Check for suspicious patterns
   */
  private static containsSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /eval\s*\(/gi,
      /function\s*\(/gi,
      /setTimeout\s*\(/gi,
      /setInterval\s*\(/gi,
      /document\./gi,
      /window\./gi,
      /location\./gi,
      /history\./gi,
      /navigator\./gi,
      /screen\./gi,
      /alert\s*\(/gi,
      /confirm\s*\(/gi,
      /prompt\s*\(/gi,
      /console\./gi,
      /localStorage/gi,
      /sessionStorage/gi,
      /cookies/gi,
      /document\.cookie/gi,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Escape HTML entities
   */
  static escapeHTML(input: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
  }

  /**
   * Unescape HTML entities
   */
  static unescapeHTML(input: string): string {
    const htmlEntities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x2F;': '/',
    };

    return input.replace(/&[a-zA-Z0-9#]+;/g, (entity) => htmlEntities[entity] || entity);
  }
}

export default InputSanitizationService;