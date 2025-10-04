/**
 * 🔍 Validation Helpers
 * Comprehensive validation utilities with Arabic support
 */

// Egyptian phone number validation
export const validateEgyptianPhone = (phone: string): boolean => {
  // Format: 01X XXXX XXXX (11 digits starting with 01)
  const phoneRegex = /^01[0-2|5]\d{8}$/;
  const cleaned = phone.replace(/\s|-/g, '');
  return phoneRegex.test(cleaned);
};

// Email validation (enhanced)
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Password strength validation
export interface PasswordStrength {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong' | 'very_strong';
  score: number;
  feedback: string[];
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters');
  }

  if (password.length >= 12) {
    score += 1;
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add uppercase letters');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add lowercase letters');
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add numbers');
  }

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add special characters');
  }

  // Determine strength
  let strength: PasswordStrength['strength'] = 'weak';
  if (score >= 6) strength = 'very_strong';
  else if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';

  return {
    isValid: score >= 4,
    strength,
    score,
    feedback,
  };
};

// Price validation (Egyptian Pound)
export const validatePrice = (price: number): boolean => {
  return price > 0 && price < 100000000 && Number.isFinite(price);
};

// Year validation for cars
export const validateCarYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear();
  return year >= 1990 && year <= currentYear + 1;
};

// Mileage validation
export const validateMileage = (mileage: number): boolean => {
  return mileage >= 0 && mileage <= 1000000;
};

// VIN validation (Vehicle Identification Number)
export const validateVIN = (vin: string): boolean => {
  // VIN is 17 characters, no I, O, Q
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
  return vinRegex.test(vin);
};

// License plate validation (Egyptian format)
export const validateLicensePlate = (plate: string): boolean => {
  // Egyptian format: letters + numbers (flexible)
  const plateRegex = /^[\u0621-\u064A\u0660-\u0669A-Za-z0-9\s]{3,15}$/;
  return plateRegex.test(plate);
};

// National ID validation (Egyptian)
export const validateEgyptianNationalId = (id: string): boolean => {
  // 14 digits
  const idRegex = /^\d{14}$/;
  if (!idRegex.test(id)) return false;

  // Check birth date embedded in ID (first 7 digits)
  const century = parseInt(id[0]);
  const year = parseInt(id.substring(1, 3));
  const month = parseInt(id.substring(3, 5));
  const day = parseInt(id.substring(5, 7));

  // Validate month and day
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  return true;
};

// Business license validation
export const validateBusinessLicense = (license: string): boolean => {
  // Basic format validation (can be enhanced based on actual format)
  return license.length >= 5 && license.length <= 20;
};

// Tax ID validation
export const validateTaxId = (taxId: string): boolean => {
  // Egyptian tax ID is 9 digits
  const taxIdRegex = /^\d{9}$/;
  return taxIdRegex.test(taxId);
};

// URL validation
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Sanitize string (remove dangerous characters)
export const sanitizeString = (str: string): string => {
  return str
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
};

// Validate file size
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Validate file type
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

// Validate image dimensions
export const validateImageDimensions = async (
  file: File,
  minWidth: number,
  minHeight: number,
  maxWidth?: number,
  maxHeight?: number
): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const valid =
        img.width >= minWidth &&
        img.height >= minHeight &&
        (!maxWidth || img.width <= maxWidth) &&
        (!maxHeight || img.height <= maxHeight);
      resolve(valid);
    };
    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
};

// Format price (Egyptian format)
export const formatEgyptianPrice = (price: number): string => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Format phone number (Egyptian format)
export const formatEgyptianPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

// Validate address
export interface AddressValidation {
  isValid: boolean;
  errors: string[];
}

export const validateAddress = (address: {
  governorate?: string;
  city?: string;
  area?: string;
  street?: string;
}): AddressValidation => {
  const errors: string[] = [];

  if (!address.governorate || address.governorate.length < 2) {
    errors.push('Governorate is required');
  }
  if (!address.city || address.city.length < 2) {
    errors.push('City is required');
  }
  if (!address.area || address.area.length < 2) {
    errors.push('Area is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Check if string contains Arabic
export const containsArabic = (str: string): boolean => {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(str);
};

// Validate rating (1-5)
export const validateRating = (rating: number): boolean => {
  return rating >= 1 && rating <= 5 && Number.isInteger(rating);
};

// Validate quantity
export const validateQuantity = (quantity: number): boolean => {
  return quantity > 0 && quantity <= 10000 && Number.isInteger(quantity);
};

// Debounce function for validation
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Batch validation
export interface ValidationRule<T> {
  field: keyof T;
  validator: (value: any) => boolean;
  message: string;
}

export function validateBatch<T>(
  data: T,
  rules: ValidationRule<T>[]
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const rule of rules) {
    const value = data[rule.field];
    if (!rule.validator(value)) {
      errors[rule.field as string] = rule.message;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Export all validators
export default {
  validateEgyptianPhone,
  validateEmail,
  validatePasswordStrength,
  validatePrice,
  validateCarYear,
  validateMileage,
  validateVIN,
  validateLicensePlate,
  validateEgyptianNationalId,
  validateBusinessLicense,
  validateTaxId,
  validateUrl,
  sanitizeString,
  validateFileSize,
  validateFileType,
  validateImageDimensions,
  formatEgyptianPrice,
  formatEgyptianPhone,
  validateAddress,
  containsArabic,
  validateRating,
  validateQuantity,
  debounce,
  validateBatch,
};
