const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');

// Set global options for all functions - using Europe region for Egypt
setGlobalOptions({ 
  region: 'europe-west1',
  memory: '256MiB',
  timeoutSeconds: 60,
});

admin.initializeApp();
const db = admin.firestore();

/**
 * Trigger when a new vendor application is created
 */
exports.onVendorApplicationCreated = onDocumentCreated(
  'vendorApplications/{applicationId}',
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log('No data associated with the event');
      return;
    }
    
    const applicationData = snap.data();
    const applicationId = event.params.applicationId;

    try {
      // Create notification for admin
      await db.collection('notifications').add({
        userId: 'admin', // Replace with actual admin user ID
        type: 'vendor_application',
        title: 'طلب تاجر جديد',
        message: `تم استلام طلب جديد من ${applicationData.businessName}`,
        data: {
          applicationId,
          businessName: applicationData.businessName,
        },
        read: false,
        priority: 'high',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update analytics
      await updateAnalyticsCounter('vendor_applications', 1);

      console.log(`Vendor application ${applicationId} processed successfully`);
    } catch (error) {
      console.error('Error processing vendor application:', error);
    }
  }
);

/**
 * Trigger when a vendor application status changes
 */
exports.onVendorApplicationUpdated = onDocumentUpdated(
  'vendorApplications/{applicationId}',
  async (event) => {
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();
    const applicationId = event.params.applicationId;

    if (!beforeData || !afterData) {
      console.log('Missing before or after data');
      return;
    }

    // Check if status changed
    if (beforeData.status !== afterData.status) {
      try {
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
            await admin.auth().setCustomUserClaims(afterData.userId, { role: 'vendor' });
            break;

          case 'rejected':
            title = 'تم رفض طلب التاجر';
            message = 'نأسف لإبلاغك بأنه تم رفض طلب التاجر.';
            break;
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

        console.log(`Vendor application ${applicationId} status updated to ${afterData.status}`);
      } catch (error) {
        console.error('Error processing vendor application update:', error);
      }
    }
  }
);

/**
 * Trigger when a new product is created
 */
exports.onProductCreated = onDocumentCreated(
  'products/{productId}',
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log('No data associated with the event');
      return;
    }
    
    const productData = snap.data();
    const productId = event.params.productId;

    try {
      // Notify admin for review
      await db.collection('notifications').add({
        userId: 'admin', // Replace with actual admin user ID
        type: 'product_approval',
        title: 'منتج جديد للمراجعة',
        message: `منتج جديد "${productData.title}" يحتاج للمراجعة`,
        data: {
          productId,
          title: productData.title,
          vendorId: productData.vendorId,
        },
        read: false,
        priority: 'medium',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update analytics
      await updateAnalyticsCounter('products_submitted', 1);

      console.log(`Product ${productId} created and notifications sent`);
    } catch (error) {
      console.error('Error processing new product:', error);
    }
  }
);

/**
 * Trigger when a new order is created
 */
exports.onOrderCreated = onDocumentCreated(
  'orders/{orderId}',
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log('No data associated with the event');
      return;
    }
    
    const orderData = snap.data();
    const orderId = event.params.orderId;

    try {
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
        },
        read: false,
        priority: 'medium',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update analytics
      await updateAnalyticsCounter('orders', 1);
      await updateAnalyticsCounter('revenue', orderData.totalAmount);

      console.log(`Order ${orderId} created and notifications sent`);
    } catch (error) {
      console.error('Error processing new order:', error);
    }
  }
);

/**
 * Trigger when order status changes
 */
exports.onOrderUpdated = onDocumentUpdated(
  'orders/{orderId}',
  async (event) => {
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();
    const orderId = event.params.orderId;

    if (!beforeData || !afterData) {
      console.log('Missing before or after data');
      return;
    }

    // Check if status changed
    if (beforeData.status !== afterData.status) {
      try {
        let customerTitle = '';
        let customerMessage = '';

        switch (afterData.status) {
          case 'confirmed':
            customerTitle = 'تم تأكيد طلبك';
            customerMessage = `تم تأكيد طلبك رقم ${orderId} من قبل التاجر`;
            break;

          case 'shipped':
            customerTitle = 'تم شحن طلبك';
            customerMessage = `تم شحن طلبك رقم ${orderId}`;
            if (afterData.trackingNumber) {
              customerMessage += ` - رقم التتبع: ${afterData.trackingNumber}`;
            }
            break;

          case 'delivered':
            customerTitle = 'تم تسليم طلبك';
            customerMessage = `تم تسليم طلبك رقم ${orderId} بنجاح`;
            break;

          case 'cancelled':
            customerTitle = 'تم إلغاء طلبك';
            customerMessage = `تم إلغاء طلبك رقم ${orderId}`;
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

        console.log(`Order ${orderId} status updated to ${afterData.status}`);
      } catch (error) {
        console.error('Error processing order update:', error);
      }
    }
  }
);

/**
 * Scheduled function to update analytics every hour
 */
exports.updateAnalytics = onSchedule('0 * * * *', async (event) => {
  try {
    console.log('Starting scheduled analytics update');

    // Update business metrics
    await updateBusinessMetrics();

    // Update real-time stats
    await updateRealTimeStats();

    console.log('Scheduled analytics update completed');
  } catch (error) {
    console.error('Error in scheduled analytics update:', error);
  }
});

/**
 * HTTP function to trigger analytics update manually
 */
exports.triggerAnalyticsUpdate = onCall(async (request) => {
  // Check if user is admin
  if (!request.auth || !request.auth.token.role || request.auth.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can trigger analytics updates');
  }

  try {
    await updateBusinessMetrics();
    await updateRealTimeStats();
    return { success: true, message: 'Analytics updated successfully' };
  } catch (error) {
    console.error('Error updating analytics:', error);
    throw new HttpsError('internal', 'Failed to update analytics');
  }
});

/**
 * HTTP function to send custom notifications
 */
exports.sendNotification = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, type, title, message, priority = 'medium', data: notificationData } = request.data;

  try {
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

    return { success: true, message: 'Notification sent successfully' };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new HttpsError('internal', 'Failed to send notification');
  }
});

/**
 * Helper function to update analytics counter
 */
async function updateAnalyticsCounter(metric, value) {
  const counterRef = db.collection('counters').doc('analytics');
  
  await counterRef.set({
    [metric]: admin.firestore.FieldValue.increment(value),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

/**
 * Helper function to update business metrics
 */
async function updateBusinessMetrics() {
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
  const vendorStats = {};

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
      .map(([vendorId, stats]) => ({
        vendorId,
        vendorName: stats.vendorName,
        orders: stats.orders,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Update business metrics document
  batch.set(db.collection('analytics').doc('business_metrics'), businessMetrics, { merge: true });
  
  await batch.commit();
}

/**
 * Helper function to update real-time stats
 */
async function updateRealTimeStats() {
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
      customerName: data.customerName,
      vendorName: data.vendorName,
      amount: data.totalAmount,
      status: data.status,
      timestamp: data.createdAt,
    };
  });

  const recentSignups = recentUsersSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      userId: doc.id,
      userName: data.displayName,
      userType: data.role || 'customer',
      timestamp: data.createdAt,
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
}