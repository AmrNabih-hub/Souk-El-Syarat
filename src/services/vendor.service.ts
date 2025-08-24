import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

import { db, storage } from '@/config/firebase.config';
import { Vendor, VendorStatus, BusinessType, VendorApplication } from '@/types';

export interface VendorApplicationData {
  businessName: string;
  businessType: BusinessType;
  description: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  whatsappNumber?: string;
  address: {
    street: string;
    city: string;
    governorate: string;
    postalCode?: string;
  };
  businessLicense: string;
  taxId?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  experience: string;
  specializations: string[];
  expectedMonthlyVolume: string;
  documents?: File[];
}

export interface VendorUpdateData {
  businessName?: string;
  description?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  logo?: File;
}

export class VendorService {
  private static COLLECTION_NAME = 'vendors';
  private static APPLICATIONS_COLLECTION_NAME = 'vendor_applications';

  /**
   * Submit a vendor application
   */
  static async submitApplication(
    userId: string,
    applicationData: VendorApplicationData
  ): Promise<string> {
    try {
      const applicationId = doc(collection(db, this.APPLICATIONS_COLLECTION_NAME)).id;

      // Upload documents if any
      const documentUrls: string[] = [];
      if (applicationData.documents && applicationData.documents.length > 0) {
        for (const document of applicationData.documents) {
          const documentRef = ref(
            storage,
            `vendor_applications/${applicationId}/documents/${document.name}`
          );
          await uploadBytes(documentRef, document);
          const downloadURL = await getDownloadURL(documentRef);
          documentUrls.push(downloadURL);
        }
      }

      const application: VendorApplication = {
        id: applicationId,
        userId,
        ...applicationData,
        address: {
          street: applicationData.address.street,
          city: applicationData.address.city,
          governorate: applicationData.address.governorate,
          postalCode: applicationData.address.postalCode,
          country: 'Egypt',
        },
        documents: documentUrls,
        status: 'pending',
        appliedDate: new Date(),
        reviewedDate: null,
        reviewedBy: null,
        reviewNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, this.APPLICATIONS_COLLECTION_NAME, applicationId), {
        ...application,
        appliedDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return applicationId;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error submitting vendor application:', error);
      throw new Error('Failed to submit vendor application');
    }
  }

  /**
   * Get vendor application by ID
   */
  static async getApplication(applicationId: string): Promise<VendorApplication | null> {
    try {
      const docSnap = await getDoc(doc(db, this.APPLICATIONS_COLLECTION_NAME, applicationId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...(data as any),
          appliedDate: data.appliedDate.toDate() || new Date(),
          reviewedDate: data.reviewedDate.toDate() || new Date() || null,
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
        } as VendorApplication;
      }
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error getting vendor application:', error);
      throw new Error('Failed to get vendor application');
    }
  }

  /**
   * Get vendor applications by user ID
   */
  static async getApplicationsByUser(userId: string): Promise<VendorApplication[]> {
    try {
      const q = query(
        collection(db, this.APPLICATIONS_COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('appliedDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...(data as any),
          appliedDate: data.appliedDate.toDate() || new Date(),
          reviewedDate: data.reviewedDate.toDate() || new Date() || null,
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
        } as VendorApplication;
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error getting user vendor applications:', error);
      throw new Error('Failed to get vendor applications');
    }
  }

  /**
   * Get all vendor applications (for admin)
   */
  static async getAllApplications(
    status?: VendorStatus,
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ applications: VendorApplication[]; lastDoc: DocumentSnapshot | null }> {
    try {
      let q = query(
        collection(db, this.APPLICATIONS_COLLECTION_NAME),
        orderBy('appliedDate', 'desc'),
        limit(limitCount)
      );

      if (status) {
        q = query(
          collection(db, this.APPLICATIONS_COLLECTION_NAME),
          where('status', '==', status),
          orderBy('appliedDate', 'desc'),
          limit(limitCount)
        );
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const applications = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...(data as any),
          appliedDate: data.appliedDate.toDate() || new Date(),
          reviewedDate: data.reviewedDate.toDate() || new Date() || null,
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
        } as VendorApplication;
      });

      const lastDocument =
        querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

      return { applications, lastDoc: lastDocument };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error getting all vendor applications:', error);
      throw new Error('Failed to get vendor applications');
    }
  }

  /**
   * Review vendor application (for admin)
   */
  static async reviewApplication(
    applicationId: string,
    adminId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string
  ): Promise<void> {
    try {
      const application = await this.getApplication(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Update application status
      await updateDoc(doc(db, this.APPLICATIONS_COLLECTION_NAME, applicationId), {
        status,
        reviewedBy: adminId,
        reviewedDate: serverTimestamp(),
        reviewNotes: reviewNotes || null,
        updatedAt: serverTimestamp(),
      });

      // If approved, create vendor profile
      if (status === 'approved') {
        await this.createVendorFromApplication(application);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error reviewing vendor application:', error);
      throw new Error('Failed to review vendor application');
    }
  }

  /**
   * Create vendor profile from approved application
   */
  private static async createVendorFromApplication(application: VendorApplication): Promise<void> {
    try {
      const vendorId = doc(collection(db, this.COLLECTION_NAME)).id;

      const vendor: Vendor = {
        id: vendorId,
        userId: application.userId,
        businessName: application.businessName,
        businessType: application.businessType,
        description: application.description,
        contactPerson: application.contactPerson,
        email: application.email,
        phoneNumber: application.phoneNumber,
        whatsappNumber: application.whatsappNumber,
        address: application.address,
        businessLicense: application.businessLicense,
        taxId: application.taxId,
        website: application.website,
        socialMedia: application.socialMedia,
        experience: application.experience,
        specializations: application.specializations,
        expectedMonthlyVolume: application.expectedMonthlyVolume,
        status: 'active',
        rating: 0,
        totalReviews: 0,
        totalSales: 0,
        totalProducts: 0,
        joinedDate: new Date(),
        lastActive: new Date(),
        isVerified: true,
        logo: undefined,
        coverImage: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, this.COLLECTION_NAME, vendorId), {
        ...vendor,
        joinedDate: serverTimestamp(),
        lastActive: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error creating vendor from application:', error);
      throw new Error('Failed to create vendor profile');
    }
  }

  /**
   * Get vendor by ID
   */
  static async getVendor(vendorId: string): Promise<Vendor | null> {
    try {
      const docSnap = await getDoc(doc(db, this.COLLECTION_NAME, vendorId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...(data as any),
          joinedDate: data.joinedDate.toDate() || new Date(),
          lastActive: data.lastActive.toDate() || new Date(),
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
        } as Vendor;
      }
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error getting vendor:', error);
      throw new Error('Failed to get vendor');
    }
  }

  /**
   * Get vendor by user ID
   */
  static async getVendorByUserId(userId: string): Promise<Vendor | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        return {
          ...(data as any),
          joinedDate: data.joinedDate.toDate() || new Date(),
          lastActive: data.lastActive.toDate() || new Date(),
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
        } as Vendor;
      }
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error getting vendor by user ID:', error);
      throw new Error('Failed to get vendor');
    }
  }

  /**
   * Get all vendors
   */
  static async getAllVendors(
    status?: VendorStatus,
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ vendors: Vendor[]; lastDoc: DocumentSnapshot | null }> {
    try {
      let q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('joinedDate', 'desc'),
        limit(limitCount)
      );

      if (status) {
        q = query(
          collection(db, this.COLLECTION_NAME),
          where('status', '==', status),
          orderBy('joinedDate', 'desc'),
          limit(limitCount)
        );
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const vendors = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...(data as any),
          joinedDate: data.joinedDate.toDate() || new Date(),
          lastActive: data.lastActive.toDate() || new Date(),
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
        } as Vendor;
      });

      const lastDocument =
        querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

      return { vendors, lastDoc: lastDocument };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error getting all vendors:', error);
      throw new Error('Failed to get vendors');
    }
  }

  /**
   * Update vendor profile
   */
  static async updateVendor(vendorId: string, updates: VendorUpdateData): Promise<void> {
    try {
      const updateData: unknown = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Handle logo upload
      if (updates.logo) {
        const logoRef = ref(storage, `vendors/${vendorId}/logo.jpg`);
        await uploadBytes(logoRef, updates.logo);
        updateData.logo = await getDownloadURL(logoRef);
        delete updateData.logo; // Remove the File object from updateData
      }

      await updateDoc(doc(db, this.COLLECTION_NAME, vendorId), updateData);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error updating vendor:', error);
      throw new Error('Failed to update vendor');
    }
  }

  /**
   * Update vendor status (for admin)
   */
  static async updateVendorStatus(vendorId: string, status: VendorStatus): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION_NAME, vendorId), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error updating vendor status:', error);
      throw new Error('Failed to update vendor status');
    }
  }

  /**
   * Delete vendor (for admin)
   */
  static async deleteVendor(vendorId: string): Promise<void> {
    try {
      // Delete vendor logo if exists
      const vendor = await this.getVendor(vendorId);
      if (vendor?.logo) {
        try {
          const logoRef = ref(storage, `vendors/${vendorId}/logo.jpg`);
          await deleteObject(logoRef);
        } catch (logoError) {
          // if (process.env.NODE_ENV === 'development') console.warn('Error deleting vendor logo:', logoError);
        }
      }

      // Delete vendor document
      await deleteDoc(doc(db, this.COLLECTION_NAME, vendorId));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error deleting vendor:', error);
      throw new Error('Failed to delete vendor');
    }
  }

  /**
   * Search vendors by name or specialization
   */
  static async searchVendors(searchTerm: string, limitCount: number = 20): Promise<Vendor[]> {
    try {
      // Note: This is a basic search implementation
      // For production, consider using Algolia or similar service for better search
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', 'active'),
        orderBy('businessName'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const vendors = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...(data as any),
          joinedDate: data.joinedDate.toDate() || new Date(),
          lastActive: data.lastActive.toDate() || new Date(),
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
        } as Vendor;
      });

      // Filter by search term (client-side for now)
      const filteredVendors = vendors.filter(
        vendor =>
          vendor.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return filteredVendors;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error searching vendors:', error);
      throw new Error('Failed to search vendors');
    }
  }

  /**
   * Get vendor statistics (for admin dashboard)
   */
  static async getVendorStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    suspended: number;
    applications: {
      pending: number;
      approved: number;
      rejected: number;
    };
  }> {
    try {
      // Get vendor counts
      const [activeVendors, pendingVendors, suspendedVendors] = await Promise.all([
        getDocs(query(collection(db, this.COLLECTION_NAME), where('status', '==', 'active'))),
        getDocs(query(collection(db, this.COLLECTION_NAME), where('status', '==', 'pending'))),
        getDocs(query(collection(db, this.COLLECTION_NAME), where('status', '==', 'suspended'))),
      ]);

      // Get application counts
      const [pendingApplications, approvedApplications, rejectedApplications] = await Promise.all([
        getDocs(
          query(collection(db, this.APPLICATIONS_COLLECTION_NAME), where('status', '==', 'pending'))
        ),
        getDocs(
          query(
            collection(db, this.APPLICATIONS_COLLECTION_NAME),
            where('status', '==', 'approved')
          )
        ),
        getDocs(
          query(
            collection(db, this.APPLICATIONS_COLLECTION_NAME),
            where('status', '==', 'rejected')
          )
        ),
      ]);

      return {
        total: activeVendors.size + pendingVendors.size + suspendedVendors.size,
        active: activeVendors.size,
        pending: pendingVendors.size,
        suspended: suspendedVendors.size,
        applications: {
          pending: pendingApplications.size,
          approved: approvedApplications.size,
          rejected: rejectedApplications.size,
        },
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error getting vendor statistics:', error);
      throw new Error('Failed to get vendor statistics');
    }
  }
}
