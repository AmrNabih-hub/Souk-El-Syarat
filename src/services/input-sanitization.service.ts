/**
 * Input Sanitization Service
 * Comprehensive XSS protection and input validation
 */

export interface SanitizationOptions {
  allowHTML?: boolean;
  maxLength?: number;
  stripScripts?: boolean;
  stripEventHandlers?: boolean;
  stripProtocols?: boolean;
  allowedTags?: string[];
  allowedAttributes?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
  warnings: string[];
}

export class InputSanitizationService {
  private static instance: InputSanitizationService;
  
  // Dangerous patterns to detect and remove
  private static readonly DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
    /<input\b[^<]*(?:(?!<\/input>)<[^<]*)*>/gi,
    /<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi,
    /<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi,
    /<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi,
    /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*>/gi,
    /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*>/gi,
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*>/gi,
  ];

  // Allowed HTML tags for safe content
  private static readonly ALLOWED_HTML_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre',
    'code', 'span', 'div', 'a', 'img'
  ];

  // Allowed HTML attributes
  private static readonly ALLOWED_HTML_ATTRIBUTES = [
    'href', 'title', 'alt', 'src', 'class', 'id', 'style'
  ];

  // Safe protocols
  private static readonly SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:'];

  static getInstance(): InputSanitizationService {
    if (!InputSanitizationService.instance) {
      InputSanitizationService.instance = new InputSanitizationService();
    }
    return InputSanitizationService.instance;
  }

  /**
   * Sanitize string input with XSS protection
   */
  static sanitizeString(
    input: string, 
    options: SanitizationOptions = {}
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitizedValue = input;

    try {
      // Check for null or undefined
      if (input === null || input === undefined) {
        return {
          isValid: false,
          sanitizedValue: '',
          errors: ['Input cannot be null or undefined'],
          warnings: []
        };
      }

      // Convert to string
      sanitizedValue = String(input);

      // Check length
      if (options.maxLength && sanitizedValue.length > options.maxLength) {
        errors.push(`Input exceeds maximum length of ${options.maxLength} characters`);
        sanitizedValue = sanitizedValue.substring(0, options.maxLength);
      }

      // Remove dangerous patterns
      if (options.stripScripts !== false) {
        for (const pattern of this.DANGEROUS_PATTERNS) {
          const originalLength = sanitizedValue.length;
          sanitizedValue = sanitizedValue.replace(pattern, '');
          if (sanitizedValue.length < originalLength) {
            warnings.push('Potentially dangerous content removed');
          }
        }
      }

      // Remove event handlers
      if (options.stripEventHandlers !== false) {
        sanitizedValue = sanitizedValue.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
      }

      // Remove dangerous protocols
      if (options.stripProtocols !== false) {
        sanitizedValue = sanitizedValue.replace(/javascript:/gi, '');
        sanitizedValue = sanitizedValue.replace(/vbscript:/gi, '');
        sanitizedValue = sanitizedValue.replace(/data:/gi, '');
      }

      // HTML sanitization
      if (options.allowHTML) {
        sanitizedValue = this.sanitizeHTML(sanitizedValue, options);
      } else {
        // Escape HTML entities
        sanitizedValue = this.escapeHTML(sanitizedValue);
      }

      // Trim whitespace
      sanitizedValue = sanitizedValue.trim();

      return {
        isValid: errors.length === 0,
        sanitizedValue,
        errors,
        warnings
      };

    } catch (error) {
      return {
        isValid: false,
        sanitizedValue: '',
        errors: [`Sanitization error: ${error}`],
        warnings: []
      };
    }
  }

  /**
   * Sanitize HTML content
   */
  private static sanitizeHTML(
    input: string, 
    options: SanitizationOptions
  ): string {
    const allowedTags = options.allowedTags || this.ALLOWED_HTML_TAGS;
    const allowedAttributes = options.allowedAttributes || this.ALLOWED_HTML_ATTRIBUTES;

    // Create a temporary DOM element for parsing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = input;

    // Recursively sanitize all elements
    this.sanitizeElement(tempDiv, allowedTags, allowedAttributes);

    return tempDiv.innerHTML;
  }

  /**
   * Recursively sanitize DOM elements
   */
  private static sanitizeElement(
    element: Element, 
    allowedTags: string[], 
    allowedAttributes: string[]
  ): void {
    // Get all child nodes
    const children = Array.from(element.childNodes);

    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element;
        const tagName = element.tagName.toLowerCase();

        // Check if tag is allowed
        if (!allowedTags.includes(tagName)) {
          // Replace with text content
          const textNode = document.createTextNode(element.textContent || '');
          element.parentNode?.replaceChild(textNode, element);
          continue;
        }

        // Sanitize attributes
        const attributes = Array.from(element.attributes);
        for (const attr of attributes) {
          if (!allowedAttributes.includes(attr.name.toLowerCase())) {
            element.removeAttribute(attr.name);
          } else if (attr.name.toLowerCase() === 'href' || attr.name.toLowerCase() === 'src') {
            // Validate URLs
            if (!this.isValidURL(attr.value)) {
              element.removeAttribute(attr.name);
            }
          }
        }

        // Recursively sanitize children
        this.sanitizeElement(element, allowedTags, allowedAttributes);
      }
    }
  }

  /**
   * Escape HTML entities
   */
  private static escapeHTML(input: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return input.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
  }

  /**
   * Validate URL
   */
  private static isValidURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.SAFE_PROTOCOLS.includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = this.sanitizeString(email, { maxLength: 254 });
    
    if (!emailRegex.test(sanitized.sanitizedValue)) {
      sanitized.errors.push('Invalid email format');
      sanitized.isValid = false;
    }

    return sanitized;
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitized = this.sanitizeString(password, { maxLength: 128 });

    if (sanitized.sanitizedValue.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(sanitized.sanitizedValue)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(sanitized.sanitizedValue)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(sanitized.sanitizedValue)) {
      errors.push('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(sanitized.sanitizedValue)) {
      warnings.push('Consider adding special characters for better security');
    }

    if (sanitized.sanitizedValue.length < 12) {
      warnings.push('Consider using a longer password (12+ characters)');
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: sanitized.sanitizedValue,
      errors,
      warnings
    };
  }

  /**
   * Validate phone number
   */
  static validatePhoneNumber(phone: string): ValidationResult {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const sanitized = this.sanitizeString(phone.replace(/[\s\-\(\)]/g, ''), { maxLength: 20 });
    
    if (!phoneRegex.test(sanitized.sanitizedValue)) {
      sanitized.errors.push('Invalid phone number format');
      sanitized.isValid = false;
    }

    return sanitized;
  }

  /**
   * Validate business name
   */
  static validateBusinessName(name: string): ValidationResult {
    const sanitized = this.sanitizeString(name, { 
      maxLength: 100,
      allowHTML: false 
    });

    if (sanitized.sanitizedValue.length < 2) {
      sanitized.errors.push('Business name must be at least 2 characters long');
      sanitized.isValid = false;
    }

    if (sanitized.sanitizedValue.length > 100) {
      sanitized.errors.push('Business name must be less than 100 characters');
      sanitized.isValid = false;
    }

    // Check for only special characters
    if (!/[a-zA-Z0-9]/.test(sanitized.sanitizedValue)) {
      sanitized.errors.push('Business name must contain at least one alphanumeric character');
      sanitized.isValid = false;
    }

    return sanitized;
  }

  /**
   * Validate product description
   */
  static validateProductDescription(description: string): ValidationResult {
    const sanitized = this.sanitizeString(description, { 
      maxLength: 2000,
      allowHTML: true,
      allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li']
    });

    if (sanitized.sanitizedValue.length < 10) {
      sanitized.errors.push('Product description must be at least 10 characters long');
      sanitized.isValid = false;
    }

    return sanitized;
  }

  /**
   * Validate address
   */
  static validateAddress(address: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate street
    const street = this.sanitizeString(address.street || '', { maxLength: 200 });
    if (!street.sanitizedValue || street.sanitizedValue.length < 5) {
      errors.push('Street address is required and must be at least 5 characters');
    }

    // Validate city
    const city = this.sanitizeString(address.city || '', { maxLength: 100 });
    if (!city.sanitizedValue || city.sanitizedValue.length < 2) {
      errors.push('City is required and must be at least 2 characters');
    }

    // Validate postal code
    const postalCode = this.sanitizeString(address.postalCode || '', { maxLength: 20 });
    if (!postalCode.sanitizedValue || postalCode.sanitizedValue.length < 3) {
      errors.push('Postal code is required and must be at least 3 characters');
    }

    // Validate country
    const country = this.sanitizeString(address.country || '', { maxLength: 100 });
    if (!country.sanitizedValue || country.sanitizedValue.length < 2) {
      errors.push('Country is required and must be at least 2 characters');
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: JSON.stringify({
        street: street.sanitizedValue,
        city: city.sanitizedValue,
        postalCode: postalCode.sanitizedValue,
        country: country.sanitizedValue,
        governorate: this.sanitizeString(address.governorate || '', { maxLength: 100 }).sanitizedValue
      }),
      errors,
      warnings
    };
  }

  /**
   * Validate numeric input
   */
  static validateNumber(
    input: string | number, 
    min?: number, 
    max?: number
  ): ValidationResult {
    const sanitized = this.sanitizeString(String(input), { maxLength: 20 });
    const errors: string[] = [];
    const warnings: string[] = [];

    const num = parseFloat(sanitized.sanitizedValue);
    
    if (isNaN(num)) {
      errors.push('Invalid number format');
      return { isValid: false, sanitizedValue: '0', errors, warnings };
    }

    if (min !== undefined && num < min) {
      errors.push(`Number must be at least ${min}`);
    }

    if (max !== undefined && num > max) {
      errors.push(`Number must be at most ${max}`);
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: num.toString(),
      errors,
      warnings
    };
  }

  /**
   * Validate file name
   */
  static validateFileName(fileName: string): ValidationResult {
    const sanitized = this.sanitizeString(fileName, { maxLength: 255 });
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for dangerous characters
    const dangerousChars = /[<>:"/\\|?*]/;
    if (dangerousChars.test(sanitized.sanitizedValue)) {
      errors.push('File name contains invalid characters');
    }

    // Check for reserved names
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    const nameWithoutExt = sanitized.sanitizedValue.split('.')[0].toUpperCase();
    if (reservedNames.includes(nameWithoutExt)) {
      errors.push('File name is reserved and cannot be used');
    }

    // Check length
    if (sanitized.sanitizedValue.length > 255) {
      errors.push('File name is too long (max 255 characters)');
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: sanitized.sanitizedValue,
      errors,
      warnings
    };
  }

  /**
   * Sanitize user input for display
   */
  static sanitizeForDisplay(input: string): string {
    return this.sanitizeString(input, {
      allowHTML: false,
      maxLength: 1000,
      stripScripts: true,
      stripEventHandlers: true,
      stripProtocols: true
    }).sanitizedValue;
  }

  /**
   * Sanitize user input for storage
   */
  static sanitizeForStorage(input: string): string {
    return this.sanitizeString(input, {
      allowHTML: false,
      maxLength: 5000,
      stripScripts: true,
      stripEventHandlers: true,
      stripProtocols: true
    }).sanitizedValue;
  }

  /**
   * Sanitize user input for search
   */
  static sanitizeForSearch(input: string): string {
    return this.sanitizeString(input, {
      allowHTML: false,
      maxLength: 100,
      stripScripts: true,
      stripEventHandlers: true,
      stripProtocols: true
    }).sanitizedValue.toLowerCase().trim();
  }
}

export default InputSanitizationService;