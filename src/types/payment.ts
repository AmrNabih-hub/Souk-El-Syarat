/**
 * Payment System Types
 * COD for customers, Instapay invoice verification for vendor subscriptions
 */

// Customer Payment Types
export type CustomerPaymentMethod = 'cod' | 'cash_on_delivery';

export interface CODOrder {
  id: string;
  customerId: string;
  vendorId: string;
  products: OrderProduct[];
  totalAmount: number;
  currency: 'EGP';
  deliveryAddress: DeliveryAddress;
  contactInfo: ContactInfo;
  specialInstructions?: string;
  estimatedDeliveryDate: Date;
  paymentMethod: 'cod';
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderProduct {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications?: Record<string, string>;
}

export interface DeliveryAddress {
  recipientName: string;
  phoneNumber: string;
  governorate: string;
  city: string;
  area: string;
  street: string;
  buildingNumber?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ContactInfo {
  primaryPhone: string;
  alternativePhone?: string;
  whatsappNumber?: string;
  email?: string;
}

// Vendor Subscription Types
export type VendorSubscriptionPlan = 'basic' | 'premium' | 'enterprise';

export interface SubscriptionPlan {
  id: VendorSubscriptionPlan;
  name: string;
  nameAr: string;
  price: number;
  currency: 'EGP';
  duration: number; // in months
  features: SubscriptionFeature[];
  limits: SubscriptionLimits;
  instapayNumber: string; // Souk El-Syarat Instapay number
  isPopular?: boolean;
}

export interface SubscriptionFeature {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  included: boolean;
}

export interface SubscriptionLimits {
  maxProducts: number | 'unlimited';
  maxImages: number;
  featuredListings: number;
  analyticsAccess: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
}

export interface InstapayInvoice {
  id: string;
  vendorId: string;
  subscriptionPlan: VendorSubscriptionPlan;
  amount: number;
  currency: 'EGP';
  instapayTransactionId?: string;
  receiptImage: File | string; // Base64 or file path
  receiptImageUrl?: string;
  submittedAt: Date;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: string; // Admin ID
}

export interface VendorSubscription {
  id: string;
  vendorId: string;
  plan: VendorSubscriptionPlan;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  autoRenew: boolean;
  paymentHistory: InstapayInvoice[];
  createdAt: Date;
  updatedAt: Date;
}

// Payment Settings
export interface PaymentSettings {
  cod: {
    enabled: boolean;
    minimumOrderAmount: number;
    maximumOrderAmount: number;
    deliveryFee: number;
    freeDeliveryThreshold: number;
    supportedGovernorates: string[];
  };
  instapay: {
    enabled: boolean;
    soukElSyaratNumber: string;
    accountName: string;
    instructions: string;
    instructionsAr: string;
  };
}

// Order Management
export interface OrderTracking {
  orderId: string;
  status: CODOrder['status'];
  timeline: OrderStatusUpdate[];
  estimatedDelivery: Date;
  actualDelivery?: Date;
  deliveryAgent?: {
    name: string;
    phone: string;
  };
}

export interface OrderStatusUpdate {
  status: CODOrder['status'];
  timestamp: Date;
  note?: string;
  updatedBy: string; // Admin or system
}