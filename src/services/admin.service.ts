/**
 * Admin Service - Now uses Appwrite
 */

import { AppwriteAuthService } from './appwrite-auth.service';
import { AppwriteDatabaseService } from './appwrite-database.service';
import { appwriteConfig } from '@/config/appwrite.config';

export class AdminService {
  static async getAllUsers(filters?: any) {
    return await AppwriteAuthService.listUsers(filters);
  }

  static async updateUserRole(userId: string, role: string) {
    return await AppwriteAuthService.updateUserRole(userId, role as any);
  }

  static async getUserById(userId: string) {
    return await AppwriteAuthService.getUserById(userId);
  }

  static async getPendingVendorApplications() {
    return await AppwriteDatabaseService.queryDocuments(
      appwriteConfig.collections.vendorApplications,
      {
        equal: { status: 'pending' },
        orderBy: 'createdAt',
        orderDirection: 'desc'
      }
    );
  }

  static async approveVendorApplication(applicationId: string) {
    return await AppwriteDatabaseService.updateDocument(
      appwriteConfig.collections.vendorApplications,
      applicationId,
      { status: 'approved' }
    );
  }

  static async rejectVendorApplication(applicationId: string, notes: string) {
    return await AppwriteDatabaseService.updateDocument(
      appwriteConfig.collections.vendorApplications,
      applicationId,
      { status: 'rejected', reviewNotes: notes }
    );
  }

  static async getPendingProducts() {
    return await AppwriteDatabaseService.queryDocuments(
      appwriteConfig.collections.products,
      {
        equal: { status: 'pending_approval' },
        orderBy: 'createdAt',
        orderDirection: 'desc'
      }
    );
  }

  static async approveProduct(productId: string) {
    return await AppwriteDatabaseService.updateDocument(
      appwriteConfig.collections.products,
      productId,
      { status: 'active' }
    );
  }

  static async rejectProduct(productId: string) {
    return await AppwriteDatabaseService.updateDocument(
      appwriteConfig.collections.products,
      productId,
      { status: 'inactive' }
    );
  }
}

export default AdminService;
