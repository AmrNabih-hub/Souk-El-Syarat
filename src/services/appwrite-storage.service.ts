/**
 * 📦 APPWRITE STORAGE SERVICE
 * Complete file upload and management service
 */

import { storage, appwriteConfig } from '@/config/appwrite.config';
import { ID } from 'appwrite';

export class AppwriteStorageService {
  /**
   * 📤 UPLOAD FILE
   */
  static async uploadFile(
    bucketId: string,
    file: File,
    fileId: string = ID.unique()
  ): Promise<{ fileId: string; url: string }> {
    try {
      console.log(`📤 Uploading file to ${bucketId}...`);
      
      const uploadedFile = await storage.createFile(
        bucketId,
        fileId,
        file
      );
      
      const url = this.getFilePreview(bucketId, uploadedFile.$id);
      
      console.log(`✅ File uploaded:`, uploadedFile.$id);
      return {
        fileId: uploadedFile.$id,
        url,
      };
    } catch (error: any) {
      console.error(`❌ File upload failed:`, error);
      throw new Error(error.message || 'File upload failed');
    }
  }

  /**
   * 📤 UPLOAD MULTIPLE FILES
   */
  static async uploadMultipleFiles(
    bucketId: string,
    files: File[]
  ): Promise<{ fileId: string; url: string }[]> {
    try {
      console.log(`📤 Uploading ${files.length} files to ${bucketId}...`);
      
      const uploadPromises = files.map(file => 
        this.uploadFile(bucketId, file)
      );
      
      const results = await Promise.all(uploadPromises);
      
      console.log(`✅ ${results.length} files uploaded successfully`);
      return results;
    } catch (error: any) {
      console.error(`❌ Multiple file upload failed:`, error);
      throw new Error(error.message || 'Multiple file upload failed');
    }
  }

  /**
   * 🖼️ GET FILE PREVIEW URL
   */
  static getFilePreview(
    bucketId: string,
    fileId: string,
    width?: number,
    height?: number
  ): string {
    try {
      const endpoint = appwriteConfig.endpoint;
      const projectId = appwriteConfig.project;
      
      let url = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/preview?project=${projectId}`;
      
      if (width) url += `&width=${width}`;
      if (height) url += `&height=${height}`;
      
      return url;
    } catch (error) {
      console.error(`❌ Failed to generate preview URL:`, error);
      return '';
    }
  }

  /**
   * 📥 GET FILE DOWNLOAD URL
   */
  static getFileDownload(bucketId: string, fileId: string): string {
    try {
      const endpoint = appwriteConfig.endpoint;
      const projectId = appwriteConfig.project;
      
      return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/download?project=${projectId}`;
    } catch (error) {
      console.error(`❌ Failed to generate download URL:`, error);
      return '';
    }
  }

  /**
   * 📄 GET FILE
   */
  static async getFile(bucketId: string, fileId: string) {
    try {
      console.log(`📄 Getting file ${fileId} from ${bucketId}...`);
      
      const file = await storage.getFile(bucketId, fileId);
      
      console.log(`✅ File retrieved:`, file.$id);
      return file;
    } catch (error: any) {
      console.error(`❌ Failed to get file:`, error);
      throw new Error(error.message || 'File not found');
    }
  }

  /**
   * 📋 LIST FILES
   */
  static async listFiles(bucketId: string, queries: string[] = []) {
    try {
      console.log(`📋 Listing files in ${bucketId}...`);
      
      const response = await storage.listFiles(bucketId, queries);
      
      console.log(`✅ Retrieved ${response.files.length} files`);
      return response;
    } catch (error: any) {
      console.error(`❌ Failed to list files:`, error);
      throw new Error(error.message || 'Failed to list files');
    }
  }

  /**
   * 🗑️ DELETE FILE
   */
  static async deleteFile(bucketId: string, fileId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting file ${fileId} from ${bucketId}...`);
      
      await storage.deleteFile(bucketId, fileId);
      
      console.log(`✅ File deleted`);
    } catch (error: any) {
      console.error(`❌ Failed to delete file:`, error);
      throw new Error(error.message || 'Failed to delete file');
    }
  }

  /**
   * 🗑️ DELETE MULTIPLE FILES
   */
  static async deleteMultipleFiles(
    bucketId: string,
    fileIds: string[]
  ): Promise<void> {
    try {
      console.log(`🗑️ Deleting ${fileIds.length} files from ${bucketId}...`);
      
      const deletePromises = fileIds.map(fileId =>
        this.deleteFile(bucketId, fileId)
      );
      
      await Promise.all(deletePromises);
      
      console.log(`✅ ${fileIds.length} files deleted`);
    } catch (error: any) {
      console.error(`❌ Failed to delete multiple files:`, error);
      throw new Error(error.message || 'Failed to delete files');
    }
  }

  /**
   * 📤 UPLOAD PRODUCT IMAGE
   */
  static async uploadProductImage(file: File) {
    return this.uploadFile(appwriteConfig.buckets.products, file);
  }

  /**
   * 📤 UPLOAD PRODUCT IMAGES (Multiple)
   */
  static async uploadProductImages(files: File[]) {
    return this.uploadMultipleFiles(appwriteConfig.buckets.products, files);
  }

  /**
   * 📤 UPLOAD CAR IMAGE
   */
  static async uploadCarImage(file: File) {
    return this.uploadFile(appwriteConfig.buckets.cars, file);
  }

  /**
   * 📤 UPLOAD CAR IMAGES (Multiple)
   */
  static async uploadCarImages(files: File[]) {
    return this.uploadMultipleFiles(appwriteConfig.buckets.cars, files);
  }

  /**
   * 📤 UPLOAD AVATAR
   */
  static async uploadAvatar(file: File) {
    return this.uploadFile(appwriteConfig.buckets.avatars, file);
  }

  /**
   * 🖼️ GET PRODUCT IMAGE URL
   */
  static getProductImageUrl(fileId: string, width?: number, height?: number): string {
    return this.getFilePreview(appwriteConfig.buckets.products, fileId, width, height);
  }

  /**
   * 🖼️ GET CAR IMAGE URL
   */
  static getCarImageUrl(fileId: string, width?: number, height?: number): string {
    return this.getFilePreview(appwriteConfig.buckets.cars, fileId, width, height);
  }

  /**
   * 🖼️ GET AVATAR URL
   */
  static getAvatarUrl(fileId: string, size: number = 200): string {
    return this.getFilePreview(appwriteConfig.buckets.avatars, fileId, size, size);
  }

  /**
   * ✅ VALIDATE IMAGE FILE
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 10MB limit.',
      };
    }

    return { valid: true };
  }

  /**
   * ✅ VALIDATE MULTIPLE IMAGE FILES
   */
  static validateMultipleImages(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    files.forEach((file, index) => {
      const validation = this.validateImageFile(file);
      if (!validation.valid) {
        errors.push(`File ${index + 1}: ${validation.error}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default AppwriteStorageService;

