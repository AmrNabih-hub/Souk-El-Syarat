import { signInWithEmailAndPassword, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase.config';

import { ADMIN_ACCOUNTS } from '@/data/test-accounts';

// Admin Credentials from test accounts
const ADMIN_CREDENTIALS = ADMIN_ACCOUNTS.map(account => ({
  email: account.email,
  password: account.password,
  displayName: account.displayName,
  permissions: account.permissions || []
}));

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'admin';
  permissions: string[];
  createdAt: Date;
  lastLogin: Date;
  isActive: boolean;
}

export class AdminAuthService {
  
  // Initialize admin account in Firebase
  static async initializeAdminAccount(): Promise<void> {
    try {
      const adminDocRef = doc(db, 'users', 'admin-main');
      const adminDoc = await getDoc(adminDocRef);

      if (!adminDoc.exists()) {
        const mainAdmin = ADMIN_CREDENTIALS[0]; // Use first admin as main
        const adminData: Omit<AdminUser, 'id'> = {
          email: mainAdmin.email,
          displayName: mainAdmin.displayName,
          role: 'admin',
          permissions: mainAdmin.permissions,
          createdAt: new Date(),
          lastLogin: new Date(),
          isActive: true
        };

        await setDoc(adminDocRef, adminData);
        console.log('Admin account initialized in Firestore');
      }
    } catch (error) {
      console.error('Error initializing admin account:', error);
    }
  }

  // Authenticate admin login
  static async authenticateAdmin(email: string, password: string): Promise<AdminUser | null> {
    try {
      // Check if credentials match any of the admin credentials
      const isAdminCredentials = ADMIN_CREDENTIALS.some(cred => 
        cred.email === email && cred.password === password
      );
      
      if (isAdminCredentials) {
        
        // Initialize admin account if not exists
        await this.initializeAdminAccount();

        // Get admin data from Firestore
        const adminDocRef = doc(db, 'users', 'admin-main');
        const adminDoc = await getDoc(adminDocRef);

        if (adminDoc.exists()) {
          const adminData = adminDoc.data();
          
          // Update last login
          await setDoc(adminDocRef, {
            ...adminData,
            lastLogin: new Date()
          }, { merge: true });

          return {
            id: 'admin-main',
            email: adminData.email,
            displayName: adminData.displayName,
            role: 'admin',
            permissions: adminData.permissions,
            createdAt: adminData.createdAt?.toDate() || new Date(),
            lastLogin: new Date(),
            isActive: adminData.isActive
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Admin authentication error:', error);
      return null;
    }
  }

  // Verify admin permissions
  static verifyAdminPermission(user: AdminUser | null, permission: string): boolean {
    if (!user || user.role !== 'admin') return false;
    return user.permissions.includes(permission) || user.permissions.includes('*');
  }

  // Get admin dashboard data
  static async getAdminDashboardData() {
    return {
      totalUsers: 12580,
      totalVendors: 450,
      pendingApplications: 23,
      monthlyRevenue: 2850000,
      activeListings: 8750,
      completedSales: 1250,
      averageRating: 4.7,
      systemHealth: 'excellent',
      recentActivities: [
        { type: 'vendor_application', message: 'طلب تاجر جديد من معرض الأمان', time: '5 دقائق' },
        { type: 'sale_completed', message: 'تم إتمام بيع تويوتا كامري 2021', time: '15 دقيقة' },
        { type: 'user_signup', message: 'تسجيل عضو جديد - أحمد محمد', time: '30 دقيقة' },
        { type: 'service_booking', message: 'حجز خدمة غسيل VIP', time: '45 دقيقة' }
      ],
      topVendors: [
        { name: 'معرض الفخامة للسيارات', sales: 156, revenue: '4,250,000 جنيه' },
        { name: 'شركة الأمان للسيارات', sales: 142, revenue: '3,890,000 جنيه' },
        { name: 'مجموعة النصر موتورز', sales: 128, revenue: '3,560,000 جنيه' }
      ],
      monthlyStats: {
        newUsers: 1245,
        newVendors: 89,
        totalSales: 456,
        revenue: 2850000,
        serviceBookings: 890
      }
    };
  }

  // Admin logout
  static async adminLogout(): Promise<void> {
    try {
      // Update last activity in Firestore
      const adminDocRef = doc(db, 'users', 'admin-main');
      await setDoc(adminDocRef, {
        lastActivity: new Date()
      }, { merge: true });
      
      console.log('Admin logged out successfully');
    } catch (error) {
      console.error('Admin logout error:', error);
    }
  }
}

// Initialize admin account on service load
AdminAuthService.initializeAdminAccount();