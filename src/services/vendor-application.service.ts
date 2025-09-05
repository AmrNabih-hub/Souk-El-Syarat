/**
 * Vendor Application Service
 * Complete vendor application workflow with real-time status updates
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { 
  ref, 
  push, 
  set, 
  update, 
  get, 
  onValue, 
  off 
} from 'firebase/database';
import { db, realtimeDb } from '@/config/firebase.config';
import EmailService from './email.service';

export interface VendorApplication {
  id: string;
  userId: string;
  userEmail: string;
  businessName: string;
  businessType: 'individual' | 'company';
  businessRegistrationNumber?: string;
  taxId?: string;
  businessAddress: {
    street: string;
    city: string;
    governorate: string;
    postalCode: string;
    country: string;
  };
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
  businessDescription: string;
  categories: string[];
  documents: {
    businessLicense?: string;
    taxCertificate?: string;
    bankStatement?: string;
    identityDocument?: string;
  };
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  submittedAt: Date;
  updatedAt: Date;
  rejectionReason?: string;
  requirements: {
    hasBusinessLicense: boolean;
    hasTaxCertificate: boolean;
    hasBankAccount: boolean;
    hasValidDocuments: boolean;
  };
  complianceScore: number; // 0-100
}

export interface VendorApplicationReview {
  id: string;
  applicationId: string;
  reviewerId: string;
  reviewerName: string;
  status: 'approved' | 'rejected';
  reviewNotes: string;
  requirements: {
    businessLicense: boolean;
    taxCertificate: boolean;
    bankAccount: boolean;
    identityVerification: boolean;
    businessVerification: boolean;
  };
  complianceScore: number;
  reviewedAt: Date;
  nextReviewDate?: Date;
}

export interface VendorApplicationStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  underReviewApplications: number;
  averageReviewTime: number; // in hours
  approvalRate: number; // percentage
}

export class VendorApplicationService {
  private static instance: VendorApplicationService;
  private realTimeSubscriptions: Map<string, () => void> = new Map();

  static getInstance(): VendorApplicationService {
    if (!VendorApplicationService.instance) {
      VendorApplicationService.instance = new VendorApplicationService();
    }
    return VendorApplicationService.instance;
  }

  /**
   * Submit vendor application
   */
  async submitVendorApplication(
    userId: string,
    applicationData: Omit<VendorApplication, 'id' | 'userId' | 'submittedAt' | 'updatedAt' | 'status' | 'complianceScore'>
  ): Promise<string> {
    try {
      // Calculate compliance score
      const complianceScore = this.calculateComplianceScore(applicationData);

      const application: VendorApplication = {
        id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        ...applicationData,
        status: 'pending',
        submittedAt: new Date(),
        updatedAt: new Date(),
        complianceScore
      };

      // Store in Firestore
      const docRef = await addDoc(collection(db, 'vendorApplications'), {
        ...application,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Store in Realtime Database for real-time updates
      const realTimeRef = ref(realtimeDb, `vendorApplications/${docRef.id}`);
      await set(realTimeRef, application);

      // Send notification to admin
      await this.notifyAdminNewApplication(docRef.id, application);

      // Send confirmation email to vendor
      await EmailService.sendVendorApplicationConfirmation(
        application.userEmail,
        application.businessName,
        docRef.id
      );

      // Track analytics
      await this.trackApplicationEvent('application_submitted', {
        applicationId: docRef.id,
        userId,
        businessName: application.businessName,
        complianceScore
      });

      console.log(`✅ Vendor application submitted: ${docRef.id}`);
      return docRef.id;

    } catch (error) {
      console.error('Error submitting vendor application:', error);
      throw error;
    }
  }

  /**
   * Get vendor application by ID
   */
  async getVendorApplication(applicationId: string): Promise<VendorApplication | null> {
    try {
      const docRef = doc(db, 'vendorApplications', applicationId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate()
        } as VendorApplication;
      }

      return null;
    } catch (error) {
      console.error('Error getting vendor application:', error);
      throw error;
    }
  }

  /**
   * Get applications by user ID
   */
  async getUserVendorApplications(userId: string): Promise<VendorApplication[]> {
    try {
      const q = query(
        collection(db, 'vendorApplications'),
        where('userId', '==', userId),
        orderBy('submittedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        reviewedAt: doc.data().reviewedAt?.toDate()
      })) as VendorApplication[];
    } catch (error) {
      console.error('Error getting user vendor applications:', error);
      throw error;
    }
  }

  /**
   * Get all pending applications (for admin)
   */
  async getPendingApplications(): Promise<VendorApplication[]> {
    try {
      const q = query(
        collection(db, 'vendorApplications'),
        where('status', '==', 'pending'),
        orderBy('submittedAt', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        reviewedAt: doc.data().reviewedAt?.toDate()
      })) as VendorApplication[];
    } catch (error) {
      console.error('Error getting pending applications:', error);
      throw error;
    }
  }

  /**
   * Review vendor application (admin only)
   */
  async reviewVendorApplication(
    applicationId: string,
    reviewerId: string,
    reviewerName: string,
    review: VendorApplicationReview
  ): Promise<void> {
    try {
      const application = await this.getVendorApplication(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Update application status
      const updateData = {
        status: review.status,
        reviewNotes: review.reviewNotes,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
        rejectionReason: review.status === 'rejected' ? review.reviewNotes : undefined
      };

      // Update in Firestore
      const docRef = doc(db, 'vendorApplications', applicationId);
      await updateDoc(docRef, {
        ...updateData,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update in Realtime Database
      const realTimeRef = ref(realtimeDb, `vendorApplications/${applicationId}`);
      await update(realTimeRef, {
        ...updateData,
        reviewedAt: updateData.reviewedAt.toISOString(),
        updatedAt: updateData.updatedAt.toISOString()
      });

      // Update user role if approved
      if (review.status === 'approved') {
        await this.updateUserToVendor(application.userId, application);
      }

      // Send notification to vendor
      await this.notifyVendorApplicationStatus(application, review);

      // Store review record
      await this.storeApplicationReview(applicationId, review);

      // Track analytics
      await this.trackApplicationEvent('application_reviewed', {
        applicationId,
        reviewerId,
        status: review.status,
        complianceScore: review.complianceScore
      });

      console.log(`✅ Vendor application reviewed: ${applicationId} - ${review.status}`);

    } catch (error) {
      console.error('Error reviewing vendor application:', error);
      throw error;
    }
  }

  /**
   * Subscribe to application status updates
   */
  subscribeToApplicationStatus(
    applicationId: string,
    callback: (application: VendorApplication) => void
  ): () => void {
    const realTimeRef = ref(realtimeDb, `vendorApplications/${applicationId}`);
    
    const unsubscribe = onValue(realTimeRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const application: VendorApplication = {
          ...data,
          submittedAt: new Date(data.submittedAt),
          updatedAt: new Date(data.updatedAt),
          reviewedAt: data.reviewedAt ? new Date(data.reviewedAt) : undefined
        };
        callback(application);
      }
    });

    this.realTimeSubscriptions.set(applicationId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to all pending applications (for admin)
   */
  subscribeToPendingApplications(
    callback: (applications: VendorApplication[]) => void
  ): () => void {
    const realTimeRef = ref(realtimeDb, 'vendorApplications');
    
    const unsubscribe = onValue(realTimeRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const applications: VendorApplication[] = Object.values(data)
          .filter((app: any) => app.status === 'pending')
          .map((app: any) => ({
            ...app,
            submittedAt: new Date(app.submittedAt),
            updatedAt: new Date(app.updatedAt),
            reviewedAt: app.reviewedAt ? new Date(app.reviewedAt) : undefined
          }));
        callback(applications);
      }
    });

    this.realTimeSubscriptions.set('pendingApplications', unsubscribe);
    return unsubscribe;
  }

  /**
   * Get vendor application statistics
   */
  async getVendorApplicationStats(): Promise<VendorApplicationStats> {
    try {
      const snapshot = await getDocs(collection(db, 'vendorApplications'));
      const applications = snapshot.docs.map(doc => doc.data() as VendorApplication);

      const stats: VendorApplicationStats = {
        totalApplications: applications.length,
        pendingApplications: applications.filter(app => app.status === 'pending').length,
        approvedApplications: applications.filter(app => app.status === 'approved').length,
        rejectedApplications: applications.filter(app => app.status === 'rejected').length,
        underReviewApplications: applications.filter(app => app.status === 'under_review').length,
        averageReviewTime: this.calculateAverageReviewTime(applications),
        approvalRate: this.calculateApprovalRate(applications)
      };

      return stats;
    } catch (error) {
      console.error('Error getting vendor application stats:', error);
      throw error;
    }
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    applicationId: string,
    status: VendorApplication['status'],
    notes?: string
  ): Promise<void> {
    try {
      const updateData = {
        status,
        reviewNotes: notes,
        updatedAt: new Date()
      };

      // Update in Firestore
      const docRef = doc(db, 'vendorApplications', applicationId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });

      // Update in Realtime Database
      const realTimeRef = ref(realtimeDb, `vendorApplications/${applicationId}`);
      await update(realTimeRef, {
        ...updateData,
        updatedAt: updateData.updatedAt.toISOString()
      });

      console.log(`✅ Application status updated: ${applicationId} - ${status}`);

    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  }

  // Private helper methods

  private calculateComplianceScore(applicationData: any): number {
    let score = 0;
    const maxScore = 100;

    // Business information (30 points)
    if (applicationData.businessName) score += 10;
    if (applicationData.businessType) score += 5;
    if (applicationData.businessDescription) score += 10;
    if (applicationData.categories && applicationData.categories.length > 0) score += 5;

    // Contact information (20 points)
    if (applicationData.contactInfo?.phone) score += 10;
    if (applicationData.contactInfo?.email) score += 10;

    // Business address (20 points)
    if (applicationData.businessAddress?.street) score += 5;
    if (applicationData.businessAddress?.city) score += 5;
    if (applicationData.businessAddress?.governorate) score += 5;
    if (applicationData.businessAddress?.country) score += 5;

    // Documents (30 points)
    if (applicationData.documents?.businessLicense) score += 10;
    if (applicationData.documents?.taxCertificate) score += 10;
    if (applicationData.documents?.identityDocument) score += 10;

    return Math.min(score, maxScore);
  }

  private async updateUserToVendor(userId: string, application: VendorApplication): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: 'vendor',
        vendorInfo: {
          businessName: application.businessName,
          businessType: application.businessType,
          businessAddress: application.businessAddress,
          contactInfo: application.contactInfo,
          categories: application.categories,
          approvedAt: new Date(),
          applicationId: application.id
        },
        updatedAt: serverTimestamp()
      });

      // Update in Realtime Database
      const userRealTimeRef = ref(realtimeDb, `users/${userId}`);
      await update(userRealTimeRef, {
        role: 'vendor',
        vendorInfo: {
          ...application,
          approvedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      });

      console.log(`✅ User ${userId} updated to vendor`);

    } catch (error) {
      console.error('Error updating user to vendor:', error);
      throw error;
    }
  }

  private async notifyAdminNewApplication(applicationId: string, application: VendorApplication): Promise<void> {
    try {
      // Send email to admin
      await EmailService.sendVendorApplicationNotification(
        'admin@soukelsyarat.com',
        application.businessName,
        applicationId,
        application.complianceScore
      );

      // Send real-time notification
      const notificationRef = ref(realtimeDb, 'adminNotifications');
      await push(notificationRef, {
        type: 'new_vendor_application',
        applicationId,
        businessName: application.businessName,
        complianceScore: application.complianceScore,
        submittedAt: new Date().toISOString(),
        read: false
      });

    } catch (error) {
      console.error('Error notifying admin:', error);
    }
  }

  private async notifyVendorApplicationStatus(
    application: VendorApplication,
    review: VendorApplicationReview
  ): Promise<void> {
    try {
      if (review.status === 'approved') {
        await EmailService.sendVendorApplicationStatusEmail(
          application.userEmail,
          application.businessName,
          'approved',
          review.reviewNotes
        );
      } else {
        await EmailService.sendVendorApplicationStatusEmail(
          application.userEmail,
          application.businessName,
          'rejected',
          review.reviewNotes
        );
      }

      // Send real-time notification to vendor
      const notificationRef = ref(realtimeDb, `userNotifications/${application.userId}`);
      await push(notificationRef, {
        type: 'vendor_application_status',
        applicationId: application.id,
        status: review.status,
        message: review.status === 'approved' 
          ? 'Your vendor application has been approved!' 
          : 'Your vendor application has been rejected.',
        timestamp: new Date().toISOString(),
        read: false
      });

    } catch (error) {
      console.error('Error notifying vendor:', error);
    }
  }

  private async storeApplicationReview(applicationId: string, review: VendorApplicationReview): Promise<void> {
    try {
      const reviewData = {
        ...review,
        reviewedAt: new Date()
      };

      await addDoc(collection(db, 'vendorApplicationReviews'), {
        ...reviewData,
        reviewedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error storing application review:', error);
    }
  }

  private async trackApplicationEvent(eventType: string, data: any): Promise<void> {
    try {
      const eventRef = ref(realtimeDb, `analytics/vendorApplications/${eventType}_${Date.now()}`);
      await set(eventRef, {
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking application event:', error);
    }
  }

  private calculateAverageReviewTime(applications: VendorApplication[]): number {
    const reviewedApplications = applications.filter(app => app.reviewedAt);
    if (reviewedApplications.length === 0) return 0;

    const totalTime = reviewedApplications.reduce((sum, app) => {
      const reviewTime = app.reviewedAt!.getTime() - app.submittedAt.getTime();
      return sum + reviewTime;
    }, 0);

    return totalTime / reviewedApplications.length / (1000 * 60 * 60); // Convert to hours
  }

  private calculateApprovalRate(applications: VendorApplication[]): number {
    const reviewedApplications = applications.filter(app => 
      app.status === 'approved' || app.status === 'rejected'
    );
    
    if (reviewedApplications.length === 0) return 0;
    
    const approvedApplications = applications.filter(app => app.status === 'approved');
    return (approvedApplications.length / reviewedApplications.length) * 100;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.realTimeSubscriptions.forEach(unsubscribe => unsubscribe());
    this.realTimeSubscriptions.clear();
  }
}

export default VendorApplicationService;