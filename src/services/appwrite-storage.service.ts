/**
 * 📁 Appwrite Storage Service
 * Professional file storage service for Souk El-Sayarat
 * Handles image uploads, documents, and file management
 */

import { ID } from 'appwrite';
import { storage, appwriteConfig } from '@/config/appwrite.config';

export class AppwriteStorageService {
  /**
   * Upload a file to a bucket
   */
  static async uploadFile(
    bucketId: string,
    file: File,
    fileId?: string,
    onProgress?: (progress: number) => void
  ): Promise<{ id: string; url: string }> {
    try {
      console.log(`📤 Uploading file to bucket ${bucketId}...`);

      const uploadedFile = await storage.createFile(
        bucketId,
        fileId || ID.unique(),
        file,
        undefined, // permissions (use bucket defaults)
        onProgress
      );

      console.log('✅ File uploaded successfully:', uploadedFile.$id);

      // Generate file URL
      const url = this.getFileUrl(bucketId, uploadedFile.$id);

      return {
        id: uploadedFile.$id,
        url,
      };
    } catch (error: any) {
      console.error('❌ Upload file error:', error);
      throw new Error(error.message || 'Failed to upload file');
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadFiles(
    bucketId: string,
    files: File[],
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<Array<{ id: string; url: string }>> {
    try {
      console.log(`📤 Uploading ${files.length} files to bucket ${bucketId}...`);

      const uploadPromises = files.map((file, index) =>
        this.uploadFile(
          bucketId,
          file,
          undefined,
          onProgress ? (progress) => onProgress(index, progress) : undefined
        )
      );

      const results = await Promise.all(uploadPromises);

      console.log(`✅ All files uploaded successfully`);

      return results;
    } catch (error: any) {
      console.error('❌ Upload files error:', error);
      throw new Error(error.message || 'Failed to upload files');
    }
  }

  /**
   * Get file URL
   */
  static getFileUrl(bucketId: string, fileId: string): string {
    return `${appwriteConfig.endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${appwriteConfig.projectId}`;
  }

  /**
   * Get file preview URL (for images with transformations)
   */
  static getFilePreview(
    bucketId: string,
    fileId: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      output?: 'jpg' | 'jpeg' | 'png' | 'gif' | 'webp';
    }
  ): string {
    const params = new URLSearchParams({
      project: appwriteConfig.projectId,
      ...(options?.width && { width: options.width.toString() }),
      ...(options?.height && { height: options.height.toString() }),
      ...(options?.quality && { quality: options.quality.toString() }),
      ...(options?.output && { output: options.output }),
    });

    return `${appwriteConfig.endpoint}/storage/buckets/${bucketId}/files/${fileId}/preview?${params.toString()}`;
  }

  /**
   * Get file download URL
   */
  static getFileDownload(bucketId: string, fileId: string): string {
    return `${appwriteConfig.endpoint}/storage/buckets/${bucketId}/files/${fileId}/download?project=${appwriteConfig.projectId}`;
  }

  /**
   * Delete a file
   */
  static async deleteFile(bucketId: string, fileId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting file ${fileId} from bucket ${bucketId}...`);

      await storage.deleteFile(bucketId, fileId);

      console.log('✅ File deleted successfully');
    } catch (error: any) {
      console.error('❌ Delete file error:', error);
      throw new Error(error.message || 'Failed to delete file');
    }
  }

  /**
   * Delete multiple files
   */
  static async deleteFiles(bucketId: string, fileIds: string[]): Promise<void> {
    try {
      console.log(`🗑️ Deleting ${fileIds.length} files from bucket ${bucketId}...`);

      const deletePromises = fileIds.map(fileId =>
        this.deleteFile(bucketId, fileId)
      );

      await Promise.all(deletePromises);

      console.log('✅ All files deleted successfully');
    } catch (error: any) {
      console.error('❌ Delete files error:', error);
      throw new Error(error.message || 'Failed to delete files');
    }
  }

  /**
   * Get file metadata
   */
  static async getFile(bucketId: string, fileId: string) {
    try {
      const file = await storage.getFile(bucketId, fileId);
      return file;
    } catch (error: any) {
      console.error('❌ Get file error:', error);
      throw new Error(error.message || 'Failed to get file');
    }
  }

  /**
   * List files in a bucket
   */
  static async listFiles(bucketId: string, queries?: string[]) {
    try {
      const files = await storage.listFiles(bucketId, queries);
      return files;
    } catch (error: any) {
      console.error('❌ List files error:', error);
      return { files: [], total: 0 };
    }
  }

  /**
   * Upload product image with optimization
   */
  static async uploadProductImage(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ id: string; url: string; thumbnailUrl: string }> {
    try {
      const result = await this.uploadFile(
        appwriteConfig.buckets.productImages,
        file,
        undefined,
        onProgress
      );

      // Generate thumbnail URL
      const thumbnailUrl = this.getFilePreview(
        appwriteConfig.buckets.productImages,
        result.id,
        {
          width: 300,
          height: 300,
          quality: 80,
          output: 'webp',
        }
      );

      return {
        ...result,
        thumbnailUrl,
      };
    } catch (error: any) {
      console.error('❌ Upload product image error:', error);
      throw new Error(error.message || 'Failed to upload product image');
    }
  }

  /**
   * Upload vendor document
   */
  static async uploadVendorDocument(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ id: string; url: string }> {
    try {
      return await this.uploadFile(
        appwriteConfig.buckets.vendorDocuments,
        file,
        undefined,
        onProgress
      );
    } catch (error: any) {
      console.error('❌ Upload vendor document error:', error);
      throw new Error(error.message || 'Failed to upload vendor document');
    }
  }

  /**
   * Upload car listing image with optimization
   */
  static async uploadCarListingImage(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ id: string; url: string; thumbnailUrl: string }> {
    try {
      const result = await this.uploadFile(
        appwriteConfig.buckets.carListingImages,
        file,
        undefined,
        onProgress
      );

      // Generate thumbnail URL
      const thumbnailUrl = this.getFilePreview(
        appwriteConfig.buckets.carListingImages,
        result.id,
        {
          width: 400,
          height: 300,
          quality: 85,
          output: 'webp',
        }
      );

      return {
        ...result,
        thumbnailUrl,
      };
    } catch (error: any) {
      console.error('❌ Upload car listing image error:', error);
      throw new Error(error.message || 'Failed to upload car listing image');
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(
    file: File,
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
      allowedExtensions?: string[];
    }
  ): { valid: boolean; error?: string } {
    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${(options.maxSize / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }

    // Check file extension
    if (options.allowedExtensions) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !options.allowedExtensions.includes(extension)) {
        return {
          valid: false,
          error: `File extension .${extension} is not allowed`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Compress image before upload (client-side)
   */
  static async compressImage(
    file: File,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number; // 0-1
    } = {}
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate new dimensions
          let width = img.width;
          let height = img.height;

          if (options.maxWidth && width > options.maxWidth) {
            height = (height * options.maxWidth) / width;
            width = options.maxWidth;
          }

          if (options.maxHeight && height > options.maxHeight) {
            width = (width * options.maxHeight) / height;
            height = options.maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            'image/jpeg',
            options.quality || 0.8
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
}

export default AppwriteStorageService;
