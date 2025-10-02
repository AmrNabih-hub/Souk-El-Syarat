/**
 * 📁 Appwrite Storage Service
 * Professional file storage service using Appwrite Cloud
 * Based on: https://appwrite.io/docs/products/storage
 */

import { storage, type Models } from '@/config/appwrite.config';
import { ID } from 'appwrite';

export interface FileUploadOptions {
  bucketId: string;
  file: File;
  onProgress?: (progress: number) => void;
}

export interface FileUploadResult {
  fileId: string;
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface StorageBucket {
  id: string;
  name: string;
  enabled: boolean;
  maximumFileSize: number;
  allowedFileExtensions: string[];
  compression: string;
  encryption: boolean;
  antivirus: boolean;
}

export class AppwriteStorageService {
  private static instance: AppwriteStorageService;

  private constructor() {}

  public static getInstance(): AppwriteStorageService {
    if (!AppwriteStorageService.instance) {
      AppwriteStorageService.instance = new AppwriteStorageService();
    }
    return AppwriteStorageService.instance;
  }

  // ==================== BUCKET MANAGEMENT ====================

  /**
   * Get all storage buckets
   */
  public async getBuckets(): Promise<StorageBucket[]> {
    try {
      const response = await storage.listBuckets();
      return response.buckets.map(bucket => ({
        id: bucket.$id,
        name: bucket.name,
        enabled: bucket.enabled,
        maximumFileSize: bucket.maximumFileSize,
        allowedFileExtensions: bucket.allowedFileExtensions,
        compression: bucket.compression,
        encryption: bucket.encryption,
        antivirus: bucket.antivirus
      }));
    } catch (error) {
      console.error('❌ Failed to get buckets:', error);
      return [];
    }
  }

  /**
   * Get bucket by ID
   */
  public async getBucket(bucketId: string): Promise<StorageBucket | null> {
    try {
      const bucket = await storage.getBucket(bucketId);
      return {
        id: bucket.$id,
        name: bucket.name,
        enabled: bucket.enabled,
        maximumFileSize: bucket.maximumFileSize,
        allowedFileExtensions: bucket.allowedFileExtensions,
        compression: bucket.compression,
        encryption: bucket.encryption,
        antivirus: bucket.antivirus
      };
    } catch (error) {
      console.error('❌ Failed to get bucket:', error);
      return null;
    }
  }

  // ==================== FILE UPLOAD ====================

  /**
   * Upload file to storage bucket
   */
  public async uploadFile(options: FileUploadOptions): Promise<FileUploadResult | null> {
    try {
      const { bucketId, file, onProgress } = options;

      // Validate file size and type
      const bucket = await this.getBucket(bucketId);
      if (!bucket) {
        throw new Error('Bucket not found');
      }

      if (file.size > bucket.maximumFileSize) {
        throw new Error(`File size exceeds maximum allowed size of ${bucket.maximumFileSize} bytes`);
      }

      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension && !bucket.allowedFileExtensions.includes(fileExtension)) {
        throw new Error(`File type .${fileExtension} is not allowed`);
      }

      // Upload file
      const response = await storage.createFile(
        bucketId,
        ID.unique(),
        file,
        undefined,
        onProgress
      );

      // Get file URL
      const fileUrl = this.getFileUrl(bucketId, response.$id);

      console.log('✅ File uploaded successfully:', response.$id);

      return {
        fileId: response.$id,
        url: fileUrl,
        name: file.name,
        size: file.size,
        mimeType: file.type
      };
    } catch (error) {
      console.error('❌ File upload failed:', error);
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple files
   */
  public async uploadFiles(
    bucketId: string,
    files: File[],
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<FileUploadResult[]> {
    try {
      const uploadPromises = files.map(async (file, index) => {
        return this.uploadFile({
          bucketId,
          file,
          onProgress: (progress) => onProgress?.(index, progress)
        });
      });

      const results = await Promise.all(uploadPromises);
      return results.filter((result): result is FileUploadResult => result !== null);
    } catch (error) {
      console.error('❌ Multiple file upload failed:', error);
      throw new Error('Multiple file upload failed');
    }
  }

  // ==================== FILE MANAGEMENT ====================

  /**
   * Get file by ID
   */
  public async getFile(bucketId: string, fileId: string): Promise<Models.File | null> {
    try {
      const file = await storage.getFile(bucketId, fileId);
      return file;
    } catch (error) {
      console.error('❌ Failed to get file:', error);
      return null;
    }
  }

  /**
   * List files in bucket
   */
  public async listFiles(
    bucketId: string,
    limit: number = 25,
    offset: number = 0,
    search?: string
  ): Promise<{ files: Models.File[]; total: number }> {
    try {
      const queries = [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt')
      ];

      if (search) {
        queries.push(Query.search('name', search));
      }

      const response = await storage.listFiles(bucketId, queries);
      return {
        files: response.files,
        total: response.total
      };
    } catch (error) {
      console.error('❌ Failed to list files:', error);
      return { files: [], total: 0 };
    }
  }

  /**
   * Delete file
   */
  public async deleteFile(bucketId: string, fileId: string): Promise<boolean> {
    try {
      await storage.deleteFile(bucketId, fileId);
      console.log('✅ File deleted successfully:', fileId);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete file:', error);
      return false;
    }
  }

  /**
   * Delete multiple files
   */
  public async deleteFiles(bucketId: string, fileIds: string[]): Promise<boolean> {
    try {
      const deletePromises = fileIds.map(fileId => 
        this.deleteFile(bucketId, fileId)
      );
      
      const results = await Promise.all(deletePromises);
      return results.every(result => result);
    } catch (error) {
      console.error('❌ Failed to delete multiple files:', error);
      return false;
    }
  }

  // ==================== FILE URLS ====================

  /**
   * Get file URL for viewing
   */
  public getFileUrl(bucketId: string, fileId: string): string {
    return `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`;
  }

  /**
   * Get file download URL
   */
  public getFileDownloadUrl(bucketId: string, fileId: string): string {
    return `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/download?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`;
  }

  /**
   * Get file preview URL (for images)
   */
  public getFilePreviewUrl(
    bucketId: string, 
    fileId: string, 
    width?: number, 
    height?: number,
    quality?: number
  ): string {
    let url = `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/preview?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`;
    
    const params = new URLSearchParams();
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    if (quality) params.append('quality', quality.toString());
    
    if (params.toString()) {
      url += `&${params.toString()}`;
    }
    
    return url;
  }

  // ==================== SPECIFIC BUCKET OPERATIONS ====================

  /**
   * Upload product image
   */
  public async uploadProductImage(file: File, onProgress?: (progress: number) => void): Promise<FileUploadResult | null> {
    const bucketId = import.meta.env.VITE_APPWRITE_PRODUCT_IMAGES_BUCKET_ID || 'product_images';
    return this.uploadFile({ bucketId, file, onProgress });
  }

  /**
   * Upload vendor document
   */
  public async uploadVendorDocument(file: File, onProgress?: (progress: number) => void): Promise<FileUploadResult | null> {
    const bucketId = import.meta.env.VITE_APPWRITE_VENDOR_DOCUMENTS_BUCKET_ID || 'vendor_documents';
    return this.uploadFile({ bucketId, file, onProgress });
  }

  /**
   * Upload car listing image
   */
  public async uploadCarListingImage(file: File, onProgress?: (progress: number) => void): Promise<FileUploadResult | null> {
    const bucketId = import.meta.env.VITE_APPWRITE_CAR_LISTING_IMAGES_BUCKET_ID || 'car_listing_images';
    return this.uploadFile({ bucketId, file, onProgress });
  }

  /**
   * Upload user avatar
   */
  public async uploadUserAvatar(file: File, onProgress?: (progress: number) => void): Promise<FileUploadResult | null> {
    const bucketId = import.meta.env.VITE_APPWRITE_USER_AVATARS_BUCKET_ID || 'user_avatars';
    return this.uploadFile({ bucketId, file, onProgress });
  }

  // ==================== IMAGE PROCESSING ====================

  /**
   * Get optimized image URL
   */
  public getOptimizedImageUrl(
    bucketId: string,
    fileId: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpg' | 'png' | 'webp';
    } = {}
  ): string {
    const { width, height, quality, format } = options;
    
    let url = `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/preview?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`;
    
    const params = new URLSearchParams();
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    if (quality) params.append('quality', quality.toString());
    if (format) params.append('format', format);
    
    if (params.toString()) {
      url += `&${params.toString()}`;
    }
    
    return url;
  }

  /**
   * Get thumbnail URL
   */
  public getThumbnailUrl(bucketId: string, fileId: string, size: number = 150): string {
    return this.getOptimizedImageUrl(bucketId, fileId, {
      width: size,
      height: size,
      quality: 80,
      format: 'webp'
    });
  }

  // ==================== VALIDATION ====================

  /**
   * Validate file before upload
   */
  public validateFile(file: File, bucketId: string): { valid: boolean; error?: string } {
    // Basic validation
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    // File type validation (basic)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported' };
    }

    // File size validation (basic - 10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    return { valid: true };
  }

  /**
   * Get file size in human readable format
   */
  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const appwriteStorageService = AppwriteStorageService.getInstance();