/**
 * 🔒 PROFESSIONAL VALIDATION SERVICE
 * Comprehensive data validation and sanitization
 * Implements security best practices and input validation
 */

import * as yup from 'yup';

// Custom validation functions
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^(\+20|0)?1[0-9]{9}$/; // Egyptian phone number format
const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

// Base validation schemas
export const BaseValidationSchema = yup.object({
  createdAt: yup.date().default(() => new Date()),
  updatedAt: yup.date().default(() => new Date()),
});

// User validation schema
export const UserValidationSchema = BaseValidationSchema.shape({
  email: yup
    .string()
    .required('البريد الإلكتروني مطلوب')
    .matches(emailRegex, 'البريد الإلكتروني غير صحيح')
    .max(255, 'البريد الإلكتروني طويل جداً'),
  
  displayName: yup
    .string()
    .required('اسم المستخدم مطلوب')
    .min(2, 'اسم المستخدم قصير جداً')
    .max(100, 'اسم المستخدم طويل جداً')
    .matches(/^[a-zA-Z\u0600-\u06FF\s]+$/, 'اسم المستخدم يجب أن يحتوي على أحرف فقط'),
  
  role: yup
    .string()
    .oneOf(['customer', 'vendor', 'admin'], 'نوع المستخدم غير صحيح')
    .required('نوع المستخدم مطلوب'),
  
  profileImage: yup
    .string()
    .url('رابط الصورة غير صحيح')
    .nullable(),
  
  phoneNumber: yup
    .string()
    .matches(phoneRegex, 'رقم الهاتف غير صحيح')
    .nullable(),
  
  address: yup.object({
    street: yup.string().max(200, 'عنوان الشارع طويل جداً'),
    city: yup.string().max(100, 'اسم المدينة طويل جداً'),
    governorate: yup.string().max(100, 'اسم المحافظة طويل جداً'),
    postalCode: yup.string().max(20, 'الرمز البريدي طويل جداً'),
  }).nullable(),
  
  isActive: yup.boolean().default(true),
  lastActive: yup.date().nullable(),
});

// Product validation schema
export const ProductValidationSchema = BaseValidationSchema.shape({
  title: yup
    .string()
    .required('عنوان المنتج مطلوب')
    .min(3, 'عنوان المنتج قصير جداً')
    .max(200, 'عنوان المنتج طويل جداً'),
  
  description: yup
    .string()
    .required('وصف المنتج مطلوب')
    .min(10, 'وصف المنتج قصير جداً')
    .max(2000, 'وصف المنتج طويل جداً'),
  
  price: yup
    .number()
    .required('سعر المنتج مطلوب')
    .positive('السعر يجب أن يكون موجباً')
    .max(1000000, 'السعر مرتفع جداً'),
  
  category: yup
    .string()
    .required('فئة المنتج مطلوبة')
    .oneOf([
      'cars',
      'motorcycles',
      'trucks',
      'parts',
      'accessories',
      'services'
    ], 'فئة المنتج غير صحيحة'),
  
  subcategory: yup
    .string()
    .max(100, 'الفئة الفرعية طويلة جداً')
    .nullable(),
  
  vendorId: yup
    .string()
    .required('معرف التاجر مطلوب')
    .matches(/^[a-zA-Z0-9_-]+$/, 'معرف التاجر غير صحيح'),
  
  vendorName: yup
    .string()
    .required('اسم التاجر مطلوب')
    .max(100, 'اسم التاجر طويل جداً'),
  
  images: yup
    .array()
    .of(yup.string().url('رابط الصورة غير صحيح'))
    .min(1, 'صورة واحدة على الأقل مطلوبة')
    .max(10, 'لا يمكن إضافة أكثر من 10 صور'),
  
  specifications: yup
    .object()
    .test('specs-size', 'مواصفات المنتج كبيرة جداً', function(value) {
      return JSON.stringify(value || {}).length <= 10000;
    }),
  
  status: yup
    .string()
    .oneOf([
      'draft',
      'pending_approval',
      'published',
      'rejected',
      'archived'
    ], 'حالة المنتج غير صحيحة')
    .default('draft'),
  
  stock: yup
    .number()
    .integer('الكمية يجب أن تكون رقماً صحيحاً')
    .min(0, 'الكمية لا يمكن أن تكون سالبة')
    .default(1),
  
  tags: yup
    .array()
    .of(yup.string().max(50, 'العلامة طويلة جداً'))
    .max(10, 'لا يمكن إضافة أكثر من 10 علامات'),
  
  featured: yup.boolean().default(false),
  
  rating: yup
    .number()
    .min(0, 'التقييم لا يمكن أن يكون سالباً')
    .max(5, 'التقييم لا يمكن أن يكون أكثر من 5')
    .nullable(),
  
  reviewCount: yup
    .number()
    .integer('عدد التقييمات يجب أن يكون رقماً صحيحاً')
    .min(0, 'عدد التقييمات لا يمكن أن يكون سالباً')
    .default(0),
});

// Order validation schema
export const OrderValidationSchema = BaseValidationSchema.shape({
  customerId: yup
    .string()
    .required('معرف العميل مطلوب')
    .matches(/^[a-zA-Z0-9_-]+$/, 'معرف العميل غير صحيح'),
  
  customerName: yup
    .string()
    .required('اسم العميل مطلوب')
    .max(100, 'اسم العميل طويل جداً'),
  
  customerEmail: yup
    .string()
    .required('بريد العميل الإلكتروني مطلوب')
    .matches(emailRegex, 'بريد العميل الإلكتروني غير صحيح'),
  
  vendorId: yup
    .string()
    .required('معرف التاجر مطلوب')
    .matches(/^[a-zA-Z0-9_-]+$/, 'معرف التاجر غير صحيح'),
  
  vendorName: yup
    .string()
    .required('اسم التاجر مطلوب')
    .max(100, 'اسم التاجر طويل جداً'),
  
  items: yup
    .array()
    .of(yup.object({
      productId: yup.string().required(),
      productTitle: yup.string().required(),
      quantity: yup.number().integer().positive().required(),
      price: yup.number().positive().required(),
      total: yup.number().positive().required(),
    }))
    .min(1, 'يجب أن يحتوي الطلب على منتج واحد على الأقل'),
  
  subtotal: yup
    .number()
    .positive('المجموع الفرعي يجب أن يكون موجباً')
    .required('المجموع الفرعي مطلوب'),
  
  tax: yup
    .number()
    .min(0, 'الضريبة لا يمكن أن تكون سالبة')
    .default(0),
  
  shipping: yup
    .number()
    .min(0, 'رسوم الشحن لا يمكن أن تكون سالبة')
    .default(0),
  
  totalAmount: yup
    .number()
    .positive('المبلغ الإجمالي يجب أن يكون موجباً')
    .required('المبلغ الإجمالي مطلوب'),
  
  status: yup
    .string()
    .oneOf([
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    ], 'حالة الطلب غير صحيحة')
    .default('pending'),
  
  paymentMethod: yup
    .string()
    .oneOf(['cod', 'card', 'bank_transfer'], 'طريقة الدفع غير صحيحة')
    .default('cod'),
  
  shippingAddress: yup.object({
    street: yup.string().required('عنوان الشارع مطلوب').max(200),
    city: yup.string().required('المدينة مطلوبة').max(100),
    governorate: yup.string().required('المحافظة مطلوبة').max(100),
    postalCode: yup.string().required('الرمز البريدي مطلوب').max(20),
    phone: yup.string().required('رقم الهاتف مطلوب').matches(phoneRegex),
  }).required('عنوان الشحن مطلوب'),
  
  trackingNumber: yup.string().max(100).nullable(),
  notes: yup.string().max(500).nullable(),
});

// Review validation schema
export const ReviewValidationSchema = BaseValidationSchema.shape({
  customerId: yup
    .string()
    .required('معرف العميل مطلوب')
    .matches(/^[a-zA-Z0-9_-]+$/, 'معرف العميل غير صحيح'),
  
  customerName: yup
    .string()
    .required('اسم العميل مطلوب')
    .max(100, 'اسم العميل طويل جداً'),
  
  productId: yup
    .string()
    .required('معرف المنتج مطلوب')
    .matches(/^[a-zA-Z0-9_-]+$/, 'معرف المنتج غير صحيح'),
  
  productTitle: yup
    .string()
    .required('عنوان المنتج مطلوب')
    .max(200, 'عنوان المنتج طويل جداً'),
  
  rating: yup
    .number()
    .required('التقييم مطلوب')
    .integer('التقييم يجب أن يكون رقماً صحيحاً')
    .min(1, 'التقييم يجب أن يكون من 1 إلى 5')
    .max(5, 'التقييم يجب أن يكون من 1 إلى 5'),
  
  comment: yup
    .string()
    .required('التعليق مطلوب')
    .min(10, 'التعليق قصير جداً')
    .max(1000, 'التعليق طويل جداً'),
  
  images: yup
    .array()
    .of(yup.string().url('رابط الصورة غير صحيح'))
    .max(5, 'لا يمكن إضافة أكثر من 5 صور'),
  
  verified: yup.boolean().default(false),
  helpful: yup.number().integer().min(0).default(0),
});

// Authentication validation schemas
export const LoginValidationSchema = yup.object({
  email: yup
    .string()
    .required('البريد الإلكتروني مطلوب')
    .matches(emailRegex, 'البريد الإلكتروني غير صحيح'),
  
  password: yup
    .string()
    .required('كلمة المرور مطلوبة')
    .min(6, 'كلمة المرور قصيرة جداً'),
});

export const RegisterValidationSchema = yup.object({
  email: yup
    .string()
    .required('البريد الإلكتروني مطلوب')
    .matches(emailRegex, 'البريد الإلكتروني غير صحيح'),
  
  password: yup
    .string()
    .required('كلمة المرور مطلوبة')
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص'
    ),
  
  confirmPassword: yup
    .string()
    .required('تأكيد كلمة المرور مطلوب')
    .oneOf([yup.ref('password')], 'كلمات المرور غير متطابقة'),
  
  displayName: yup
    .string()
    .required('اسم المستخدم مطلوب')
    .min(2, 'اسم المستخدم قصير جداً')
    .max(100, 'اسم المستخدم طويل جداً'),
  
  role: yup
    .string()
    .oneOf(['customer', 'vendor'], 'نوع المستخدم غير صحيح')
    .default('customer'),
});

export const ResetPasswordValidationSchema = yup.object({
  email: yup
    .string()
    .required('البريد الإلكتروني مطلوب')
    .matches(emailRegex, 'البريد الإلكتروني غير صحيح'),
});

// File upload validation
export const FileUploadValidationSchema = yup.object({
  file: yup
    .mixed()
    .required('الملف مطلوب')
    .test('file-size', 'حجم الملف كبير جداً (5MB كحد أقصى)', (value) => {
      return value && value.size <= 5 * 1024 * 1024;
    })
    .test('file-type', 'نوع الملف غير مدعوم', (value) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      return value && allowedTypes.includes(value.type);
    }),
  
  path: yup
    .string()
    .required('مسار التحميل مطلوب')
    .matches(/^[a-zA-Z0-9_/-]+$/, 'مسار التحميل غير صحيح'),
});

/**
 * Professional Validation Service Class
 */
export class ValidationService {
  /**
   * Validate data against schema
   */
  async validate<T>(schema: yup.Schema<T>, data: any): Promise<{
    isValid: boolean;
    data?: T;
    errors?: string[];
  }> {
    try {
      const validatedData = await schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });
      
      return {
        isValid: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return {
          isValid: false,
          errors: error.errors,
        };
      }
      
      return {
        isValid: false,
        errors: ['خطأ في التحقق من صحة البيانات'],
      };
    }
  }

  /**
   * Sanitize input data
   */
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  /**
   * Validate file upload
   */
  validateFile(file: File, maxSize = 5 * 1024 * 1024, allowedTypes: string[] = []): {
    isValid: boolean;
    error?: string;
  } {
    if (!file) {
      return { isValid: false, error: 'الملف مطلوب' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: `حجم الملف كبير جداً (${Math.round(maxSize / 1024 / 1024)}MB كحد أقصى)` };
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'نوع الملف غير مدعوم' };
    }

    return { isValid: true };
  }

  /**
   * Validate image file specifically
   */
  validateImage(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return this.validateFile(file, 5 * 1024 * 1024, allowedTypes);
  }

  /**
   * Validate document file
   */
  validateDocument(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    return this.validateFile(file, 10 * 1024 * 1024, allowedTypes);
  }

  /**
   * Validate URL
   */
  validateUrl(url: string): { isValid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, error: 'الرابط يجب أن يبدأ بـ http أو https' };
      }
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'الرابط غير صحيح' };
    }
  }

  /**
   * Validate phone number (Egyptian format)
   */
  validatePhone(phone: string): { isValid: boolean; error?: string } {
    if (!phoneRegex.test(phone)) {
      return { isValid: false, error: 'رقم الهاتف غير صحيح' };
    }
    return { isValid: true };
  }

  /**
   * Validate email
   */
  validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'البريد الإلكتروني غير صحيح' };
    }
    return { isValid: true };
  }
}

// Create validation service instance
export const validationService = new ValidationService();

// Schemas are already exported above

