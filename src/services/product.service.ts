/**
 * Product Service - Now uses Appwrite Database
 */

import { AppwriteDatabaseService } from './appwrite-database.service';
import { appwriteConfig } from '@/config/appwrite.config';

export class ProductService {
  static async createProduct(productData: any) {
    return await AppwriteDatabaseService.createDocument(
      appwriteConfig.collections.products,
      productData
    );
  }

  static async getProduct(productId: string) {
    return await AppwriteDatabaseService.getDocument(
      appwriteConfig.collections.products,
      productId
    );
  }

  static async updateProduct(productId: string, updates: any) {
    return await AppwriteDatabaseService.updateDocument(
      appwriteConfig.collections.products,
      productId,
      updates
    );
  }

  static async deleteProduct(productId: string) {
    return await AppwriteDatabaseService.deleteDocument(
      appwriteConfig.collections.products,
      productId
    );
  }

  static async listProducts(filters?: any) {
    return await AppwriteDatabaseService.queryDocuments(
      appwriteConfig.collections.products,
      filters || {}
    );
  }

  static async getProductsByVendor(vendorId: string) {
    return await AppwriteDatabaseService.queryDocuments(
      appwriteConfig.collections.products,
      { equal: { vendorId } }
    );
  }

  static async getProductsByCategory(category: string) {
    return await AppwriteDatabaseService.queryDocuments(
      appwriteConfig.collections.products,
      { equal: { category } }
    );
  }

  static async getActiveProducts() {
    return await AppwriteDatabaseService.queryDocuments(
      appwriteConfig.collections.products,
      { equal: { status: 'active' }, orderBy: 'createdAt', orderDirection: 'desc' }
    );
  }
}

export default ProductService;
