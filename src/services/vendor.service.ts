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

  // Get vendor statistics
  static async getVendorStats(vendorId: string): Promise<{
    total: number;
    applications: {
      pending: number;
      approved: number;
      rejected: number;
    };
  }> {
    try {
      // Get vendor applications stats
      const applicationsQuery = query(
        collection(db, this.APPLICATIONS_COLLECTION_NAME),
        where('vendorId', '==', vendorId)
      );
      
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const applications = applicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorApplication));
      
      return {
        total: 1, // Assuming vendor exists
        applications: {
          pending: applications.filter(a => a.status === 'pending').length,
          approved: applications.filter(a => a.status === 'approved').length,
          rejected: applications.filter(a => a.status === 'rejected').length,
        }
      };
    } catch (error) {
      console.error('Error getting vendor stats:', error);
      return { total: 0, applications: { pending: 0, approved: 0, rejected: 0 } };
    }
  }

  /**
   * Submit a vendor application
   */
  static async submitApplication(
    userId: string,
    applicationData: VendorApplicationData
  ): Promise<string> {
    try {
      const applicationId = doc(collection(db, this.APPLICATIONS_COLLECTION_NAME)).id;

      // Upload documents if provided
      let documentUrls: string[] = [];
      if (applicationData.documents && applicationData.documents.length > 0) {
        documentUrls = await this.uploadDocuments(applicationId, applicationData.documents);
      }

      const application: Omit<VendorApplication, 'id'> = {
        userId,
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
        documents: documentUrls,
        status: 'pending',
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        reviewNotes: null,
      };

      await setDoc(doc(db, this.APPLICATIONS_COLLECTION_NAME, applicationId), application);

      return applicationId;
    } catch (error) {
      console.error('Error submitting vendor application:', error);
      throw new Error('Failed to submit vendor application');
    }
  }

  /**
   * Get all vendor applications with filtering and pagination
   */
  static async getAllApplications(
    status?: VendorApplication['status'],
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ applications: VendorApplication[]; lastDoc?: DocumentSnapshot }> {
    try {
      let q = query(
        collection(db, this.APPLICATIONS_COLLECTION_NAME),
        orderBy('submittedAt', 'desc')
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      q = query(q, limit(limitCount));

      const snapshot = await getDocs(q);
      const applications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as VendorApplication[];

      return {
        applications,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
      };
    } catch (error) {
      console.error('Error getting vendor applications:', error);
      throw new Error('Failed to get vendor applications');
    }
  }

  /**
   * Get vendor application by ID
   */
  static async getApplicationById(applicationId: string): Promise<VendorApplication | null> {
    try {
      const docRef = doc(db, this.APPLICATIONS_COLLECTION_NAME, applicationId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as VendorApplication;
      }

      return null;
    } catch (error) {
      console.error('Error getting vendor application:', error);
      throw new Error('Failed to get vendor application');
    }
  }

  /**
   * Review vendor application (approve/reject)
   */
  static async reviewApplication(
    applicationId: string,
    reviewerId: string,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<void> {
    try {
      const applicationRef = doc(db, this.APPLICATIONS_COLLECTION_NAME, applicationId);
      
      await updateDoc(applicationRef, {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: reviewerId,
        reviewNotes: notes,
      });

      // If approved, create vendor profile
      if (status === 'approved') {
        const application = await this.getApplicationById(applicationId);
        if (application) {
          await this.createVendorFromApplication(application);
        }
      }
    } catch (error) {
      console.error('Error reviewing vendor application:', error);
      throw new Error('Failed to review vendor application');
    }
  }

  /**
   * Create vendor profile from approved application
   */
  private static async createVendorFromApplication(application: VendorApplication): Promise<void> {
    try {
      const vendorId = application.userId;
      const vendor: Omit<Vendor, 'id'> = {
        userId: vendorId,
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
        status: 'active',
        isVerified: true,
        rating: 0,
        totalSales: 0,
        totalOrders: 0,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, this.COLLECTION_NAME, vendorId), vendor);
    } catch (error) {
      console.error('Error creating vendor from application:', error);
      throw new Error('Failed to create vendor profile');
    }
  }

  /**
   * Get all vendors with filtering and pagination
   */
  static async getAllVendors(
    status?: VendorStatus,
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ vendors: Vendor[]; lastDoc?: DocumentSnapshot }> {
    try {
      let q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      q = query(q, limit(limitCount));

      const snapshot = await getDocs(q);
      const vendors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Vendor[];

      return {
        vendors,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
      };
    } catch (error) {
      console.error('Error getting vendors:', error);
      throw new Error('Failed to get vendors');
    }
  }

  /**
   * Get vendor by ID
   */
  static async getVendorById(vendorId: string): Promise<Vendor | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, vendorId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Vendor;
      }

      return null;
    } catch (error) {
      console.error('Error getting vendor:', error);
      throw new Error('Failed to get vendor');
    }
  }

  /**
   * Update vendor profile
   */
  static async updateVendor(
    vendorId: string,
    updateData: VendorUpdateData
  ): Promise<void> {
    try {
      const vendorRef = doc(db, this.COLLECTION_NAME, vendorId);

      // Upload logo if provided
      let logoUrl: string | undefined;
      if (updateData.logo) {
        logoUrl = await this.uploadLogo(vendorId, updateData.logo);
      }

      const updateFields: any = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      if (logoUrl) {
        updateFields.logoUrl = logoUrl;
      }

      // Remove logo file from update data
      delete updateFields.logo;

      await updateDoc(vendorRef, updateFields);
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw new Error('Failed to update vendor');
    }
  }

  /**
   * Delete vendor
   */
  static async deleteVendor(vendorId: string): Promise<void> {
    try {
      const vendorRef = doc(db, this.COLLECTION_NAME, vendorId);
      await deleteDoc(vendorRef);
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw new Error('Failed to delete vendor');
    }
  }

  /**
   * Upload vendor documents
   */
  private static async uploadDocuments(
    applicationId: string,
    documents: File[]
  ): Promise<string[]> {
    try {
      const uploadPromises = documents.map(async (doc, index) => {
        const fileName = `applications/${applicationId}/documents/${index}_${doc.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, doc);
        return getDownloadURL(storageRef);
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw new Error('Failed to upload documents');
    }
  }

  /**
   * Upload vendor logo
   */
  private static async uploadLogo(vendorId: string, logo: File): Promise<string> {
    try {
      const fileName = `vendors/${vendorId}/logo/${logo.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, logo);
      return getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw new Error('Failed to upload logo');
    }
  }

  /**
   * Search vendors
   */
  static async searchVendors(
    searchTerm: string,
    filters?: {
      businessType?: BusinessType;
      specializations?: string[];
      status?: VendorStatus;
    },
    limitCount: number = 20
  ): Promise<Vendor[]> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME));

      // Apply text search (Firestore doesn't support full-text search, so we use array-contains-any for specializations)
      if (searchTerm) {
        // This is a simplified search - in production, you'd want to use Algolia or similar
        q = query(q, where('businessName', '>=', searchTerm));
      }

      // Apply filters
      if (filters?.businessType) {
        q = query(q, where('businessType', '==', filters.businessType));
      }

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.specializations && filters.specializations.length > 0) {
        q = query(q, where('specializations', 'array-contains-any', filters.specializations));
      }

      q = query(q, limit(limitCount));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));
    } catch (error) {
      console.error('Error searching vendors:', error);
      throw new Error('Failed to search vendors');
    }
  }
}