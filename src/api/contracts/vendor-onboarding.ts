/**
 * Vendor Onboarding Contracts
 * Complete workflow for Egyptian vendor requirements
 */

// ============================================
// VENDOR REGISTRATION & AUTHENTICATION
// ============================================

export interface VendorSignupRequest {
  // Personal Information
  firstName: string;
  firstNameAr: string;
  lastName: string;
  lastNameAr: string;
  email: string;
  phone: string;
  nationalId: string; // Egyptian National ID
  dateOfBirth: Date;
  gender: 'male' | 'female';
  
  // Authentication
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptPrivacyPolicy: boolean;
  
  // Initial Business Info
  intendedBusinessType: 'individual' | 'company' | 'dealer';
  estimatedInventory: number;
  previousExperience: boolean;
  referralSource?: string;
}

export interface EmailVerificationToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
  type: 'vendor_signup' | 'email_change';
}

// ============================================
// VENDOR APPLICATION (After Email Verification)
// ============================================

export interface VendorApplicationForm {
  // Business Information
  businessInfo: {
    businessName: string;
    businessNameAr: string;
    businessType: 'individual' | 'company' | 'dealer';
    registrationNumber?: string; // Commercial Registration
    taxNumber: string; // Egyptian Tax Number
    vatNumber?: string; // VAT if applicable
    establishmentDate: Date;
    businessCategory: string[];
    specializations: string[];
    brands: string[];
    businessDescription: string;
    businessDescriptionAr: string;
  };
  
  // Egyptian Legal Documents
  legalDocuments: {
    // Required for all
    nationalIdFront: FileUpload;
    nationalIdBack: FileUpload;
    taxCard: FileUpload; // البطاقة الضريبية
    
    // For Companies/Dealers
    commercialRegister?: FileUpload; // السجل التجاري
    establishmentContract?: FileUpload; // عقد التأسيس
    authorizedSignatory?: FileUpload; // التوكيل/التفويض
    
    // For Car Dealers specifically
    dealerLicense?: FileUpload; // رخصة تجارة السيارات
    importLicense?: FileUpload; // رخصة الاستيراد (if applicable)
    
    // Financial Documents
    bankStatement: FileUpload; // كشف حساب بنكي
    bankLetter: FileUpload; // خطاب من البنك
  };
  
  // Business Address
  businessAddress: {
    street: string;
    streetAr: string;
    building: string;
    floor?: string;
    apartment?: string;
    area: string;
    areaAr: string;
    city: string;
    cityAr: string;
    governorate: EgyptianGovernorate;
    postalCode: string;
    landmark?: string;
    landmarkAr?: string;
    googleMapsUrl?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Contact Information
  contactInfo: {
    primaryPhone: string;
    secondaryPhone?: string;
    whatsapp: string;
    landline?: string;
    email: string;
    website?: string;
    socialMedia: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
      tiktok?: string;
    };
  };
  
  // Bank Information (for payments)
  bankInfo: {
    accountHolderName: string;
    accountHolderNameAr: string;
    bankName: EgyptianBank;
    branchName: string;
    branchNameAr: string;
    accountNumber: string;
    iban: string;
    swiftCode?: string;
    currency: 'EGP' | 'USD' | 'EUR';
  };
  
  // Subscription Plan Selection
  subscriptionPlan: VendorSubscriptionPlan;
  
  // Payment Proof (InstaPay)
  paymentProof: {
    paymentMethod: 'instapay' | 'bank_transfer' | 'vodafone_cash';
    transactionReference: string;
    transactionDate: Date;
    amount: number;
    currency: 'EGP';
    senderName: string;
    senderPhone: string;
    receiptImage: FileUpload;
    
    // InstaPay specific
    instapayDetails?: {
      senderBank: string;
      receiverIPA: string; // Souk El-Sayarat IPA
      transactionId: string;
    };
  };
  
  // Additional Information
  additionalInfo: {
    currentInventory: number;
    monthlyTargetSales: number;
    averageProductPrice: number;
    hasPhysicalStore: boolean;
    storeAddress?: string;
    numberOfEmployees: number;
    yearsInBusiness: number;
    previousPlatforms?: string[];
    whyJoinUs: string;
    howDidYouHearAboutUs: string;
  };
  
  // Agreements
  agreements: {
    acceptTermsOfService: boolean;
    acceptVendorAgreement: boolean;
    acceptCommissionStructure: boolean;
    acceptDataProcessing: boolean;
    acceptMarketplacePolicies: boolean;
    timestamp: Date;
    ipAddress: string;
  };
}

// ============================================
// SUBSCRIPTION PLANS
// ============================================

export interface VendorSubscriptionPlan {
  id: string;
  name: string;
  nameAr: string;
  tier: 'starter' | 'professional' | 'business' | 'enterprise';
  
  // Pricing
  pricing: {
    monthly: number;
    quarterly: number;
    semiAnnual: number;
    annual: number;
    currency: 'EGP';
    vatIncluded: boolean;
    setupFee: number;
  };
  
  // Product Quotas
  quotas: {
    maxProducts: number; // -1 for unlimited
    maxImagesPerProduct: number;
    maxVideosPerProduct: number;
    maxCategories: number;
    maxBrands: number;
    featuredProducts: number;
    maxPromotionsPerMonth: number;
  };
  
  // Features
  features: {
    // Listing Features
    basicListing: boolean;
    premiumListing: boolean;
    featuredPlacement: boolean;
    searchPriority: number; // 1-10
    homepageDisplay: boolean;
    categoryPageDisplay: boolean;
    
    // Sales Features
    unlimitedOrders: boolean;
    maxOrdersPerMonth: number; // -1 for unlimited
    bulkUpload: boolean;
    inventoryManagement: boolean;
    automaticRestock: boolean;
    priceAutomation: boolean;
    
    // Marketing Features
    promotionalBanners: boolean;
    emailMarketing: boolean;
    smsMarketing: boolean;
    socialMediaIntegration: boolean;
    customStorefront: boolean;
    brandedInvoices: boolean;
    
    // Analytics
    basicAnalytics: boolean;
    advancedAnalytics: boolean;
    realtimeAnalytics: boolean;
    exportReports: boolean;
    apiAccess: boolean;
    competitorAnalysis: boolean;
    
    // Support
    emailSupport: boolean;
    phoneSupport: boolean;
    prioritySupport: boolean;
    dedicatedAccountManager: boolean;
    responseTime: number; // in hours
    trainingSession: boolean;
    
    // Commission & Fees
    transactionFee: number; // percentage
    commissionRate: number; // percentage
    paymentProcessingFee: number; // percentage
    withdrawalFee: number; // fixed amount
    freeWithdrawalsPerMonth: number;
  };
  
  // Display Information
  displayInfo: {
    badge: string;
    badgeColor: string;
    popularTag: boolean;
    recommendedFor: string[];
    description: string;
    descriptionAr: string;
    highlights: string[];
    highlightsAr: string[];
  };
}

// ============================================
// EGYPTIAN SPECIFIC TYPES
// ============================================

export type EgyptianGovernorate = 
  | 'Cairo' | 'القاهرة'
  | 'Giza' | 'الجيزة'
  | 'Alexandria' | 'الإسكندرية'
  | 'Dakahlia' | 'الدقهلية'
  | 'Red Sea' | 'البحر الأحمر'
  | 'Beheira' | 'البحيرة'
  | 'Fayoum' | 'الفيوم'
  | 'Gharbia' | 'الغربية'
  | 'Ismailia' | 'الإسماعيلية'
  | 'Menofia' | 'المنوفية'
  | 'Minya' | 'المنيا'
  | 'Qaliubiya' | 'القليوبية'
  | 'New Valley' | 'الوادي الجديد'
  | 'Suez' | 'السويس'
  | 'Aswan' | 'أسوان'
  | 'Assiut' | 'أسيوط'
  | 'Beni Suef' | 'بني سويف'
  | 'Port Said' | 'بورسعيد'
  | 'Damietta' | 'دمياط'
  | 'Sharkia' | 'الشرقية'
  | 'South Sinai' | 'جنوب سيناء'
  | 'Kafr El Sheikh' | 'كفر الشيخ'
  | 'Matrouh' | 'مطروح'
  | 'Luxor' | 'الأقصر'
  | 'Qena' | 'قنا'
  | 'North Sinai' | 'شمال سيناء'
  | 'Sohag' | 'سوهاج';

export type EgyptianBank = 
  | 'National Bank of Egypt'
  | 'Banque Misr'
  | 'Commercial International Bank (CIB)'
  | 'QNB Alahli'
  | 'Arab African International Bank'
  | 'HSBC Egypt'
  | 'Crédit Agricole Egypt'
  | 'Bank of Alexandria'
  | 'Banque du Caire'
  | 'Faisal Islamic Bank'
  | 'Abu Dhabi Islamic Bank'
  | 'Al Baraka Bank'
  | 'Arab Bank'
  | 'Arab Investment Bank'
  | 'Attijariwafa Bank'
  | 'Bank Audi'
  | 'BLOM Bank Egypt'
  | 'Emirates NBD'
  | 'Export Development Bank of Egypt'
  | 'Housing and Development Bank'
  | 'Industrial Development Bank'
  | 'National Bank of Kuwait - Egypt'
  | 'Société Arabe Internationale de Banque'
  | 'Suez Canal Bank'
  | 'United Bank of Egypt';

// ============================================
// FILE UPLOAD STRUCTURE
// ============================================

export interface FileUpload {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  rejectionReason?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
  };
}

// ============================================
// APPLICATION WORKFLOW STATES
// ============================================

export interface VendorApplicationStatus {
  applicationId: string;
  vendorId: string;
  currentStep: ApplicationStep;
  status: ApplicationStatusType;
  
  // Workflow Timeline
  timeline: {
    signupStarted: Date;
    emailSent: Date;
    emailVerified?: Date;
    applicationStarted?: Date;
    documentsUploaded?: Date;
    paymentReceived?: Date;
    applicationSubmitted?: Date;
    adminReviewStarted?: Date;
    adminDecision?: Date;
    vendorNotified?: Date;
    onboardingCompleted?: Date;
  };
  
  // Review Process
  review: {
    assignedAdmin?: string;
    reviewStartedAt?: Date;
    documentsReview?: DocumentReview[];
    paymentVerification?: PaymentVerification;
    backgroundCheck?: BackgroundCheck;
    finalDecision?: ReviewDecision;
    notes?: string;
  };
  
  // Communication Log
  communications: {
    emailsSent: EmailLog[];
    smssSent: SmsLog[];
    inAppNotifications: NotificationLog[];
  };
}

export type ApplicationStep = 
  | 'signup_initiated'
  | 'email_verification_pending'
  | 'email_verified'
  | 'application_form'
  | 'documents_upload'
  | 'plan_selection'
  | 'payment_pending'
  | 'payment_verification'
  | 'admin_review'
  | 'additional_info_required'
  | 'approved'
  | 'rejected'
  | 'onboarding';

export type ApplicationStatusType = 
  | 'draft'
  | 'pending_verification'
  | 'in_progress'
  | 'pending_payment'
  | 'pending_review'
  | 'under_review'
  | 'additional_info_required'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'active';

// ============================================
// ADMIN REVIEW STRUCTURES
// ============================================

export interface DocumentReview {
  documentType: string;
  documentId: string;
  reviewedBy: string;
  reviewedAt: Date;
  status: 'approved' | 'rejected' | 'needs_clarification';
  comments?: string;
  issueFound?: string;
}

export interface PaymentVerification {
  verifiedBy: string;
  verifiedAt: Date;
  status: 'verified' | 'unverified' | 'suspicious';
  transactionConfirmed: boolean;
  amountCorrect: boolean;
  notes?: string;
}

export interface BackgroundCheck {
  performedBy: string;
  performedAt: Date;
  checkType: 'basic' | 'enhanced' | 'comprehensive';
  results: {
    identityVerified: boolean;
    businessVerified: boolean;
    addressVerified: boolean;
    bankAccountVerified: boolean;
    noFraudHistory: boolean;
    noCriminalRecord: boolean;
    creditCheckPassed?: boolean;
  };
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ReviewDecision {
  decision: 'approve' | 'reject' | 'request_more_info';
  decidedBy: string;
  decidedAt: Date;
  reason?: string;
  conditions?: string[];
  validUntil?: Date;
  requiresFollowUp: boolean;
  followUpDate?: Date;
}

// ============================================
// COMMUNICATION LOGS
// ============================================

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  template: string;
  sentAt: Date;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced';
  openedAt?: Date;
  clickedAt?: Date;
}

export interface SmsLog {
  id: string;
  to: string;
  message: string;
  sentAt: Date;
  status: 'sent' | 'delivered' | 'failed';
  deliveredAt?: Date;
}

export interface NotificationLog {
  id: string;
  type: string;
  title: string;
  message: string;
  sentAt: Date;
  readAt?: Date;
}

// ============================================
// REAL-TIME DASHBOARD UPDATES
// ============================================

export interface VendorApplicationRealtimeUpdate {
  applicationId: string;
  updateType: 'status_change' | 'document_upload' | 'payment_received' | 'admin_action' | 'vendor_action';
  timestamp: Date;
  
  data: {
    previousStatus?: ApplicationStatusType;
    newStatus?: ApplicationStatusType;
    documentUploaded?: string;
    paymentAmount?: number;
    adminAction?: string;
    vendorAction?: string;
    message?: string;
  };
  
  // For admin dashboard
  adminNotification?: {
    priority: 'low' | 'medium' | 'high' | 'urgent';
    requiresAction: boolean;
    actionType?: 'review_application' | 'verify_payment' | 'check_documents';
    estimatedReviewTime?: number; // in minutes
  };
  
  // For vendor dashboard
  vendorNotification?: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    actionRequired?: boolean;
    actionUrl?: string;
  };
}

// ============================================
// INSTAPAY INTEGRATION
// ============================================

export interface InstaPayTransaction {
  // Transaction Details
  transactionId: string;
  ipa: string; // InstaPay Address
  amount: number;
  currency: 'EGP';
  
  // Sender Information
  sender: {
    name: string;
    phone: string;
    bank: string;
    accountNumber?: string;
  };
  
  // Receiver Information (Souk El-Sayarat)
  receiver: {
    businessName: 'Souk El-Sayarat';
    ipa: string; // Our IPA
    bank: string;
    accountNumber: string;
  };
  
  // Transaction Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  initiatedAt: Date;
  completedAt?: Date;
  
  // Verification
  verificationCode?: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  verifiedBy?: string;
  verifiedAt?: Date;
  
  // Receipt
  receiptUrl?: string;
  receiptNumber?: string;
}

// ============================================
// SUBSCRIPTION PLANS PRICING (EGYPTIAN MARKET)
// ============================================

export const VENDOR_SUBSCRIPTION_PLANS: VendorSubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    nameAr: 'البداية',
    tier: 'starter',
    pricing: {
      monthly: 499,
      quarterly: 1347, // 10% discount
      semiAnnual: 2544, // 15% discount
      annual: 4790, // 20% discount
      currency: 'EGP',
      vatIncluded: true,
      setupFee: 0,
    },
    quotas: {
      maxProducts: 10,
      maxImagesPerProduct: 5,
      maxVideosPerProduct: 0,
      maxCategories: 2,
      maxBrands: 3,
      featuredProducts: 1,
      maxPromotionsPerMonth: 1,
    },
    features: {
      basicListing: true,
      premiumListing: false,
      featuredPlacement: false,
      searchPriority: 3,
      homepageDisplay: false,
      categoryPageDisplay: true,
      unlimitedOrders: false,
      maxOrdersPerMonth: 50,
      bulkUpload: false,
      inventoryManagement: true,
      automaticRestock: false,
      priceAutomation: false,
      promotionalBanners: false,
      emailMarketing: false,
      smsMarketing: false,
      socialMediaIntegration: false,
      customStorefront: false,
      brandedInvoices: false,
      basicAnalytics: true,
      advancedAnalytics: false,
      realtimeAnalytics: false,
      exportReports: false,
      apiAccess: false,
      competitorAnalysis: false,
      emailSupport: true,
      phoneSupport: false,
      prioritySupport: false,
      dedicatedAccountManager: false,
      responseTime: 48,
      trainingSession: false,
      transactionFee: 2.5,
      commissionRate: 8,
      paymentProcessingFee: 2,
      withdrawalFee: 25,
      freeWithdrawalsPerMonth: 1,
    },
    displayInfo: {
      badge: 'Starter',
      badgeColor: 'gray',
      popularTag: false,
      recommendedFor: ['New vendors', 'Small inventory', 'Testing the platform'],
      description: 'Perfect for new vendors starting their online journey',
      descriptionAr: 'مثالي للبائعين الجدد الذين يبدأون رحلتهم عبر الإنترنت',
      highlights: ['10 products', 'Basic analytics', 'Email support'],
      highlightsAr: ['10 منتجات', 'تحليلات أساسية', 'دعم بالبريد الإلكتروني'],
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    nameAr: 'المحترف',
    tier: 'professional',
    pricing: {
      monthly: 1499,
      quarterly: 4047, // 10% discount
      semiAnnual: 7644, // 15% discount
      annual: 14390, // 20% discount
      currency: 'EGP',
      vatIncluded: true,
      setupFee: 0,
    },
    quotas: {
      maxProducts: 50,
      maxImagesPerProduct: 10,
      maxVideosPerProduct: 2,
      maxCategories: 5,
      maxBrands: 10,
      featuredProducts: 5,
      maxPromotionsPerMonth: 3,
    },
    features: {
      basicListing: true,
      premiumListing: true,
      featuredPlacement: true,
      searchPriority: 6,
      homepageDisplay: true,
      categoryPageDisplay: true,
      unlimitedOrders: true,
      maxOrdersPerMonth: -1,
      bulkUpload: true,
      inventoryManagement: true,
      automaticRestock: true,
      priceAutomation: false,
      promotionalBanners: true,
      emailMarketing: true,
      smsMarketing: false,
      socialMediaIntegration: true,
      customStorefront: false,
      brandedInvoices: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      realtimeAnalytics: false,
      exportReports: true,
      apiAccess: false,
      competitorAnalysis: false,
      emailSupport: true,
      phoneSupport: true,
      prioritySupport: false,
      dedicatedAccountManager: false,
      responseTime: 24,
      trainingSession: true,
      transactionFee: 2,
      commissionRate: 6,
      paymentProcessingFee: 1.5,
      withdrawalFee: 20,
      freeWithdrawalsPerMonth: 2,
    },
    displayInfo: {
      badge: 'Professional',
      badgeColor: 'blue',
      popularTag: true,
      recommendedFor: ['Growing businesses', 'Regular sellers', 'Brand builders'],
      description: 'Ideal for established vendors ready to scale',
      descriptionAr: 'مثالي للبائعين الراسخين المستعدين للتوسع',
      highlights: ['50 products', 'Advanced analytics', 'Phone support', 'Bulk upload'],
      highlightsAr: ['50 منتج', 'تحليلات متقدمة', 'دعم هاتفي', 'رفع جماعي'],
    },
  },
  {
    id: 'business',
    name: 'Business',
    nameAr: 'الأعمال',
    tier: 'business',
    pricing: {
      monthly: 2999,
      quarterly: 8097, // 10% discount
      semiAnnual: 15294, // 15% discount
      annual: 28790, // 20% discount
      currency: 'EGP',
      vatIncluded: true,
      setupFee: 500,
    },
    quotas: {
      maxProducts: 200,
      maxImagesPerProduct: 20,
      maxVideosPerProduct: 5,
      maxCategories: 15,
      maxBrands: 30,
      featuredProducts: 15,
      maxPromotionsPerMonth: 10,
    },
    features: {
      basicListing: true,
      premiumListing: true,
      featuredPlacement: true,
      searchPriority: 8,
      homepageDisplay: true,
      categoryPageDisplay: true,
      unlimitedOrders: true,
      maxOrdersPerMonth: -1,
      bulkUpload: true,
      inventoryManagement: true,
      automaticRestock: true,
      priceAutomation: true,
      promotionalBanners: true,
      emailMarketing: true,
      smsMarketing: true,
      socialMediaIntegration: true,
      customStorefront: true,
      brandedInvoices: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      realtimeAnalytics: true,
      exportReports: true,
      apiAccess: true,
      competitorAnalysis: true,
      emailSupport: true,
      phoneSupport: true,
      prioritySupport: true,
      dedicatedAccountManager: false,
      responseTime: 12,
      trainingSession: true,
      transactionFee: 1.5,
      commissionRate: 5,
      paymentProcessingFee: 1,
      withdrawalFee: 15,
      freeWithdrawalsPerMonth: 4,
    },
    displayInfo: {
      badge: 'Business',
      badgeColor: 'purple',
      popularTag: false,
      recommendedFor: ['Large inventory', 'Multiple brands', 'High volume sales'],
      description: 'Complete solution for serious automotive businesses',
      descriptionAr: 'حل كامل لأعمال السيارات الجادة',
      highlights: ['200 products', 'Real-time analytics', 'Priority support', 'API access', 'Custom storefront'],
      highlightsAr: ['200 منتج', 'تحليلات فورية', 'دعم أولوية', 'وصول API', 'واجهة متجر مخصصة'],
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    nameAr: 'المؤسسة',
    tier: 'enterprise',
    pricing: {
      monthly: 5999,
      quarterly: 16197, // 10% discount
      semiAnnual: 30594, // 15% discount
      annual: 57590, // 20% discount
      currency: 'EGP',
      vatIncluded: true,
      setupFee: 1000,
    },
    quotas: {
      maxProducts: -1, // Unlimited
      maxImagesPerProduct: -1,
      maxVideosPerProduct: -1,
      maxCategories: -1,
      maxBrands: -1,
      featuredProducts: -1,
      maxPromotionsPerMonth: -1,
    },
    features: {
      basicListing: true,
      premiumListing: true,
      featuredPlacement: true,
      searchPriority: 10,
      homepageDisplay: true,
      categoryPageDisplay: true,
      unlimitedOrders: true,
      maxOrdersPerMonth: -1,
      bulkUpload: true,
      inventoryManagement: true,
      automaticRestock: true,
      priceAutomation: true,
      promotionalBanners: true,
      emailMarketing: true,
      smsMarketing: true,
      socialMediaIntegration: true,
      customStorefront: true,
      brandedInvoices: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      realtimeAnalytics: true,
      exportReports: true,
      apiAccess: true,
      competitorAnalysis: true,
      emailSupport: true,
      phoneSupport: true,
      prioritySupport: true,
      dedicatedAccountManager: true,
      responseTime: 4,
      trainingSession: true,
      transactionFee: 1,
      commissionRate: 3,
      paymentProcessingFee: 0.5,
      withdrawalFee: 0,
      freeWithdrawalsPerMonth: -1,
    },
    displayInfo: {
      badge: 'Enterprise',
      badgeColor: 'gold',
      popularTag: false,
      recommendedFor: ['Dealerships', 'Import/Export', 'Multi-branch operations'],
      description: 'Ultimate solution with dedicated support and unlimited everything',
      descriptionAr: 'الحل النهائي مع دعم مخصص وكل شيء غير محدود',
      highlights: ['Unlimited everything', 'Dedicated manager', '4-hour support', 'Lowest fees', 'Custom features'],
      highlightsAr: ['كل شيء غير محدود', 'مدير مخصص', 'دعم 4 ساعات', 'أقل رسوم', 'ميزات مخصصة'],
    },
  },
];

// ============================================
// SOUK EL-SAYARAT BUSINESS DETAILS
// ============================================

export const SOUK_BUSINESS_DETAILS = {
  businessName: 'Souk El-Sayarat',
  businessNameAr: 'سوق السيارات',
  registrationNumber: 'EG-CAR-2024-001',
  taxNumber: '100-200-300',
  
  // InstaPay Details
  instapay: {
    ipa: 'SOUKSAYARAT@CIB', // InstaPay Address
    bankName: 'Commercial International Bank (CIB)',
    accountNumber: '1234567890123456',
    accountName: 'Souk El-Sayarat LLC',
    accountNameAr: 'سوق السيارات ش.م.م',
  },
  
  // Bank Transfer Details
  bankTransfer: {
    banks: [
      {
        bankName: 'Commercial International Bank (CIB)',
        accountNumber: '1234567890123456',
        iban: 'EG380003001234567890123456',
        swiftCode: 'CIBEEGCX',
        branchName: 'Smart Village Branch',
        branchNameAr: 'فرع القرية الذكية',
      },
      {
        bankName: 'National Bank of Egypt',
        accountNumber: '9876543210987654',
        iban: 'EG380002009876543210987654',
        swiftCode: 'NBEAEGCX',
        branchName: 'New Cairo Branch',
        branchNameAr: 'فرع القاهرة الجديدة',
      },
    ],
  },
  
  // Vodafone Cash
  vodafoneCash: {
    number: '01001234567',
    name: 'Souk El-Sayarat',
  },
  
  // Contact for Payment Verification
  paymentVerification: {
    email: 'payments@souk-elsayarat.com',
    phone: '+201234567890',
    whatsapp: '+201234567890',
    workingHours: '9:00 AM - 6:00 PM (Cairo Time)',
    workingDays: 'Sunday - Thursday',
  },
};
