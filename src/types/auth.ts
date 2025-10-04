/**
 * 🔐 Authentication & User Types
 * Professional user management system
 */

export type UserRole = 'admin' | 'vendor' | 'customer';

export interface User {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  photoURL?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastLoginAt?: Date | string;
  
  // Profile data
  profile?: UserProfile;
  
  // Vendor-specific
  vendorId?: string;
  vendorStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
  
  // Admin-specific
  permissions?: string[];
  
  // Customer-specific
  customerTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  
  // Preferences
  preferences?: {
    language: 'ar' | 'en';
    currency: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    theme?: 'light' | 'dark';
  };
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  dateOfBirth?: Date | string;
  gender?: 'male' | 'female';
  
  // Address information
  address?: {
    street?: string;
    city?: string;
    governorate?: string;
    country?: string;
    postalCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Contact information
  phoneNumber?: string;
  whatsappNumber?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  
  // Business information (for vendors)
  businessInfo?: {
    businessName?: string;
    businessType?: string;
    taxId?: string;
    commercialRegister?: string;
    website?: string;
    description?: string;
  };
  
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: UserRole;
  acceptTerms: boolean;
}

export interface AuthMethods {
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Role-based permissions
export const ROLE_PERMISSIONS = {
  admin: [
    'users:read',
    'users:write',
    'users:delete',
    'vendors:read',
    'vendors:write',
    'vendors:approve',
    'products:read',
    'products:write',
    'products:delete',
    'orders:read',
    'orders:write',
    'analytics:read',
    'system:manage',
  ],
  vendor: [
    'profile:read',
    'profile:write',
    'products:read',
    'products:write',
    'products:delete',
    'orders:read',
    'orders:update',
    'analytics:read:own',
    'customers:read:own',
  ],
  customer: [
    'profile:read',
    'profile:write',
    'products:read',
    'orders:read:own',
    'orders:create',
    'favorites:manage',
    'reviews:write',
  ],
} as const;

export type Permission = typeof ROLE_PERMISSIONS[keyof typeof ROLE_PERMISSIONS][number];

// Helper functions
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true; // Admin has all permissions
  return ROLE_PERMISSIONS[user.role].includes(permission);
};

export const canAccessRoute = (user: User | null, requiredRole: UserRole | UserRole[]): boolean => {
  if (!user) return false;
  
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(user.role);
};

export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Guest';
  
  if (user.displayName) return user.displayName;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.email) return user.email.split('@')[0];
  
  return 'User';
};

export const getRoleDisplayName = (role: UserRole, language: 'ar' | 'en' = 'ar'): string => {
  const roleNames = {
    ar: {
      admin: 'مدير',
      vendor: 'تاجر',
      customer: 'عميل',
    },
    en: {
      admin: 'Admin',
      vendor: 'Vendor',
      customer: 'Customer',
    },
  };
  
  return roleNames[language][role];
};