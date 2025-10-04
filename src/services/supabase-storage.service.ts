/**
 * 🗂️ Supabase Storage Service
 * Professional file storage service using Supabase Storage
 * Documentation: https://supabase.com/docs/guides/storage
 */

import { supabase, supabaseConfig } from '@/config/supabase.config';
import type { FileObject, StorageError } from '@supabase/storage-js';

export interface UploadOptions {
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
  metadata?: Record<string, any>;
}

export interface UploadResult {
  data: {
    path: string;
    id: string;
    fullPath: string;
  } | null;
  error: StorageError | null;
}

export interface DownloadResult {
  data: Blob | null;
  error: StorageError | null;
}

export interface FileInfo {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
  size: number;
  mimetype: string;
}

class SupabaseStorageService {
  /**
   * Upload a file to a bucket
   */
  async uploadFile(
    bucketName: keyof typeof supabaseConfig.buckets,
    path: string,
    file: File | Blob,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const bucket = supabaseConfig.buckets[bucketName];
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: options.cacheControl || '3600',
          upsert: options.upsert || false,
          contentType: options.contentType || file.type,
          metadata: options.metadata,
        });

      if (error) {
        console.error(`❌ Upload to ${bucket} error:`, error);
        return { data: null, error };
      }

      const result = {
        path: data.path,
        id: data.id || '',
        fullPath: data.fullPath,
      };

      console.log(`✅ File uploaded successfully to ${bucket}:`, result.path);
      return { data: result, error: null };
    } catch (error) {
      console.error('❌ Upload file error:', error);
      return { data: null, error: error as StorageError };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    bucketName: keyof typeof supabaseConfig.buckets,
    files: { path: string; file: File | Blob; options?: UploadOptions }[]
  ): Promise<UploadResult[]> {
    try {
      const uploadPromises = files.map(({ path, file, options }) =>
        this.uploadFile(bucketName, path, file, options)
      );

      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('❌ Upload multiple files error:', error);
      throw error;
    }
  }

  /**
   * Download a file from storage
   */
  async downloadFile(
    bucketName: keyof typeof supabaseConfig.buckets,
    path: string
  ): Promise<DownloadResult> {
    try {
      const bucket = supabaseConfig.buckets[bucketName];
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        console.error(`❌ Download from ${bucket} error:`, error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Download file error:', error);
      return { data: null, error: error as StorageError };
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(
    bucketName: keyof typeof supabaseConfig.buckets,
    path: string
  ): string {
    const bucket = supabaseConfig.buckets[bucketName];
    
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Get signed URL for private files
   */
  async getSignedUrl(
    bucketName: keyof typeof supabaseConfig.buckets,
    path: string,
    expiresIn: number = 3600
  ): Promise<string | null> {
    try {
      const bucket = supabaseConfig.buckets[bucketName];
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error(`❌ Get signed URL error:`, error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('❌ Get signed URL error:', error);
      return null;
    }
  }

  /**
   * List files in a bucket
   */
  async listFiles(
    bucketName: keyof typeof supabaseConfig.buckets,
    path?: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    }
  ): Promise<FileInfo[]> {
    try {
      const bucket = supabaseConfig.buckets[bucketName];
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, {
          limit: options?.limit,
          offset: options?.offset,
          sortBy: options?.sortBy,
        });

      if (error) {
        console.error(`❌ List files in ${bucket} error:`, error);
        return [];
      }

      return data.map(file => ({
        name: file.name,
        id: file.id || '',
        updated_at: file.updated_at || '',
        created_at: file.created_at || '',
        last_accessed_at: file.last_accessed_at || '',
        metadata: file.metadata || {},
        size: file.size || 0,
        mimetype: file.mimetype || '',
      }));
    } catch (error) {
      console.error('❌ List files error:', error);
      return [];
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(
    bucketName: keyof typeof supabaseConfig.buckets,
    path: string
  ): Promise<{ error: StorageError | null }> {
    try {
      const bucket = supabaseConfig.buckets[bucketName];
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error(`❌ Delete file from ${bucket} error:`, error);
        return { error };
      }

      console.log(`✅ File deleted successfully from ${bucket}:`, path);
      return { error: null };
    } catch (error) {
      console.error('❌ Delete file error:', error);
      return { error: error as StorageError };
    }
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(
    bucketName: keyof typeof supabaseConfig.buckets,
    paths: string[]
  ): Promise<{ error: StorageError | null }> {
    try {
      const bucket = supabaseConfig.buckets[bucketName];
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove(paths);

      if (error) {
        console.error(`❌ Delete files from ${bucket} error:`, error);
        return { error };
      }

      console.log(`✅ Files deleted successfully from ${bucket}:`, paths.length);
      return { error: null };
    } catch (error) {
      console.error('❌ Delete files error:', error);
      return { error: error as StorageError };
    }
  }

  /**
   * Move/rename a file
   */
  async moveFile(
    bucketName: keyof typeof supabaseConfig.buckets,
    fromPath: string,
    toPath: string
  ): Promise<{ error: StorageError | null }> {
    try {
      const bucket = supabaseConfig.buckets[bucketName];
      
      const { error } = await supabase.storage
        .from(bucket)
        .move(fromPath, toPath);

      if (error) {
        console.error(`❌ Move file in ${bucket} error:`, error);
        return { error };
      }

      console.log(`✅ File moved successfully in ${bucket}: ${fromPath} → ${toPath}`);
      return { error: null };
    } catch (error) {
      console.error('❌ Move file error:', error);
      return { error: error as StorageError };
    }
  }

  /**
   * Copy a file
   */
  async copyFile(
    bucketName: keyof typeof supabaseConfig.buckets,
    fromPath: string,
    toPath: string
  ): Promise<{ error: StorageError | null }> {
    try {
      const bucket = supabaseConfig.buckets[bucketName];
      
      const { error } = await supabase.storage
        .from(bucket)
        .copy(fromPath, toPath);

      if (error) {
        console.error(`❌ Copy file in ${bucket} error:`, error);
        return { error };
      }

      console.log(`✅ File copied successfully in ${bucket}: ${fromPath} → ${toPath}`);
      return { error: null };
    } catch (error) {
      console.error('❌ Copy file error:', error);
      return { error: error as StorageError };
    }
  }

  /**
   * Create a bucket
   */
  async createBucket(
    bucketName: string,
    options?: {
      public?: boolean;
      allowedMimeTypes?: string[];
      fileSizeLimit?: number;
    }
  ): Promise<{ error: StorageError | null }> {
    try {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: options?.public || false,
        allowedMimeTypes: options?.allowedMimeTypes,
        fileSizeLimit: options?.fileSizeLimit,
      });

      if (error) {
        console.error(`❌ Create bucket ${bucketName} error:`, error);
        return { error };
      }

      console.log(`✅ Bucket created successfully: ${bucketName}`);
      return { error: null };
    } catch (error) {
      console.error('❌ Create bucket error:', error);
      return { error: error as StorageError };
    }
  }

  /**
   * Delete a bucket
   */
  async deleteBucket(bucketName: string): Promise<{ error: StorageError | null }> {
    try {
      const { error } = await supabase.storage.deleteBucket(bucketName);

      if (error) {
        console.error(`❌ Delete bucket ${bucketName} error:`, error);
        return { error };
      }

      console.log(`✅ Bucket deleted successfully: ${bucketName}`);
      return { error: null };
    } catch (error) {
      console.error('❌ Delete bucket error:', error);
      return { error: error as StorageError };
    }
  }

  /**
   * Get bucket details
   */
  async getBucket(bucketName: string) {
    try {
      const { data, error } = await supabase.storage.getBucket(bucketName);

      if (error) {
        console.error(`❌ Get bucket ${bucketName} error:`, error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Get bucket error:', error);
      return null;
    }
  }

  /**
   * List all buckets
   */
  async listBuckets() {
    try {
      const { data, error } = await supabase.storage.listBuckets();

      if (error) {
        console.error('❌ List buckets error:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('❌ List buckets error:', error);
      return [];
    }
  }

  /**
   * Helper: Generate unique file path
   */
  generateFilePath(userId: string, originalName: string, folder?: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const baseName = originalName.split('.').slice(0, -1).join('.');
    
    const fileName = `${baseName}_${timestamp}_${randomStr}.${extension}`;
    
    if (folder) {
      return `${folder}/${userId}/${fileName}`;
    }
    
    return `${userId}/${fileName}`;
  }

  /**
   * Helper: Get file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Helper: Validate file type
   */
  isValidFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  /**
   * Helper: Validate file size
   */
  isValidFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }
}

// Export singleton instance
export const storageService = new SupabaseStorageService();
export default storageService;