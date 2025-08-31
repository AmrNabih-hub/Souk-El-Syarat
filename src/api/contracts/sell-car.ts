/**
 * Sell Your Car Feature Contracts
 * For customers wanting to sell their cars through the platform
 */

// ============================================
// SELL CAR REQUEST
// ============================================

export interface SellCarRequest {
  // Customer Information
  customer: {
    userId: string;
    name: string;
    nameAr?: string;
    email: string;
    phone: string;
    whatsapp?: string;
    preferredContact: 'phone' | 'whatsapp' | 'email';
    location: {
      governorate: string;
      city: string;
      area?: string;
    };
  };

  // Car Basic Information
  carInfo: {
    // Make & Model
    make: string; // Toyota, Mercedes, BMW, etc.
    makeAr?: string;
    model: string; // Camry, C-Class, X5, etc.
    modelAr?: string;
    year: number; // Manufacturing year
    variant?: string; // SE, LE, Sport, etc.
    
    // Classification
    category: CarCategory;
    bodyType: CarBodyType;
    fuelType: FuelType;
    transmission: TransmissionType;
    drivetrain: DrivetrainType;
    
    // Specifications
    engineCapacity: number; // in CC
    engineCylinders?: number;
    horsePower?: number;
    torque?: number;
    seatingCapacity: number;
    numberOfDoors: number;
    
    // Colors
    exteriorColor: string;
    exteriorColorAr?: string;
    interiorColor: string;
    interiorColorAr?: string;
    interiorMaterial: 'fabric' | 'leather' | 'mixed' | 'other';
  };

  // Car Condition
  condition: {
    // General Condition
    overallCondition: 'excellent' | 'very_good' | 'good' | 'fair' | 'needs_work';
    mileage: number; // in KM
    serviceHistory: 'full' | 'partial' | 'none' | 'unknown';
    numberOfOwners: number;
    accidentHistory: boolean;
    accidentDetails?: string;
    
    // Detailed Condition
    exterior: {
      condition: ConditionRating;
      scratches: boolean;
      dents: boolean;
      rustSpots: boolean;
      paintCondition: ConditionRating;
      notes?: string;
    };
    
    interior: {
      condition: ConditionRating;
      seats: ConditionRating;
      dashboard: ConditionRating;
      electronics: ConditionRating;
      airConditioning: 'working' | 'needs_service' | 'not_working';
      notes?: string;
    };
    
    mechanical: {
      engine: ConditionRating;
      transmission: ConditionRating;
      suspension: ConditionRating;
      brakes: ConditionRating;
      tires: {
        condition: ConditionRating;
        brand?: string;
        changeDate?: Date;
      };
      battery: {
        condition: ConditionRating;
        changeDate?: Date;
      };
      notes?: string;
    };
    
    // Maintenance
    lastServiceDate?: Date;
    nextServiceDue?: Date;
    warrantyValid?: boolean;
    warrantyExpiryDate?: Date;
  };

  // Features & Options
  features: {
    // Safety Features
    safety: string[]; // ABS, Airbags, Parking Sensors, etc.
    
    // Comfort Features
    comfort: string[]; // Cruise Control, Sunroof, Heated Seats, etc.
    
    // Entertainment
    entertainment: string[]; // Touch Screen, Apple CarPlay, Premium Sound, etc.
    
    // Additional Features
    additional: string[];
    
    // Custom Features (user input)
    custom?: string[];
  };

  // Documentation
  documents: {
    // Required Documents
    registrationCard: CarDocument; // رخصة السيارة
    ownershipCertificate?: CarDocument; // شهادة الملكية
    
    // Optional Documents
    insurancePolicy?: CarDocument;
    serviceRecords?: CarDocument[];
    accidentReports?: CarDocument[];
    customsCertificate?: CarDocument; // For imported cars
    
    // Inspection Reports
    technicalInspection?: CarDocument;
    emissionTest?: CarDocument;
  };

  // Images & Media
  media: {
    // Required Images
    frontView: CarImage;
    backView: CarImage;
    sideViewLeft: CarImage;
    sideViewRight: CarImage;
    interior: CarImage;
    dashboard: CarImage;
    engine: CarImage;
    
    // Optional Images
    additionalExterior?: CarImage[];
    additionalInterior?: CarImage[];
    undercarriage?: CarImage[];
    trunk?: CarImage;
    wheels?: CarImage[];
    damages?: CarImage[]; // Images of any damages
    
    // Videos
    walkAroundVideo?: CarVideo;
    testDriveVideo?: CarVideo;
    engineVideo?: CarVideo;
  };

  // Pricing & Sale Terms
  pricing: {
    // Price Expectation
    askingPrice: number;
    minimumPrice?: number; // Lowest acceptable price
    currency: 'EGP';
    priceNegotiable: boolean;
    
    // Sale Urgency
    urgency: 'immediate' | 'within_week' | 'within_month' | 'flexible';
    reasonForSelling: string;
    
    // Trade-in Option
    openToTradeIn: boolean;
    tradeInPreferences?: string;
    
    // Payment Preferences
    acceptedPaymentMethods: PaymentMethod[];
    installmentAccepted: boolean;
    installmentTerms?: string;
  };

  // Availability
  availability: {
    // Viewing Availability
    viewingDays: string[]; // Days available for viewing
    viewingTimes: {
      from: string; // HH:MM format
      to: string;
    };
    viewingLocation: {
      type: 'home' | 'office' | 'public_place' | 'flexible';
      address?: string;
      landmark?: string;
      googleMapsUrl?: string;
    };
    
    // Test Drive
    testDriveAvailable: boolean;
    testDriveConditions?: string; // ID required, deposit, etc.
    
    // Inspection
    professionalInspectionAllowed: boolean;
    inspectionLocation?: 'seller_location' | 'buyer_choice' | 'specific_center';
  };

  // Additional Information
  additionalInfo: {
    // Modifications
    hasModifications: boolean;
    modifications?: string[];
    
    // Import Status (for imported cars)
    isImported: boolean;
    importYear?: number;
    importCountry?: string;
    
    // Special Notes
    specialFeatures?: string;
    knownIssues?: string;
    sellingPoints?: string; // Key selling points
    additionalNotes?: string;
  };

  // Platform Agreement
  agreement: {
    // Terms Acceptance
    acceptTerms: boolean;
    acceptCommission: boolean; // Platform commission on sale
    acceptInspection: boolean; // Allow platform inspection
    acceptMarketing: boolean; // Allow platform to market the car
    
    // Data Usage
    allowDataSharing: boolean;
    allowPhotosUsage: boolean;
    
    // Verification
    verifyInfoAccuracy: boolean;
    verifyOwnership: boolean;
    
    // Timestamp
    agreedAt: Date;
    ipAddress: string;
  };
}

// ============================================
// SUPPORTING TYPES
// ============================================

export type CarCategory = 
  | 'sedan'
  | 'suv'
  | 'hatchback'
  | 'coupe'
  | 'convertible'
  | 'wagon'
  | 'pickup'
  | 'van'
  | 'minivan'
  | 'sports'
  | 'luxury'
  | 'electric'
  | 'hybrid'
  | 'commercial';

export type CarBodyType = 
  | '2_door'
  | '4_door'
  | '5_door'
  | 'convertible'
  | 'coupe'
  | 'hatchback'
  | 'sedan'
  | 'suv'
  | 'wagon'
  | 'pickup'
  | 'van';

export type FuelType = 
  | 'petrol'
  | 'diesel'
  | 'hybrid'
  | 'electric'
  | 'plug_in_hybrid'
  | 'cng'
  | 'lpg';

export type TransmissionType = 
  | 'manual'
  | 'automatic'
  | 'cvt'
  | 'semi_automatic'
  | 'dual_clutch';

export type DrivetrainType = 
  | 'fwd' // Front-Wheel Drive
  | 'rwd' // Rear-Wheel Drive
  | 'awd' // All-Wheel Drive
  | '4wd'; // Four-Wheel Drive

export type ConditionRating = 
  | 'excellent'
  | 'very_good'
  | 'good'
  | 'fair'
  | 'poor';

export type PaymentMethod = 
  | 'cash'
  | 'bank_transfer'
  | 'certified_check'
  | 'installments'
  | 'trade_in';

// ============================================
// DOCUMENT & MEDIA TYPES
// ============================================

export interface CarDocument {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
  verified?: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  expiryDate?: Date;
  notes?: string;
}

export interface CarImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  captionAr?: string;
  order: number;
  uploadedAt: Date;
  metadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
  };
}

export interface CarVideo {
  id: string;
  url: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  caption?: string;
  captionAr?: string;
  uploadedAt: Date;
  metadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
    bitrate: number;
  };
}

// ============================================
// SELL CAR LISTING STATUS
// ============================================

export interface SellCarListing {
  id: string;
  requestId: string;
  customerId: string;
  
  // Listing Status
  status: ListingStatus;
  statusHistory: StatusChange[];
  
  // Review Process
  review: {
    assignedAdmin?: string;
    startedAt?: Date;
    completedAt?: Date;
    decision?: 'approve' | 'reject' | 'request_changes';
    feedback?: string;
    requiredChanges?: string[];
  };
  
  // Valuation
  valuation?: {
    suggestedPrice: number;
    priceRange: {
      min: number;
      max: number;
    };
    marketAnalysis?: string;
    comparableListings?: string[];
    valuationDate: Date;
    valuedBy?: string;
  };
  
  // Marketing
  marketing?: {
    featured: boolean;
    featuredUntil?: Date;
    promotions: string[];
    views: number;
    inquiries: number;
    testDriveRequests: number;
  };
  
  // Offers
  offers: CarOffer[];
  
  // Sale Completion
  sale?: {
    soldTo: string; // Buyer ID
    salePrice: number;
    saleDate: Date;
    paymentMethod: PaymentMethod;
    commission: number;
    netAmount: number;
    transferCompleted: boolean;
    transferDate?: Date;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  soldAt?: Date;
  expiredAt?: Date;
}

export type ListingStatus = 
  | 'draft'
  | 'pending_review'
  | 'under_review'
  | 'changes_requested'
  | 'approved'
  | 'published'
  | 'featured'
  | 'negotiating'
  | 'reserved'
  | 'sold'
  | 'expired'
  | 'cancelled'
  | 'rejected';

export interface StatusChange {
  from: ListingStatus;
  to: ListingStatus;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  notes?: string;
}

// ============================================
// CAR OFFERS
// ============================================

export interface CarOffer {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  
  // Offer Details
  offerAmount: number;
  offerType: 'cash' | 'installment' | 'trade_in';
  message?: string;
  
  // Trade-in Details (if applicable)
  tradeInDetails?: {
    carMake: string;
    carModel: string;
    carYear: number;
    estimatedValue: number;
    condition: string;
  };
  
  // Installment Details (if applicable)
  installmentDetails?: {
    downPayment: number;
    monthlyPayment: number;
    numberOfMonths: number;
    interestRate?: number;
  };
  
  // Offer Status
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired' | 'withdrawn';
  counterOffer?: number;
  
  // Communication
  sellerResponse?: string;
  negotiationHistory?: {
    amount: number;
    proposedBy: 'buyer' | 'seller';
    timestamp: Date;
    message?: string;
  }[];
  
  // Timestamps
  createdAt: Date;
  respondedAt?: Date;
  expiresAt: Date;
}

// ============================================
// ADMIN REVIEW DASHBOARD
// ============================================

export interface SellCarAdminDashboard {
  // Statistics
  stats: {
    totalListings: number;
    pendingReview: number;
    published: number;
    sold: number;
    totalValue: number;
    averagePrice: number;
    conversionRate: number;
  };
  
  // Pending Reviews
  pendingReviews: {
    urgent: SellCarListing[]; // Older than 24 hours
    normal: SellCarListing[];
    changesRequested: SellCarListing[];
  };
  
  // Recent Activity
  recentActivity: {
    newListings: SellCarListing[];
    recentOffers: CarOffer[];
    completedSales: SellCarListing[];
  };
  
  // Performance Metrics
  metrics: {
    averageReviewTime: number; // in hours
    approvalRate: number; // percentage
    averageDaysToSell: number;
    platformCommission: number; // total earned
  };
}

// ============================================
// CUSTOMER DASHBOARD
// ============================================

export interface CustomerSellCarDashboard {
  // My Listings
  myListings: {
    active: SellCarListing[];
    pending: SellCarListing[];
    sold: SellCarListing[];
    expired: SellCarListing[];
  };
  
  // Offers & Inquiries
  offers: {
    new: CarOffer[];
    responded: CarOffer[];
    accepted: CarOffer[];
  };
  
  inquiries: {
    unread: number;
    total: number;
    messages: any[]; // Chat messages
  };
  
  // Analytics (for active listings)
  analytics: {
    totalViews: number;
    uniqueVisitors: number;
    averageTimeOnListing: number;
    viewsChart: { date: Date; views: number }[];
    inquiriesChart: { date: Date; inquiries: number }[];
  };
  
  // Quick Actions
  quickActions: {
    editListing: boolean;
    boostListing: boolean;
    refreshListing: boolean;
    markAsSold: boolean;
  };
}

// ============================================
// NOTIFICATION TEMPLATES
// ============================================

export interface SellCarNotifications {
  // For Seller
  seller: {
    listingSubmitted: {
      title: string;
      message: string;
      type: 'info';
    };
    listingApproved: {
      title: string;
      message: string;
      type: 'success';
    };
    listingRejected: {
      title: string;
      message: string;
      type: 'error';
    };
    newOffer: {
      title: string;
      message: string;
      type: 'info';
    };
    offerExpiring: {
      title: string;
      message: string;
      type: 'warning';
    };
  };
  
  // For Admin
  admin: {
    newListing: {
      title: string;
      message: string;
      priority: 'medium';
    };
    urgentReview: {
      title: string;
      message: string;
      priority: 'high';
    };
    saleCompleted: {
      title: string;
      message: string;
      priority: 'low';
    };
  };
}

// ============================================
// PLATFORM COMMISSION STRUCTURE
// ============================================

export const SELL_CAR_COMMISSION = {
  // Commission Tiers (based on sale price)
  tiers: [
    { from: 0, to: 100000, rate: 2.5 }, // 2.5% for cars up to 100K EGP
    { from: 100001, to: 300000, rate: 2.0 }, // 2% for 100K-300K
    { from: 300001, to: 500000, rate: 1.5 }, // 1.5% for 300K-500K
    { from: 500001, to: 1000000, rate: 1.0 }, // 1% for 500K-1M
    { from: 1000001, to: Infinity, rate: 0.75 }, // 0.75% for 1M+
  ],
  
  // Minimum Commission
  minimum: 1000, // Minimum 1000 EGP
  
  // Maximum Commission
  maximum: 50000, // Maximum 50000 EGP
  
  // Additional Services (optional)
  additionalServices: {
    featuredListing: 500, // EGP per week
    professionalPhotography: 1500, // EGP
    inspectionReport: 2000, // EGP
    valuationReport: 1000, // EGP
    marketingBoost: 750, // EGP per week
  },
};