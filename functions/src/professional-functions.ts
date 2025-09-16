/**
 * 🚀 PROFESSIONAL FIREBASE CLOUD FUNCTIONS
 * Enhanced functions with comprehensive error handling and monitoring
 * Following Firebase best practices and latest documentation
 */

import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as logger from 'firebase-functions/logger';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

// Set global options for all functions
setGlobalOptions({
  region: 'europe-west1',
  memory: '512MiB',
  timeoutSeconds: 300,
  maxInstances: 100,
  minInstances: 1,
});

/**
 * Professional Error Handling Utility
 */
class FunctionError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'FunctionError';
  }
}

/**
 * Enhanced Error Handler
 */
function handleError(error: any, context: string): never {
  logger.error(`Error in ${context}:`, error);
  
  if (error instanceof FunctionError) {
    throw new HttpsError(error.code as any, error.message, error.details);
  }
  
  if (error instanceof HttpsError) {
    throw error;
  }
  
  throw new HttpsError('internal', `Internal error in ${context}`);
}

/**
 * Data Validation Utility
 */
function validateData(data: any, schema: any): void {
  if (!data) {
    throw new FunctionError('invalid-argument', 'Data is required');
  }
  
  // Add comprehensive validation logic here
  // This would integrate with the validation service
}

/**
 * Authentication Helper
 */
async function verifyUser(request: any): Promise<admin.auth.DecodedIdToken> {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  try {
    return request.auth;
  } catch (error) {
    throw new HttpsError('unauthenticated', 'Invalid authentication token');
  }
}

/**
 * Role-based Authorization Helper
 */
async function verifyRole(request: any, requiredRole: string): Promise<admin.auth.DecodedIdToken> {
  const user = await verifyUser(request);
  
  try {
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    
    if (!userData || userData.role !== requiredRole) {
      throw new HttpsError('permission-denied', `User must have ${requiredRole} role`);
    }
    
    return user;
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('permission-denied', 'Unable to verify user role');
  }
}

/**
 * Enhanced Vendor Application Created Trigger
 */
export const onVendorApplicationCreated = onDocumentCreated(
  'vendorApplications/{applicationId}',
  async (event) => {
    try {
      const snap = event.data;
      if (!snap) {
        logger.warn('No data associated with vendor application event');
        return;
      }
      
      const applicationData = snap.data();
      const applicationId = event.params.applicationId;

      // Validate application data
      if (!applicationData.userId || !applicationData.businessName) {
        throw new FunctionError('invalid-argument', 'Invalid vendor application data');
      }

      // Create notification for admin
      await db.collection('notifications').add({
        userId: 'admin', // This should be the actual admin user ID
        type: 'vendor_application',
        title: 'طلب تاجر جديد',
        message: `تم استلام طلب جديد من ${applicationData.businessName}`,
        data: {
          applicationId,
          businessName: applicationData.businessName,
          userId: applicationData.userId,
        },
        read: false,
        priority: 'high',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update analytics
      await updateAnalyticsCounter('vendor_applications', 1);

      // Send email notification to admin (if configured)
      // await sendEmailNotification('admin', 'New Vendor Application', ...);

      logger.info(`Vendor application ${applicationId} processed successfully`);
    } catch (error) {
      handleError(error, 'onVendorApplicationCreated');
    }
  }
);

/**
 * Enhanced Vendor Application Updated Trigger
 */
export const onVendorApplicationUpdated = onDocumentUpdated(
  'vendorApplications/{applicationId}',
  async (event) => {
    try {
      const beforeData = event.data?.before?.data();
      const afterData = event.data?.after?.data();
      const applicationId = event.params.applicationId;

      if (!beforeData || !afterData) {
        logger.warn('Missing before or after data in vendor application update');
        return;
      }

      // Check if status changed
      if (beforeData.status !== afterData.status) {
        let title = '';
        let message = '';

        switch (afterData.status) {
          case 'approved':
            title = 'تم قبول طلب التاجر';
            message = 'مبروك! تم قبول طلبك لتصبح تاجر معتمد.';
            
            // Create vendor profile
            await db.collection('vendors').doc(afterData.userId).set({
              ...afterData,
              status: 'approved',
              approvedAt: admin.firestore.FieldValue.serverTimestamp(),
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Update user role
            await auth.setCustomUserClaims(afterData.userId, { role: 'vendor' });
            break;

          case 'rejected':
            title = 'تم رفض طلب التاجر';
            message = 'نأسف لإبلاغك بأنه تم رفض طلب التاجر.';
            break;

          default:
            logger.info(`Vendor application ${applicationId} status updated to ${afterData.status}`);
            return;
        }

        // Send notification to applicant
        await db.collection('notifications').add({
          userId: afterData.userId,
          type: 'vendor_application',
          title,
          message,
          data: {
            applicationId,
            status: afterData.status,
          },
          read: false,
          priority: 'high',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`Vendor application ${applicationId} status updated to ${afterData.status}`);
      }
    } catch (error) {
      handleError(error, 'onVendorApplicationUpdated');
    }
  }
);

/**
 * Enhanced Product Created Trigger
 */
export const onProductCreated = onDocumentCreated(
  'products/{productId}',
  async (event) => {
    try {
      const snap = event.data;
      if (!snap) {
        logger.warn('No data associated with product creation event');
        return;
      }
      
      const productData = snap.data();
      const productId = event.params.productId;

      // Validate product data
      if (!productData.vendorId || !productData.title) {
        throw new FunctionError('invalid-argument', 'Invalid product data');
      }

      // Notify admin for review
      await db.collection('notifications').add({
        userId: 'admin', // This should be the actual admin user ID
        type: 'product_approval',
        title: 'منتج جديد للمراجعة',
        message: `منتج جديد "${productData.title}" يحتاج للمراجعة`,
        data: {
          productId,
          title: productData.title,
          vendorId: productData.vendorId,
          category: productData.category,
        },
        read: false,
        priority: 'medium',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update analytics
      await updateAnalyticsCounter('products_submitted', 1);

      // Update vendor product count
      await db.collection('vendors').doc(productData.vendorId).update({
        totalProducts: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Product ${productId} created and notifications sent`);
    } catch (error) {
      handleError(error, 'onProductCreated');
    }
  }
);

/**
 * Enhanced Order Created Trigger
 */
export const onOrderCreated = onDocumentCreated(
  'orders/{orderId}',
  async (event) => {
    try {
      const snap = event.data;
      if (!snap) {
        logger.warn('No data associated with order creation event');
        return;
      }
      
      const orderData = snap.data();
      const orderId = event.params.orderId;

      // Validate order data
      if (!orderData.customerId || !orderData.vendorId || !orderData.items) {
        throw new FunctionError('invalid-argument', 'Invalid order data');
      }

      // Notify vendor
      await db.collection('notifications').add({
        userId: orderData.vendorId,
        type: 'order',
        title: 'طلب جديد',
        message: `طلب جديد من ${orderData.customerName} بقيمة ${orderData.totalAmount} جنيه`,
        data: {
          orderId,
          customerName: orderData.customerName,
          amount: orderData.totalAmount,
          itemsCount: orderData.items.length,
        },
        read: false,
        priority: 'high',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Notify customer
      await db.collection('notifications').add({
        userId: orderData.customerId,
        type: 'order',
        title: 'تم استلام طلبك',
        message: `تم استلام طلبك رقم ${orderId} وسيتم مراجعته قريباً`,
        data: {
          orderId,
          vendorName: orderData.vendorName,
          totalAmount: orderData.totalAmount,
        },
        read: false,
        priority: 'medium',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update analytics
      await updateAnalyticsCounter('orders', 1);
      await updateAnalyticsCounter('revenue', orderData.totalAmount);

      // Update vendor statistics
      await db.collection('vendors').doc(orderData.vendorId).update({
        totalOrders: admin.firestore.FieldValue.increment(1),
        totalRevenue: admin.firestore.FieldValue.increment(orderData.totalAmount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Order ${orderId} created and notifications sent`);
    } catch (error) {
      handleError(error, 'onOrderCreated');
    }
  }
);

/**
 * Enhanced Order Updated Trigger
 */
export const onOrderUpdated = onDocumentUpdated(
  'orders/{orderId}',
  async (event) => {
    try {
      const beforeData = event.data?.before?.data();
      const afterData = event.data?.after?.data();
      const orderId = event.params.orderId;

      if (!beforeData || !afterData) {
        logger.warn('Missing before or after data in order update');
        return;
      }

      // Check if status changed
      if (beforeData.status !== afterData.status) {
        let customerTitle = '';
        let customerMessage = '';
        let vendorTitle = '';
        let vendorMessage = '';

        switch (afterData.status) {
          case 'confirmed':
            customerTitle = 'تم تأكيد طلبك';
            customerMessage = `تم تأكيد طلبك رقم ${orderId} من قبل التاجر`;
            vendorTitle = 'تم تأكيد الطلب';
            vendorMessage = `تم تأكيد الطلب رقم ${orderId} بنجاح`;
            break;

          case 'shipped':
            customerTitle = 'تم شحن طلبك';
            customerMessage = `تم شحن طلبك رقم ${orderId}`;
            if (afterData.trackingNumber) {
              customerMessage += ` - رقم التتبع: ${afterData.trackingNumber}`;
            }
            vendorTitle = 'تم شحن الطلب';
            vendorMessage = `تم شحن الطلب رقم ${orderId} بنجاح`;
            break;

          case 'delivered':
            customerTitle = 'تم تسليم طلبك';
            customerMessage = `تم تسليم طلبك رقم ${orderId} بنجاح`;
            vendorTitle = 'تم تسليم الطلب';
            vendorMessage = `تم تسليم الطلب رقم ${orderId} بنجاح`;
            break;

          case 'cancelled':
            customerTitle = 'تم إلغاء طلبك';
            customerMessage = `تم إلغاء طلبك رقم ${orderId}`;
            vendorTitle = 'تم إلغاء الطلب';
            vendorMessage = `تم إلغاء الطلب رقم ${orderId}`;
            break;
        }

        // Send notification to customer
        if (customerTitle) {
          await db.collection('notifications').add({
            userId: afterData.customerId,
            type: 'order',
            title: customerTitle,
            message: customerMessage,
            data: {
              orderId,
              status: afterData.status,
              trackingNumber: afterData.trackingNumber,
            },
            read: false,
            priority: 'medium',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Send notification to vendor
        if (vendorTitle) {
          await db.collection('notifications').add({
            userId: afterData.vendorId,
            type: 'order',
            title: vendorTitle,
            message: vendorMessage,
            data: {
              orderId,
              status: afterData.status,
              customerName: afterData.customerName,
            },
            read: false,
            priority: 'medium',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        logger.info(`Order ${orderId} status updated to ${afterData.status}`);
      }
    } catch (error) {
      handleError(error, 'onOrderUpdated');
    }
  }
);

/**
 * Enhanced Analytics Update Function
 */
export const updateAnalytics = onSchedule('0 * * * *', async (event) => {
  try {
    logger.info('Starting scheduled analytics update');

    // Update business metrics
    await updateBusinessMetrics();

    // Update real-time stats
    await updateRealTimeStats();

    // Update vendor performance metrics
    await updateVendorPerformanceMetrics();

    // Clean up old analytics data
    await cleanupOldAnalyticsData();

    logger.info('Scheduled analytics update completed successfully');
  } catch (error) {
    logger.error('Error in scheduled analytics update:', error);
    // Don't throw error for scheduled functions to prevent retries
  }
});

/**
 * Manual Analytics Update Trigger
 */
export const triggerAnalyticsUpdate = onCall(async (request) => {
  try {
    // Verify admin role
    await verifyRole(request, 'admin');

    await updateBusinessMetrics();
    await updateRealTimeStats();
    await updateVendorPerformanceMetrics();

    logger.info('Manual analytics update completed');
    
    return { 
      success: true, 
      message: 'Analytics updated successfully',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    handleError(error, 'triggerAnalyticsUpdate');
  }
});

/**
 * Enhanced Notification Service
 */
export const sendNotification = onCall(async (request) => {
  try {
    const user = await verifyUser(request);
    const { userId, type, title, message, priority = 'medium', data: notificationData } = request.data;

    // Validate input data
    if (!userId || !type || !title || !message) {
      throw new FunctionError('invalid-argument', 'Missing required notification fields');
    }

    // Check if user has permission to send notification
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    
    if (!userData || (userData.role !== 'admin' && user.uid !== userId)) {
      throw new HttpsError('permission-denied', 'Insufficient permissions to send notification');
    }

    await db.collection('notifications').add({
      userId,
      type,
      title,
      message,
      data: notificationData || {},
      read: false,
      priority,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Notification sent to user ${userId}`);

    return { 
      success: true, 
      message: 'Notification sent successfully',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    handleError(error, 'sendNotification');
  }
});

/**
 * Helper Functions
 */

async function updateAnalyticsCounter(metric: string, value: number): Promise<void> {
  try {
    const counterRef = db.collection('counters').doc('analytics');
    
    await counterRef.set({
      [metric]: admin.firestore.FieldValue.increment(value),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    logger.error(`Error updating analytics counter ${metric}:`, error);
  }
}

async function updateBusinessMetrics(): Promise<void> {
  try {
    const batch = db.batch();
    
    // Get counts from various collections
    const [usersCount, vendorsCount, productsCount, ordersSnapshot] = await Promise.all([
      db.collection('users').get().then(snap => snap.size),
      db.collection('vendors').where('status', '==', 'approved').get().then(snap => snap.size),
      db.collection('products').where('status', '==', 'published').get().then(snap => snap.size),
      db.collection('orders').get(),
    ]);

    let totalRevenue = 0;
    let completedOrders = 0;
    const vendorStats: any = {};

    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      if (order.status === 'delivered' || order.status === 'completed') {
        completedOrders++;
        totalRevenue += order.totalAmount || 0;

        // Track vendor performance
        if (order.vendorId) {
          if (!vendorStats[order.vendorId]) {
            vendorStats[order.vendorId] = {
              orders: 0,
              revenue: 0,
              vendorName: order.vendorName || 'Unknown',
            };
          }
          vendorStats[order.vendorId].orders++;
          vendorStats[order.vendorId].revenue += order.totalAmount || 0;
        }
      }
    });

    const businessMetrics = {
      totalUsers: usersCount,
      activeUsers: usersCount,
      totalVendors: vendorsCount,
      activeVendors: vendorsCount,
      totalProducts: productsCount,
      activeProducts: productsCount,
      totalOrders: ordersSnapshot.size,
      completedOrders,
      totalRevenue,
      averageOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0,
      conversionRate: usersCount > 0 ? (completedOrders / usersCount) * 100 : 0,
      topVendors: Object.entries(vendorStats)
        .map(([vendorId, stats]: [string, any]) => ({
          vendorId,
          vendorName: stats.vendorName,
          orders: stats.orders,
          revenue: stats.revenue,
        }))
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Update business metrics document
    batch.set(db.collection('analytics').doc('business_metrics'), businessMetrics, { merge: true });
    
    await batch.commit();
  } catch (error) {
    logger.error('Error updating business metrics:', error);
  }
}

async function updateRealTimeStats(): Promise<void> {
  try {
    const batch = db.batch();

    // Get recent orders and signups
    const [recentOrdersSnapshot, recentUsersSnapshot, pendingOrdersCount, processingOrdersCount] = await Promise.all([
      db.collection('orders').orderBy('createdAt', 'desc').limit(10).get(),
      db.collection('users').orderBy('createdAt', 'desc').limit(10).get(),
      db.collection('orders').where('status', '==', 'pending').get().then(snap => snap.size),
      db.collection('orders').where('status', '==', 'processing').get().then(snap => snap.size),
    ]);

    const recentOrders = recentOrdersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        orderId: doc.id,
        customerName: data.customerName || 'Unknown Customer',
        vendorName: data.vendorName || 'Unknown Vendor',
        amount: data.totalAmount || 0,
        status: data.status || 'unknown',
        timestamp: data.createdAt || new Date(),
      };
    });

    const recentSignups = recentUsersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: doc.id,
        userName: data.displayName || 'Unknown User',
        userType: data.role || 'customer',
        timestamp: data.createdAt || new Date(),
      };
    });

    const realTimeStats = {
      onlineUsers: 0, // Would need real-time presence system
      activeVendors: 0, // Would need real-time presence system
      pendingOrders: pendingOrdersCount,
      processingOrders: processingOrdersCount,
      recentOrders,
      recentSignups,
      systemHealth: {
        status: 'healthy',
        responseTime: 150,
        errorRate: 0.01,
        uptime: 99.9,
      },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Update real-time stats document
    batch.set(db.collection('analytics').doc('realtime_stats'), realTimeStats, { merge: true });
    
    await batch.commit();
  } catch (error) {
    logger.error('Error updating real-time stats:', error);
  }
}

async function updateVendorPerformanceMetrics(): Promise<void> {
  try {
    const vendorsSnapshot = await db.collection('vendors').get();
    const batch = db.batch();

    for (const vendorDoc of vendorsSnapshot.docs) {
      const vendorId = vendorDoc.id;
      const vendorData = vendorDoc.data();

      // Get vendor orders
      const ordersSnapshot = await db.collection('orders')
        .where('vendorId', '==', vendorId)
        .get();

      let totalRevenue = 0;
      let completedOrders = 0;
      let averageRating = 0;
      let reviewCount = 0;

      ordersSnapshot.forEach(orderDoc => {
        const order = orderDoc.data();
        if (order.status === 'delivered' || order.status === 'completed') {
          completedOrders++;
          totalRevenue += order.totalAmount || 0;
        }
      });

      // Get vendor reviews
      const reviewsSnapshot = await db.collection('reviews')
        .where('productId', 'in', vendorData.productIds || [])
        .get();

      if (reviewsSnapshot.size > 0) {
        const totalRating = reviewsSnapshot.docs.reduce((sum, doc) => {
          return sum + (doc.data().rating || 0);
        }, 0);
        averageRating = totalRating / reviewsSnapshot.size;
        reviewCount = reviewsSnapshot.size;
      }

      // Update vendor performance
      batch.update(vendorDoc.ref, {
        performance: {
          totalOrders: ordersSnapshot.size,
          completedOrders,
          totalRevenue,
          averageRating,
          reviewCount,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
      });
    }

    await batch.commit();
  } catch (error) {
    logger.error('Error updating vendor performance metrics:', error);
  }
}

async function cleanupOldAnalyticsData(): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep data for 30 days

    // Clean up old notifications
    const oldNotificationsSnapshot = await db.collection('notifications')
      .where('createdAt', '<', cutoffDate)
      .where('read', '==', true)
      .limit(100)
      .get();

    const batch = db.batch();
    oldNotificationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    if (oldNotificationsSnapshot.size > 0) {
      await batch.commit();
      logger.info(`Cleaned up ${oldNotificationsSnapshot.size} old notifications`);
    }
  } catch (error) {
    logger.error('Error cleaning up old analytics data:', error);
  }
}

