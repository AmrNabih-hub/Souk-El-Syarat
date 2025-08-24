import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  AdminStats,
  VendorApplication,
  Vendor,
  AdminAnalytics,
  VendorApprovalData,
  SystemLog,
  PlatformMetrics,
} from '@/types';
import { firebaseFunctionsService } from './firebase-functions.service';
import { notificationService } from './notification.service';

export class AdminService {
  private static COLLECTIONS = {
    USERS: 'users',
    VENDORS: 'vendors',
    VENDOR_APPLICATIONS: 'vendor_applications',
    PRODUCTS: 'products',
    ORDERS: 'orders',
    SYSTEM_LOGS: 'system_logs',
    PLATFORM_METRICS: 'platform_metrics',
  };

  /**
   * Get comprehensive admin statistics in real-time
   */
  static async getAdminStats(): Promise<AdminStats> {
    try {
      const [
        usersSnapshot,
        vendorsSnapshot,
        productsSnapshot,
        ordersSnapshot,
        applicationsSnapshot,
        metricsSnapshot,
      ] = await Promise.all([
        getDocs(collection(db, this.COLLECTIONS.USERS)),
        getDocs(collection(db, this.COLLECTIONS.VENDORS)),
        getDocs(collection(db, this.COLLECTIONS.PRODUCTS)),
        getDocs(collection(db, this.COLLECTIONS.ORDERS)),
        getDocs(
          query(
            collection(db, this.COLLECTIONS.VENDOR_APPLICATIONS),
            where('status', '==', 'pending')
          )
        ),
        getDocs(collection(db, this.COLLECTIONS.PLATFORM_METRICS)),
      ]);

      // Calculate real-time metrics
      const totalUsers = usersSnapshot.size;
      const totalVendors = vendorsSnapshot.size;
      const totalProducts = productsSnapshot.size;
      const totalOrders = ordersSnapshot.size;
      const pendingApplications = applicationsSnapshot.size;

      // Calculate monthly revenue from orders
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyOrders = ordersSnapshot.docs.filter(doc => {
        const orderData = doc.data();
        const orderDate = orderData.createdAt?.toDate() || new Date();
        return (
          orderDate.getMonth() === currentMonth &&
          orderDate.getFullYear() === currentYear &&
          orderData.status === 'completed'
        );
      });

      const monthlyRevenue = monthlyOrders.reduce((total, orderDoc) => {
        const orderData = orderDoc.data();
        return total + (orderData.totalAmount || 0);
      }, 0);

      // Get platform health metrics
      const latestMetrics = (metricsSnapshot.docs[0]?.data() as PlatformMetrics) || {
        uptime: 99.9,
        responseTime: 150,
        errorRate: 0.1,
        activeConnections: 0,
        totalRequests: 0,
      };

      return {
        totalUsers,
        totalVendors,
        totalProducts,
        totalOrders,
        pendingApplications,
        monthlyRevenue,
        activeUsers: Math.floor(totalUsers * 0.8), // Estimate active users
        newSignups: Math.floor(totalUsers * 0.1), // Estimate new signups
        platformHealth: {
          uptime: latestMetrics.uptime,
          responseTime: latestMetrics.responseTime,
          errorRate: latestMetrics.errorRate,
        },
        realTimeMetrics: {
          activeConnections: latestMetrics.activeConnections,
          totalRequests: latestMetrics.totalRequests,
          lastUpdated: new Date(),
        },
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error fetching admin stats:', error);
      throw new Error('Failed to fetch admin statistics');
    }
  }

  /**
   * Subscribe to real-time analytics updates
   */
  static subscribeToAnalytics(callback: (analytics: AdminAnalytics) => void): () => void {
    const analyticsQuery = query(
      collection(db, this.COLLECTIONS.PLATFORM_METRICS),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    return onSnapshot(analyticsQuery, snapshot => {
      if (!snapshot.empty) {
        const analyticsData = snapshot.docs[0].data() as AdminAnalytics;
        callback(analyticsData);
      }
    });
  }

  /**
   * Subscribe to vendor applications in real-time
   */
  static subscribeToApplications(
    status: 'all' | 'pending' | 'approved' | 'rejected',
    callback: (applications: VendorApplication[]) => void
  ): () => void {
    let applicationsQuery;

    if (status === 'all') {
      applicationsQuery = query(
        collection(db, this.COLLECTIONS.VENDOR_APPLICATIONS),
        orderBy('appliedDate', 'desc')
      );
    } else {
      applicationsQuery = query(
        collection(db, this.COLLECTIONS.VENDOR_APPLICATIONS),
        where('status', '==', status),
        orderBy('appliedDate', 'desc')
      );
    }

    return onSnapshot(applicationsQuery, snapshot => {
      const applications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as VendorApplication[];

      callback(applications);
    });
  }

  /**
   * Subscribe to vendors in real-time
   */
  static subscribeToVendors(
    status: 'all' | 'active' | 'inactive' | 'suspended',
    callback: (vendors: Vendor[]) => void
  ): () => void {
    let vendorsQuery;

    if (status === 'all') {
      vendorsQuery = query(collection(db, this.COLLECTIONS.VENDORS), orderBy('joinedDate', 'desc'));
    } else {
      vendorsQuery = query(
        collection(db, this.COLLECTIONS.VENDORS),
        where('status', '==', status),
        orderBy('joinedDate', 'desc')
      );
    }

    return onSnapshot(vendorsQuery, snapshot => {
      const vendors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Vendor[];

      callback(vendors);
    });
  }

  /**
   * Process vendor application with real-time updates
   */
  static async processVendorApplication(
    applicationId: string,
    adminId: string,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<void> {
    const batch = writeBatch(db);

    try {
      // Update application status
      const applicationRef = doc(db, this.COLLECTIONS.VENDOR_APPLICATIONS, applicationId);
      const applicationDoc = await getDoc(applicationRef);

      if (!applicationDoc.exists()) {
        throw new Error('Application not found');
      }

      const applicationData = applicationDoc.data() as VendorApplication;

      batch.update(applicationRef, {
        status,
        reviewedBy: adminId,
        reviewedAt: serverTimestamp(),
        adminNotes: notes,
        lastUpdated: serverTimestamp(),
      });

      // If approved, create vendor profile
      if (status === 'approved') {
        const vendorRef = doc(db, this.COLLECTIONS.VENDORS, applicationData.userId);

        batch.set(vendorRef, {
          id: applicationData.userId,
          businessName: applicationData.businessName,
          businessType: applicationData.businessType,
          description: applicationData.description,
          contactPerson: applicationData.contactPerson,
          email: applicationData.email,
          phoneNumber: applicationData.phoneNumber,
          whatsappNumber: applicationData.whatsappNumber,
          address: applicationData.address,
          businessLicense: applicationData.businessLicense,
          taxId: applicationData.taxId,
          website: applicationData.website,
          socialMedia: applicationData.socialMedia,
          experience: applicationData.experience,
          specializations: applicationData.specializations,
          expectedMonthlyVolume: applicationData.expectedMonthlyVolume,
          documents: applicationData.documents,
          status: 'active',
          rating: 0,
          totalProducts: 0,
          totalSales: 0,
          joinedDate: serverTimestamp(),
          approvedBy: adminId,
          approvedAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        });

        // Update user role to vendor
        const userRef = doc(db, this.COLLECTIONS.USERS, applicationData.userId);
        batch.update(userRef, {
          role: 'vendor',
          vendorId: applicationData.userId,
          lastUpdated: serverTimestamp(),
        });
      }

      // Log the action
      const logRef = doc(collection(db, this.COLLECTIONS.SYSTEM_LOGS));
      batch.set(logRef, {
        id: logRef.id,
        action: `vendor_application_${status}`,
        adminId,
        targetId: applicationId,
        details: {
          businessName: applicationData.businessName,
          status,
          notes,
        },
        timestamp: serverTimestamp(),
      });

      // Commit all changes
      await batch.commit();

      // Send notifications
      if (status === 'approved') {
        await notificationService.sendVendorApprovalNotification(
          {
            id: applicationData.userId,
            userId: applicationData.userId,
            businessName: applicationData.businessName,
            email: applicationData.email,
            contactPerson: applicationData.contactPerson || '',
            businessType: applicationData.businessType || 'dealership',
            description: applicationData.description || '',
            phoneNumber: applicationData.phoneNumber || '',
            address: applicationData.address || {
              street: '',
              city: '',
              governorate: '',
              country: 'Egypt',
            },
            businessLicense: applicationData.businessLicense || '',
            experience: applicationData.experience || '',
            specializations: applicationData.specializations || [],
            expectedMonthlyVolume: applicationData.expectedMonthlyVolume || '',
            status: 'approved',
            rating: 0,
            totalReviews: 0,
            totalSales: 0,
            totalProducts: 0,
            joinedDate: new Date(),
            lastActive: new Date(),
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Vendor,
          'approved',
          notes
        );
      }

      // Update platform metrics
      await this.updatePlatformMetrics('vendor_application_processed', {
        applicationId,
        status,
        adminId,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error processing vendor application:', error);
      throw new Error(
        `Failed to process vendor application: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Toggle vendor status with real-time updates
   */
  static async toggleVendorStatus(
    vendorId: string,
    adminId: string,
    newStatus: 'active' | 'inactive' | 'suspended',
    reason?: string
  ): Promise<void> {
    try {
      const vendorRef = doc(db, this.COLLECTIONS.VENDORS, vendorId);
      const vendorDoc = await getDoc(vendorRef);

      if (!vendorDoc.exists()) {
        throw new Error('Vendor not found');
      }

      const vendorData = vendorDoc.data() as Vendor;
      const previousStatus = vendorData.status;

      // Update vendor status
      await updateDoc(vendorRef, {
        status: newStatus,
        statusChangedBy: adminId,
        statusChangedAt: serverTimestamp(),
        statusChangeReason: reason,
        lastUpdated: serverTimestamp(),
      });

      // Log the action
      const logRef = doc(collection(db, this.COLLECTIONS.SYSTEM_LOGS));
      await updateDoc(logRef, {
        id: logRef.id,
        action: 'vendor_status_changed',
        adminId,
        targetId: vendorId,
        details: {
          businessName: vendorData.businessName,
          previousStatus,
          newStatus,
          reason,
        },
        timestamp: serverTimestamp(),
      });

      // Send notification to vendor
      await notificationService.sendSystemNotification({
        userId: vendorId,
        title: 'Vendor Status Updated',
        message: `Your vendor status has been changed to ${newStatus}. ${reason ? `Reason: ${reason}` : ''}`,
        type: 'system_announcement',
      });

      // Update platform metrics
      await this.updatePlatformMetrics('vendor_status_changed', {
        vendorId,
        previousStatus,
        newStatus,
        adminId,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error toggling vendor status:', error);
      throw new Error(
        `Failed to toggle vendor status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get system logs in real-time
   */
  static subscribeToSystemLogs(
    limitCount: number = 100,
    callback: (logs: SystemLog[]) => void
  ): () => void {
    const logsQuery = query(
      collection(db, this.COLLECTIONS.SYSTEM_LOGS),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(logsQuery, snapshot => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as SystemLog[];

      callback(logs);
    });
  }

  /**
   * Update platform metrics in real-time
   */
  private static async updatePlatformMetrics(action: string, data: unknown): Promise<void> {
    try {
      const metricsRef = doc(collection(db, this.COLLECTIONS.PLATFORM_METRICS));

      await updateDoc(metricsRef, {
        lastAction: action,
        lastActionData: data,
        lastUpdated: serverTimestamp(),
        totalActions: (data.totalActions || 0) + 1,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error updating platform metrics:', error);
    }
  }

  /**
   * Get real-time platform performance metrics
   */
  static async getPlatformPerformance(): Promise<{
    uptime: number;
    responseTime: number;
    errorRate: number;
    activeConnections: number;
    totalRequests: number;
    lastUpdated: Date;
  }> {
    try {
      const metricsSnapshot = await getDocs(
        query(
          collection(db, this.COLLECTIONS.PLATFORM_METRICS),
          orderBy('timestamp', 'desc'),
          limit(1)
        )
      );

      if (metricsSnapshot.empty) {
        return {
          uptime: 99.9,
          responseTime: 150,
          errorRate: 0.1,
          activeConnections: 0,
          totalRequests: 0,
          lastUpdated: new Date(),
        };
      }

      const metricsData = metricsSnapshot.docs[0].data();
      return {
        uptime: metricsData.uptime || 99.9,
        responseTime: metricsData.responseTime || 150,
        errorRate: metricsData.errorRate || 0.1,
        activeConnections: metricsData.activeConnections || 0,
        totalRequests: metricsData.totalRequests || 0,
        lastUpdated: metricsData.timestamp?.toDate() || new Date(),
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error fetching platform performance:', error);
      return {
        uptime: 99.9,
        responseTime: 150,
        errorRate: 0.1,
        activeConnections: 0,
        totalRequests: 0,
        lastUpdated: new Date(),
      };
    }
  }
}
