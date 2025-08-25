import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/config/firebase.config';

export interface VendorApplication {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  governorate: string;
  businessType: 'dealership' | 'service_center' | 'parts_store' | 'other';
  experience: string;
  description: string;
  licenseNumber: string;
  taxNumber: string;
  documents: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  estimatedMonthlyRevenue: number;
  specialties: string[];
}

export interface VendorUser {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role: 'vendor';
  isActive: boolean;
  createdAt: Date;
  applicationId: string;
  vendorProfile: {
    businessName: string;
    businessType: string;
    location: string;
    phone: string;
    specialties: string[];
    rating: number;
    totalSales: number;
    joinDate: Date;
  };
}

export class VendorManagementService {
  
  // Submit vendor application
  static async submitVendorApplication(applicationData: Omit<VendorApplication, 'id' | 'status' | 'submittedAt'>): Promise<string> {
    try {
      const applicationId = `vendor-app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const application: VendorApplication = {
        id: applicationId,
        ...applicationData,
        status: 'pending',
        submittedAt: new Date()
      };

      await setDoc(doc(db, 'vendor_applications', applicationId), {
        ...application,
        submittedAt: serverTimestamp()
      });

      console.log('Vendor application submitted:', applicationId);
      return applicationId;
    } catch (error) {
      console.error('Error submitting vendor application:', error);
      throw new Error('فشل في إرسال طلب التسجيل');
    }
  }

  // Get all pending vendor applications for admin
  static async getPendingApplications(): Promise<VendorApplication[]> {
    try {
      const q = query(
        collection(db, 'vendor_applications'),
        where('status', '==', 'pending'),
        orderBy('submittedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const applications: VendorApplication[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        applications.push({
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date()
        } as VendorApplication);
      });

      return applications;
    } catch (error) {
      console.error('Error fetching pending applications:', error);
      return [];
    }
  }

  // Approve vendor application and create vendor account
  static async approveVendorApplication(
    applicationId: string, 
    adminId: string, 
    notes?: string
  ): Promise<VendorUser> {
    try {
      // Get the application
      const appDoc = await getDoc(doc(db, 'vendor_applications', applicationId));
      if (!appDoc.exists()) {
        throw new Error('Application not found');
      }

      const appData = appDoc.data() as VendorApplication;

      // Update application status
      await updateDoc(doc(db, 'vendor_applications', applicationId), {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: adminId,
        reviewNotes: notes || 'تم الموافقة على الطلب'
      });

      // Create vendor user account
      const vendorId = `vendor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const temporaryPassword = `Vendor${Date.now()}!`;

      const vendorUser: VendorUser = {
        id: vendorId,
        email: appData.email,
        password: temporaryPassword, // In real app, hash this
        displayName: appData.ownerName,
        role: 'vendor',
        isActive: true,
        createdAt: new Date(),
        applicationId: applicationId,
        vendorProfile: {
          businessName: appData.businessName,
          businessType: appData.businessType,
          location: `${appData.address}, ${appData.governorate}`,
          phone: appData.phone,
          specialties: appData.specialties || [],
          rating: 0,
          totalSales: 0,
          joinDate: new Date()
        }
      };

      // Save vendor user to Firestore
      await setDoc(doc(db, 'users', vendorId), {
        ...vendorUser,
        createdAt: serverTimestamp()
      });

      // Save vendor profile separately for easier queries
      await setDoc(doc(db, 'vendors', vendorId), {
        ...vendorUser.vendorProfile,
        userId: vendorId,
        email: vendorUser.email,
        status: 'active',
        joinDate: serverTimestamp()
      });

      console.log('Vendor approved and account created:', vendorId);
      return vendorUser;
    } catch (error) {
      console.error('Error approving vendor application:', error);
      throw new Error('فشل في الموافقة على طلب التاجر');
    }
  }

  // Reject vendor application
  static async rejectVendorApplication(
    applicationId: string, 
    adminId: string, 
    reason: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'vendor_applications', applicationId), {
        status: 'rejected',
        reviewedAt: serverTimestamp(),
        reviewedBy: adminId,
        reviewNotes: reason
      });

      console.log('Vendor application rejected:', applicationId);
    } catch (error) {
      console.error('Error rejecting vendor application:', error);
      throw new Error('فشل في رفض طلب التاجر');
    }
  }

  // Get all vendors for admin management
  static async getAllVendors(): Promise<VendorUser[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'vendor'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const vendors: VendorUser[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        vendors.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as VendorUser);
      });

      return vendors;
    } catch (error) {
      console.error('Error fetching vendors:', error);
      return [];
    }
  }

  // Activate/Deactivate vendor
  static async toggleVendorStatus(vendorId: string, isActive: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', vendorId), {
        isActive: isActive
      });

      await updateDoc(doc(db, 'vendors', vendorId), {
        status: isActive ? 'active' : 'suspended'
      });

      console.log(`Vendor ${vendorId} status updated to: ${isActive ? 'active' : 'suspended'}`);
    } catch (error) {
      console.error('Error updating vendor status:', error);
      throw new Error('فشل في تحديث حالة التاجر');
    }
  }

  // Authenticate vendor login
  static async authenticateVendor(email: string, password: string): Promise<VendorUser | null> {
    try {
      const q = query(
        collection(db, 'users'),
        where('email', '==', email),
        where('role', '==', 'vendor'),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const vendorDoc = querySnapshot.docs[0];
      const vendorData = vendorDoc.data() as VendorUser;

      // In a real app, you would hash and compare passwords properly
      if (vendorData.password === password) {
        return {
          ...vendorData,
          id: vendorDoc.id,
          createdAt: vendorData.createdAt?.toDate() || new Date()
        };
      }

      return null;
    } catch (error) {
      console.error('Error authenticating vendor:', error);
      return null;
    }
  }

  // Get vendor statistics for admin dashboard
  static async getVendorStatistics() {
    try {
      const [applicationsSnapshot, vendorsSnapshot] = await Promise.all([
        getDocs(collection(db, 'vendor_applications')),
        getDocs(query(collection(db, 'users'), where('role', '==', 'vendor')))
      ]);

      const pendingApplications = applicationsSnapshot.docs.filter(
        doc => doc.data().status === 'pending'
      ).length;

      const activeVendors = vendorsSnapshot.docs.filter(
        doc => doc.data().isActive === true
      ).length;

      const totalVendors = vendorsSnapshot.size;
      const totalApplications = applicationsSnapshot.size;

      return {
        totalApplications,
        pendingApplications,
        totalVendors,
        activeVendors,
        approvedApplications: totalApplications - pendingApplications
      };
    } catch (error) {
      console.error('Error fetching vendor statistics:', error);
      return {
        totalApplications: 0,
        pendingApplications: 0,
        totalVendors: 0,
        activeVendors: 0,
        approvedApplications: 0
      };
    }
  }
}

// Mock vendor applications for demo
export const createMockVendorApplications = async () => {
  const mockApplications: Omit<VendorApplication, 'id' | 'status' | 'submittedAt'>[] = [
    {
      businessName: 'معرض الأمان للسيارات الفاخرة',
      ownerName: 'أحمد محمد علي',
      email: 'ahmed@alamancar.com',
      phone: '01012345678',
      address: 'شارع الهرم، الجيزة',
      governorate: 'الجيزة',
      businessType: 'dealership',
      experience: '15 سنة',
      description: 'معرض متخصص في السيارات الفاخرة والمستعملة مع خبرة 15 سنة في السوق المصري',
      licenseNumber: 'LIC-123456',
      taxNumber: 'TAX-789012',
      documents: ['business-license.pdf', 'tax-card.pdf'],
      estimatedMonthlyRevenue: 450000,
      specialties: ['سيارات فاخرة', 'سيارات مستعملة', 'تمويل']
    },
    {
      businessName: 'مركز خدمة السيارات المتطور',
      ownerName: 'محمود حسن الشافعي',
      email: 'mahmoud@carservice.com',
      phone: '01098765432',
      address: 'مدينة نصر، القاهرة',
      governorate: 'القاهرة',
      businessType: 'service_center',
      experience: '8 سنوات',
      description: 'مركز متخصص في صيانة وإصلاح جميع أنواع السيارات',
      licenseNumber: 'LIC-654321',
      taxNumber: 'TAX-210987',
      documents: ['business-license.pdf', 'technical-certificate.pdf'],
      estimatedMonthlyRevenue: 180000,
      specialties: ['صيانة عامة', 'إصلاح محركات', 'فحص دوري']
    },
    {
      businessName: 'شركة قطع الغيار الأصلية',
      ownerName: 'فاطمة أحمد عبدالله',
      email: 'fatma@parts-egypt.com',
      phone: '01155443322',
      address: 'الإسكندرية',
      governorate: 'الإسكندرية',
      businessType: 'parts_store',
      experience: '12 سنة',
      description: 'شركة متخصصة في توريد قطع الغيار الأصلية لجميع أنواع السيارات',
      licenseNumber: 'LIC-111222',
      taxNumber: 'TAX-333444',
      documents: ['business-license.pdf', 'supplier-agreements.pdf'],
      estimatedMonthlyRevenue: 320000,
      specialties: ['قطع غيار أصلية', 'إطارات', 'بطاريات']
    }
  ];

  try {
    for (const app of mockApplications) {
      await VendorManagementService.submitVendorApplication(app);
    }
    console.log('Mock vendor applications created');
  } catch (error) {
    console.error('Error creating mock applications:', error);
  }
};