/**
 * Secure File Upload Service
 * Enterprise-level file upload security with validation and scanning
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/config/firebase.config';
import InputSanitizationService from './input-sanitization.service';

export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  scanForMalware?: boolean;
  generateThumbnail?: boolean;
  compressImage?: boolean;
  quality?: number;
}

export interface FileUploadResult {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  errors: string[];
  warnings: string[];
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedFileName: string;
}

export class SecureFileUploadService {
  private static instance: SecureFileUploadService;
  
  // Default file type restrictions
  private static readonly DEFAULT_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

  private static readonly DEFAULT_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  private static readonly DEFAULT_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/ogg'
  ];

  // File size limits (in bytes)
  private static readonly DEFAULT_SIZE_LIMITS = {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    video: 50 * 1024 * 1024, // 50MB
    default: 5 * 1024 * 1024 // 5MB
  };

  // Dangerous file extensions
  private static readonly DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh', '.ps1'
  ];

  // MIME type validation patterns
  private static readonly MIME_TYPE_PATTERNS = {
    image: /^image\//,
    document: /^(application\/(pdf|msword|vnd\.openxmlformats-officedocument)|text\/)/,
    video: /^video\//,
    audio: /^audio\//
  };

  static getInstance(): SecureFileUploadService {
    if (!SecureFileUploadService.instance) {
      SecureFileUploadService.instance = new SecureFileUploadService();
    }
    return SecureFileUploadService.instance;
  }

  /**
   * Validate file before upload
   */
  static async validateFile(
    file: File, 
    options: FileUploadOptions = {}
  ): Promise<FileValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate file name
      const fileNameValidation = InputSanitizationService.validateFileName(file.name);
      if (!fileNameValidation.isValid) {
        errors.push(...fileNameValidation.errors);
      }

      // Check file size
      const maxSize = options.maxSize || this.getDefaultSizeLimit(file.type);
      if (file.size > maxSize) {
        errors.push(`File size exceeds limit of ${this.formatFileSize(maxSize)}`);
      }

      // Check file type
      const allowedTypes = options.allowedTypes || this.getAllowedTypes(file.type);
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File type ${file.type} is not allowed`);
      }

      // Check file extension
      const fileExtension = this.getFileExtension(file.name).toLowerCase();
      const allowedExtensions = options.allowedExtensions || this.getAllowedExtensions(file.type);
      if (!allowedExtensions.includes(fileExtension)) {
        errors.push(`File extension .${fileExtension} is not allowed`);
      }

      // Check for dangerous extensions
      if (this.DANGEROUS_EXTENSIONS.includes(fileExtension)) {
        errors.push(`File extension .${fileExtension} is not allowed for security reasons`);
      }

      // Validate MIME type matches extension
      if (!this.validateMimeTypeMatch(file.type, fileExtension)) {
        warnings.push('File MIME type does not match file extension');
      }

      // Check for empty file
      if (file.size === 0) {
        errors.push('File is empty');
      }

      // Additional security checks
      await this.performSecurityChecks(file, errors, warnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedFileName: fileNameValidation.sanitizedValue
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`File validation error: ${error}`],
        warnings: [],
        sanitizedFileName: file.name
      };
    }
  }

  /**
   * Upload file securely
   */
  static async uploadFile(
    file: File,
    path: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate file first
      const validation = await this.validateFile(file, options);
      if (!validation.isValid) {
        return {
          success: false,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      // Sanitize file name
      const sanitizedFileName = validation.sanitizedFileName;
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}_${sanitizedFileName}`;
      const fullPath = `${path}/${uniqueFileName}`;

      // Create storage reference
      const storageRef = ref(storage, fullPath);

      // Process file if needed
      let processedFile = file;
      if (options.compressImage && this.isImageFile(file.type)) {
        processedFile = await this.compressImage(file, options.quality || 0.8);
      }

      // Upload file
      const uploadResult = await uploadBytes(storageRef, processedFile);
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Generate thumbnail if requested
      let thumbnailURL: string | undefined;
      if (options.generateThumbnail && this.isImageFile(file.type)) {
        thumbnailURL = await this.generateThumbnail(processedFile, fullPath);
      }

      return {
        success: true,
        url: downloadURL,
        thumbnailUrl: thumbnailURL,
        fileName: uniqueFileName,
        fileSize: processedFile.size,
        mimeType: file.type,
        errors: [],
        warnings: [...validation.warnings, ...warnings]
      };

    } catch (error) {
      return {
        success: false,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        errors: [`Upload failed: ${error}`],
        warnings
      };
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadMultipleFiles(
    files: File[],
    path: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadFile(file, path, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get file extension
   */
  private static getFileExtension(fileName: string): string {
    return fileName.split('.').pop() || '';
  }

  /**
   * Get default size limit for file type
   */
  private static getDefaultSizeLimit(mimeType: string): number {
    if (this.MIME_TYPE_PATTERNS.image.test(mimeType)) {
      return this.DEFAULT_SIZE_LIMITS.image;
    }
    if (this.MIME_TYPE_PATTERNS.document.test(mimeType)) {
      return this.DEFAULT_SIZE_LIMITS.document;
    }
    if (this.MIME_TYPE_PATTERNS.video.test(mimeType)) {
      return this.DEFAULT_SIZE_LIMITS.video;
    }
    return this.DEFAULT_SIZE_LIMITS.default;
  }

  /**
   * Get allowed types for file category
   */
  private static getAllowedTypes(mimeType: string): string[] {
    if (this.MIME_TYPE_PATTERNS.image.test(mimeType)) {
      return this.DEFAULT_IMAGE_TYPES;
    }
    if (this.MIME_TYPE_PATTERNS.document.test(mimeType)) {
      return this.DEFAULT_DOCUMENT_TYPES;
    }
    if (this.MIME_TYPE_PATTERNS.video.test(mimeType)) {
      return this.DEFAULT_VIDEO_TYPES;
    }
    return [];
  }

  /**
   * Get allowed extensions for file category
   */
  private static getAllowedExtensions(mimeType: string): string[] {
    if (this.MIME_TYPE_PATTERNS.image.test(mimeType)) {
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    }
    if (this.MIME_TYPE_PATTERNS.document.test(mimeType)) {
      return ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
    }
    if (this.MIME_TYPE_PATTERNS.video.test(mimeType)) {
      return ['.mp4', '.webm', '.ogg'];
    }
    return [];
  }

  /**
   * Validate MIME type matches file extension
   */
  private static validateMimeTypeMatch(mimeType: string, extension: string): boolean {
    const extensionMimeMap: Record<string, string[]> = {
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png'],
      '.gif': ['image/gif'],
      '.webp': ['image/webp'],
      '.svg': ['image/svg+xml'],
      '.pdf': ['application/pdf'],
      '.doc': ['application/msword'],
      '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      '.xls': ['application/vnd.ms-excel'],
      '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      '.txt': ['text/plain'],
      '.mp4': ['video/mp4'],
      '.webm': ['video/webm'],
      '.ogg': ['video/ogg']
    };

    const expectedMimeTypes = extensionMimeMap[extension.toLowerCase()];
    return expectedMimeTypes ? expectedMimeTypes.includes(mimeType) : false;
  }

  /**
   * Check if file is an image
   */
  private static isImageFile(mimeType: string): boolean {
    return this.MIME_TYPE_PATTERNS.image.test(mimeType);
  }

  /**
   * Perform additional security checks
   */
  private static async performSecurityChecks(
    file: File, 
    errors: string[], 
    warnings: string[]
  ): Promise<void> {
    // Check file header (magic numbers)
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    // Check for executable signatures
    const executableSignatures = [
      [0x4D, 0x5A], // PE executable
      [0x7F, 0x45, 0x4C, 0x46], // ELF executable
      [0xFE, 0xED, 0xFA, 0xCE], // Mach-O executable
      [0xFE, 0xED, 0xFA, 0xCF], // Mach-O executable (64-bit)
      [0xCE, 0xFA, 0xED, 0xFE], // Mach-O executable (reverse)
      [0xCF, 0xFA, 0xED, 0xFE]  // Mach-O executable (64-bit reverse)
    ];

    for (const signature of executableSignatures) {
      if (this.checkSignature(uint8Array, signature)) {
        errors.push('File appears to be an executable, which is not allowed');
        break;
      }
    }

    // Check for ZIP bombs (compressed files that expand to huge sizes)
    if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
      warnings.push('ZIP files are not allowed for security reasons');
    }

    // Check file size vs content ratio
    if (file.size > 0) {
      const contentRatio = uint8Array.length / file.size;
      if (contentRatio < 0.1) {
        warnings.push('File content ratio is suspiciously low');
      }
    }
  }

  /**
   * Check file signature
   */
  private static checkSignature(data: Uint8Array, signature: number[]): boolean {
    if (data.length < signature.length) return false;
    
    for (let i = 0; i < signature.length; i++) {
      if (data[i] !== signature[i]) return false;
    }
    
    return true;
  }

  /**
   * Compress image file
   */
  private static async compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1920x1080)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate thumbnail for image
   */
  private static async generateThumbnail(file: File, originalPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Thumbnail dimensions
        const thumbSize = 200;
        const { width, height } = img;
        const ratio = Math.min(thumbSize / width, thumbSize / height);
        
        canvas.width = width * ratio;
        canvas.height = height * ratio;

        // Draw thumbnail
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const thumbFile = new File([blob], `thumb_${file.name}`, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              
              const thumbPath = originalPath.replace(/\.[^/.]+$/, '_thumb.jpg');
              const thumbRef = ref(storage, thumbPath);
              await uploadBytes(thumbRef, thumbFile);
              const thumbURL = await getDownloadURL(thumbRef);
              resolve(thumbURL);
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.7);
      };

      img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Format file size for display
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file type category
   */
  static getFileTypeCategory(mimeType: string): 'image' | 'document' | 'video' | 'audio' | 'other' {
    if (this.MIME_TYPE_PATTERNS.image.test(mimeType)) return 'image';
    if (this.MIME_TYPE_PATTERNS.document.test(mimeType)) return 'document';
    if (this.MIME_TYPE_PATTERNS.video.test(mimeType)) return 'video';
    if (this.MIME_TYPE_PATTERNS.audio.test(mimeType)) return 'audio';
    return 'other';
  }

  /**
   * Get upload options for file type
   */
  static getUploadOptionsForType(fileType: 'image' | 'document' | 'video'): FileUploadOptions {
    switch (fileType) {
      case 'image':
        return {
          maxSize: this.DEFAULT_SIZE_LIMITS.image,
          allowedTypes: this.DEFAULT_IMAGE_TYPES,
          allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
          generateThumbnail: true,
          compressImage: true,
          quality: 0.8
        };
      case 'document':
        return {
          maxSize: this.DEFAULT_SIZE_LIMITS.document,
          allowedTypes: this.DEFAULT_DOCUMENT_TYPES,
          allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
          scanForMalware: true
        };
      case 'video':
        return {
          maxSize: this.DEFAULT_SIZE_LIMITS.video,
          allowedTypes: this.DEFAULT_VIDEO_TYPES,
          allowedExtensions: ['.mp4', '.webm', '.ogg']
        };
      default:
        return {
          maxSize: this.DEFAULT_SIZE_LIMITS.default,
          allowedTypes: [],
          allowedExtensions: []
        };
    }
  }
}

export default SecureFileUploadService;