/**
 * Firebase Functions Service for Souk El-Sayarat
 * Handles all backend operations and automated processes
 */

import { functions } from '@/config/firebase.config';
import { connectFunctionsEmulator, Functions, httpsCallable } from 'firebase/functions';

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    // if (process.env.NODE_ENV === 'development') // console.log('Connected to Firebase Functions emulator');
  } catch (error) {
    // if (process.env.NODE_ENV === 'development') // console.log('Functions emulator already connected');
  }
}

export interface EmailNotificationData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export interface VendorApprovalData {
  applicationId: string;
  vendorId: string;
  businessName: string;
  contactPerson: string;
  email: string;
  status: 'approved' | 'rejected';
  notes?: string;
}

export interface OrderNotificationData {
  orderId: string;
  customerId: string;
  vendorId: string;
  status: OrderStatus;
  totalAmount: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
}

export interface SystemNotificationData {
  type: 'system_maintenance' | 'feature_update' | 'security_alert';
  title: string;
  message: string;
  targetUsers: 'all' | 'vendors' | 'customers' | 'admins';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export class FirebaseFunctionsService {
  private static instance: FirebaseFunctionsService;
  private functions: Functions;

  private constructor() {
    this.functions = functions;
  }

  static getInstance(): FirebaseFunctionsService {
    if (!FirebaseFunctionsService.instance) {
      FirebaseFunctionsService.instance = new FirebaseFunctionsService();
    }
    return FirebaseFunctionsService.instance;
  }

  /**
   * Send email notification using Firebase Functions
   */
  async sendEmailNotification(data: EmailNotificationData): Promise<void> {
    try {
      const sendEmail = httpsCallable(this.functions, 'sendEmailNotification');
      await sendEmail(data);
      // if (process.env.NODE_ENV === 'development') // console.log('Email notification sent successfully');
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          // console.error('Error sending email notification:', error);
      throw new Error('Failed to send email notification');
    }
  }

  /**
   * Process vendor approval/rejection
   */
  async processVendorApproval(data: VendorApprovalData): Promise<void> {
    try {
      const processApproval = httpsCallable(this.functions, 'processVendorApproval');
      await processApproval(data);
      // if (process.env.NODE_ENV === 'development') // console.log('Vendor approval processed successfully');
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          // console.error('Error processing vendor approval:', error);
      throw new Error('Failed to process vendor approval');
    }
  }

  /**
   * Send order status notifications
   */
  async sendOrderNotification(data: OrderNotificationData): Promise<void> {
    try {
      const sendOrderNotification = httpsCallable(this.functions, 'sendOrderNotification');
      await sendOrderNotification(data);
      // if (process.env.NODE_ENV === 'development') // console.log('Order notification sent successfully');
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          // console.error('Error sending order notification:', error);
      throw new Error('Failed to send order notification');
    }
  }

  /**
   * Send system-wide notifications
   */
  async sendSystemNotification(data: SystemNotificationData): Promise<void> {
    try {
      const sendSystemNotification = httpsCallable(this.functions, 'sendSystemNotification');
      await sendSystemNotification(data);
      // if (process.env.NODE_ENV === 'development') // console.log('System notification sent successfully');
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          // console.error('Error sending system notification:', error);
      throw new Error('Failed to send system notification');
    }
  }

  /**
   * Generate and send analytics reports
   */
  async generateAnalyticsReport(
    reportType: 'daily' | 'weekly' | 'monthly',
    dateRange: { start: Date; end: Date }
  ): Promise<void> {
    try {
      const generateReport = httpsCallable(this.functions, 'generateAnalyticsReport');
      await generateReport({ reportType, dateRange });
      // if (process.env.NODE_ENV === 'development') // console.log('Analytics report generated successfully');
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          // console.error('Error generating analytics report:', error);
      throw new Error('Failed to generate analytics report');
    }
  }

  /**
   * Process payment webhooks
   */
  async processPaymentWebhook(webhookData: unknown): Promise<void> {
    try {
      const processWebhook = httpsCallable(this.functions, 'processPaymentWebhook');
      await processWebhook(webhookData);
      // if (process.env.NODE_ENV === 'development') // console.log('Payment webhook processed successfully');
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          // console.error('Error processing payment webhook:', error);
      throw new Error('Failed to process payment webhook');
    }
  }

  /**
   * Backup database
   */
  async backupDatabase(backupType: 'full' | 'incremental'): Promise<void> {
    try {
      const backupDb = httpsCallable(this.functions, 'backupDatabase');
      await backupDb({ backupType });
      // if (process.env.NODE_ENV === 'development') // console.log('Database backup initiated successfully');
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          // console.error('Error initiating database backup:', error);
      throw new Error('Failed to initiate database backup');
    }
  }

  /**
   * Clean up expired data
   */
  async cleanupExpiredData(): Promise<void> {
    try {
      const cleanup = httpsCallable(this.functions, 'cleanupExpiredData');
      await cleanup();
      // if (process.env.NODE_ENV === 'development') // console.log('Data cleanup completed successfully');
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          // console.error('Error during data cleanup:', error);
      throw new Error('Failed to cleanup expired data');
    }
  }

  /**
   * Process bulk operations
   */
  async processBulkOperation(
    operation: 'bulkEmail' | 'bulkUpdate' | 'bulkDelete',
    data: unknown[]
  ): Promise<void> {
    try {
      const bulkOp = httpsCallable(this.functions, 'processBulkOperation');
      await bulkOp({ operation, data });
      // if (process.env.NODE_ENV === 'development') // console.log('Bulk operation completed successfully');
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          // console.error('Error during bulk operation:', error);
      throw new Error('Failed to process bulk operation');
    }
  }

  /**
   * Health check for backend services
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    timestamp: Date;
  }> {
    try {
      const healthCheck = httpsCallable(this.functions, 'healthCheck');
      const result = await healthCheck();
      return result.data as any;
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          // console.error('Error during health check:', error);
      return {
        status: 'unhealthy',
        services: {},
        timestamp: new Date(),
      };
    }
  }
}

// Export singleton instance
export const firebaseFunctionsService = FirebaseFunctionsService.getInstance();
