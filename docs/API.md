# 🚀 **SOUK EL-SAYARAT API DOCUMENTATION**

## **Overview**
This document provides comprehensive documentation for the Souk El-Sayarat e-commerce marketplace platform API. The platform is built with React, TypeScript, and Firebase, providing real-time data synchronization and professional-grade backend services.

## **Table of Contents**
1. [Authentication](#authentication)
2. [Real-time Services](#real-time-services)
3. [Admin Services](#admin-services)
4. [Notification Services](#notification-services)
5. [Firebase Functions](#firebase-functions)
6. [Data Models](#data-models)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## **🔐 Authentication**

### **Enhanced Authentication Service**

The `EnhancedAuthService` provides secure, real-time authentication with role-based access control.

#### **Sign Up**
```typescript
static async signUp(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'customer',
  phoneNumber?: string
): Promise<User>
```

**Parameters:**
- `email`: User's email address
- `password`: Secure password (min 8 characters)
- `displayName`: User's display name
- `role`: User role ('customer', 'vendor', 'admin')
- `phoneNumber`: Optional phone number

**Returns:** `User` object with complete profile

**Example:**
```typescript
import { EnhancedAuthService } from '@/services/enhanced-auth.service';

const user = await EnhancedAuthService.signUp(
  'user@example.com',
  'securePassword123',
  'John Doe',
  'customer',
  '+201234567890'
);
```

#### **Admin Sign In**
```typescript
static async adminSignIn(adminData: AdminAuthData): Promise<User>
```

**Parameters:**
- `adminData.email`: Admin email
- `adminData.password`: Admin password
- `adminData.adminCode`: Special admin access code

**Returns:** `User` object with admin privileges

**Example:**
```typescript
const admin = await EnhancedAuthService.adminSignIn({
  email: 'admin@souk.com',
  password: 'adminPassword123',
  adminCode: 'ADMIN_2024'
});
```

#### **Social Authentication**
```typescript
static async signInWithGoogle(): Promise<User>
static async signInWithFacebook(): Promise<User>
static async signInWithTwitter(): Promise<User>
```

**Returns:** `User` object from social provider

#### **Multi-Factor Authentication**
```typescript
static async enableMultiFactor(phoneNumber: string): Promise<void>
static async verifyMultiFactor(verificationCode: string): Promise<void>
```

---

## **⚡ Real-time Services**

### **RealtimeService**

The `RealtimeService` provides real-time data synchronization across all platform components.

#### **User Subscriptions**
```typescript
subscribeToUser(
  userId: string,
  callback: (user: User | null) => void
): RealtimeSubscription
```

**Parameters:**
- `userId`: User ID to subscribe to
- `callback`: Function called when user data changes

**Returns:** `RealtimeSubscription` object for management

**Example:**
```typescript
import { realtimeService } from '@/services/realtime.service';

const subscription = realtimeService.subscribeToUser('user123', (user) => {
  if (user) {
    console.log('User updated:', user.displayName);
  }
});

// Later, unsubscribe
subscription.unsubscribe();
```

#### **Collection Subscriptions**
```typescript
subscribeToFirestoreCollection<T>(
  collectionName: string,
  callback: (data: T[]) => void,
  options: {
    filters?: Array<{ field: string; operator: string; value: any }>;
    orderBy?: { field: string; direction: 'asc' | 'desc' };
    limit?: number;
  } = {}
): RealtimeSubscription
```

**Parameters:**
- `collectionName`: Firestore collection name
- `callback`: Function called when collection data changes
- `options`: Query options for filtering, ordering, and limiting

**Example:**
```typescript
const subscription = realtimeService.subscribeToFirestoreCollection<Product>(
  'products',
  (products) => console.log('Products updated:', products.length),
  {
    filters: [{ field: 'status', operator: '==', value: 'published' }],
    orderBy: { field: 'createdAt', direction: 'desc' },
    limit: 20
  }
);
```

#### **Document Subscriptions**
```typescript
subscribeToFirestoreDocument<T>(
  collectionName: string,
  documentId: string,
  callback: (data: T | null) => void
): RealtimeSubscription
```

**Example:**
```typescript
const subscription = realtimeService.subscribeToFirestoreDocument<Order>(
  'orders',
  'order123',
  (order) => {
    if (order) {
      console.log('Order status:', order.status);
    }
  }
);
```

#### **Connection Management**
```typescript
getStats(): RealtimeStats
getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' | 'error'
testConnection(): Promise<boolean>
```

---

## **👑 Admin Services**

### **AdminService**

The `AdminService` provides comprehensive administrative functions for platform management.

#### **Platform Statistics**
```typescript
static async getAdminStats(): Promise<AdminStats>
```

**Returns:** Complete platform statistics including:
- User counts and growth
- Vendor statistics
- Product metrics
- Revenue analytics
- Platform health indicators

**Example:**
```typescript
import { AdminService } from '@/services/admin.service';

const stats = await AdminService.getAdminStats();
console.log('Total users:', stats.totalUsers);
console.log('Monthly revenue:', stats.monthlyRevenue);
```

#### **Vendor Application Management**
```typescript
static subscribeToApplications(
  status: 'pending' | 'approved' | 'rejected' | 'all' = 'all',
  callback: (applications: VendorApplication[]) => void
): () => void
```

**Example:**
```typescript
const unsubscribe = AdminService.subscribeToApplications('pending', (apps) => {
  console.log('Pending applications:', apps.length);
});

// Later, unsubscribe
unsubscribe();
```

#### **Vendor Approval Process**
```typescript
static async processVendorApplication(
  approvalData: VendorApprovalData
): Promise<void>
```

**Parameters:**
- `approvalData.applicationId`: Application ID
- `approvalData.status`: 'approved' or 'rejected'
- `approvalData.notes`: Optional review notes
- `approvalData.adminId`: Admin user ID

**Example:**
```typescript
await AdminService.processVendorApplication({
  applicationId: 'app123',
  status: 'approved',
  notes: 'Excellent business plan and documentation',
  adminId: 'admin123'
});
```

#### **Vendor Status Management**
```typescript
static async toggleVendorStatus(
  vendorId: string,
  status: 'active' | 'suspended',
  adminId: string,
  reason?: string
): Promise<void>
```

---

## **🔔 Notification Services**

### **NotificationService**

The `NotificationService` handles all platform notifications including email, push, and in-app notifications.

#### **Email Notifications**
```typescript
async sendEmailNotification(
  to: string,
  templateId: string,
  data: Record<string, any>
): Promise<void>
```

**Parameters:**
- `to`: Recipient email address
- `templateId`: Notification template ID
- `data`: Template variables for personalization

**Available Templates:**
- `vendor-approved`: Vendor application approval
- `vendor-rejected`: Vendor application rejection
- `order-confirmed`: Order confirmation
- `order-shipped`: Order shipment notification
- `welcome-user`: Welcome message for new users

**Example:**
```typescript
import { notificationService } from '@/services/notification.service';

await notificationService.sendEmailNotification(
  'vendor@example.com',
  'vendor-approved',
  {
    contactPerson: 'John Doe',
    businessName: 'Premium Auto Parts'
  }
);
```

#### **Push Notifications**
```typescript
async sendPushNotification(
  userId: string,
  notificationData: PushNotificationData
): Promise<void>
```

**Parameters:**
- `userId`: Target user ID
- `notificationData`: Push notification content

**Example:**
```typescript
await notificationService.sendPushNotification('user123', {
  title: 'Order Shipped!',
  body: 'Your order #12345 has been shipped',
  data: { orderId: '12345', status: 'shipped' },
  requireInteraction: true
});
```

#### **Vendor Approval Notifications**
```typescript
async sendVendorApprovalNotification(
  vendor: Vendor,
  status: 'approved' | 'rejected',
  notes?: string
): Promise<void>
```

**Automatically sends:**
- Email notification
- In-app notification
- Push notification (if enabled)

---

## **⚙️ Firebase Functions**

### **FirebaseFunctionsService**

The `FirebaseFunctionsService` provides backend automation and serverless functions.

#### **Email Automation**
```typescript
async sendEmailNotification(data: EmailNotificationData): Promise<void>
```

**Parameters:**
- `data.to`: Recipient email
- `data.subject`: Email subject
- `data.template`: Email template
- `data.data`: Template variables
- `data.attachments`: Optional file attachments

#### **Vendor Approval Processing**
```typescript
async processVendorApproval(data: VendorApprovalData): Promise<void>
```

**Automatically:**
- Updates application status
- Creates vendor profile
- Sends notifications
- Updates user roles
- Logs admin actions

#### **Analytics Reports**
```typescript
async generateAnalyticsReport(
  reportType: 'daily' | 'weekly' | 'monthly',
  dateRange: { start: Date; end: Date }
): Promise<void>
```

#### **System Health Monitoring**
```typescript
async healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, boolean>;
  timestamp: Date;
}>
```

---

## **📊 Data Models**

### **Core Interfaces**

#### **User**
```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  photoURL?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  preferences?: UserPreferences;
}
```

#### **Vendor**
```typescript
interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  description: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  status: VendorStatus;
  rating: number;
  totalSales: number;
  joinedDate: Date;
  isVerified: boolean;
}
```

#### **Product**
```typescript
interface Product {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  category: ProductCategory;
  price: number;
  currency: 'EGP' | 'USD';
  images: ProductImage[];
  specifications: ProductSpecification[];
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

#### **Order**
```typescript
interface Order {
  id: string;
  customerId: string;
  vendorId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## **❌ Error Handling**

### **Error Types**

#### **Authentication Errors**
```typescript
'auth/user-not-found': 'No account found with this email address'
'auth/wrong-password': 'Incorrect password'
'auth/invalid-email': 'Invalid email address'
'auth/user-disabled': 'This account has been disabled'
'auth/too-many-requests': 'Too many failed attempts. Please try again later'
```

#### **Permission Errors**
```typescript
'permission-denied': 'Access denied. Insufficient permissions'
'not-found': 'Resource not found'
'invalid-argument': 'Invalid input parameters'
```

### **Error Handling Pattern**
```typescript
try {
  const result = await service.method(params);
  return result;
} catch (error: any) {
  console.error('Service error:', error);
  throw new Error(getErrorMessage(error.code));
}
```

---

## **🚦 Rate Limiting**

### **Firebase Limits**
- **Firestore:** 1 million reads, 100k writes per day (free tier)
- **Authentication:** 10,000 sign-ups per month (free tier)
- **Functions:** 125K invocations per month (free tier)
- **Storage:** 5GB storage (free tier)

### **Application Limits**
- **API Calls:** 100 requests per minute per user
- **File Uploads:** 10MB per file, 100 files per day
- **Real-time Connections:** 100 concurrent connections per user

---

## **🔧 Development Setup**

### **Environment Variables**
```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Development
REACT_APP_USE_EMULATORS=true
REACT_APP_EMULATOR_HOST=localhost
```

### **Local Development**
```bash
# Start Firebase emulators
firebase emulators:start

# Start development server
npm run dev

# Run tests
npm run test
npm run test:coverage
```

---

## **📈 Performance & Monitoring**

### **Real-time Metrics**
- **Connection Status:** Monitor active connections
- **Event Count:** Track total real-time events
- **Response Time:** Measure service performance
- **Error Rate:** Monitor system health

### **Health Checks**
```typescript
// Check service health
const health = await firebaseFunctionsService.healthCheck();
console.log('Service status:', health.status);

// Monitor real-time connections
const stats = realtimeService.getStats();
console.log('Active connections:', stats.activeConnections);
```

---

## **🔒 Security**

### **Authentication**
- **Multi-factor authentication** for admin accounts
- **Role-based access control** (RBAC)
- **Session management** with automatic expiry
- **Secure admin codes** for administrative access

### **Data Protection**
- **Firestore security rules** for data access control
- **Input validation** and sanitization
- **Rate limiting** to prevent abuse
- **Audit logging** for all administrative actions

---

## **📞 Support & Contact**

### **Technical Support**
- **Email:** tech-support@souk-elsayarat.com
- **Documentation:** https://docs.souk-elsayarat.com
- **GitHub Issues:** https://github.com/souk-elsayarat/issues

### **Business Inquiries**
- **Email:** business@souk-elsayarat.com
- **Phone:** +20 123 456 7890
- **Address:** Cairo, Egypt

---

*Last Updated: December 2024*
*Version: 1.0.0*
