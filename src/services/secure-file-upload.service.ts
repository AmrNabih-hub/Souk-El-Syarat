/**
 * Secure File Upload Service
 * Enterprise-level file upload security with validation and scanning
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/config/firebase.config';
import InputSanitizationService from './input-sanitization.service';

export interface FileUploadResult {
  success: boolean;
  url?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  errors: string[];
  warnings: string[];
}

export interface FileValidationRules {
  maxSize: number; // in bytes
  allowedTypes: string[];
  allowedExtensions: string[];
  scanForMalware: boolean;
  requireVirusScan: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class SecureFileUploadService {
  private static readonly DEFAULT_IMAGE_RULES: FileValidationRules = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    scanForMalware: true,
    requireVirusScan: true
  };

  private static readonly DEFAULT_DOCUMENT_RULES: FileValidationRules = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ],
    allowedExtensions: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    scanForMalware: true,
    requireVirusScan: true
  };

  private static readonly DANGEROUS_EXTENSIONS = [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
    'php', 'asp', 'aspx', 'jsp', 'py', 'rb', 'pl', 'sh', 'ps1'
  ];

  private static readonly MALWARE_SIGNATURES = [
    /eval\s*\(/gi,
    /document\.write/gi,
    /window\.location/gi,
    /<script/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
  ];

  /**
   * Upload image file with security validation
   */
  static async uploadImage(
    file: File,
    path: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileUploadResult> {
    return this.uploadFile(file, path, userId, this.DEFAULT_IMAGE_RULES, onProgress);
  }

  /**
   * Upload document file with security validation
   */
  static async uploadDocument(
    file: File,
    path: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileUploadResult> {
    return this.uploadFile(file, path, userId, this.DEFAULT_DOCUMENT_RULES, onProgress);
  }

  /**
   * Main file upload method with comprehensive security
   */
  static async uploadFile(
    file: File,
    path: string,
    userId: string,
    rules: FileValidationRules,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileUploadResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Step 1: Basic file validation
      const basicValidation = await this.validateBasicFile(file, rules);
      if (!basicValidation.isValid) {
        return {
          success: false,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          errors: basicValidation.errors,
          warnings: basicValidation.warnings
        };
      }

      errors.push(...basicValidation.errors);
      warnings.push(...basicValidation.warnings);

      // Step 2: Security validation
      const securityValidation = await this.validateFileSecurity(file);
      if (!securityValidation.isValid) {
        return {
          success: false,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          errors: [...errors, ...securityValidation.errors],
          warnings: [...warnings, ...securityValidation.warnings]
        };
      }

      errors.push(...securityValidation.errors);
      warnings.push(...securityValidation.warnings);

      // Step 3: Malware scanning
      if (rules.scanForMalware) {
        const malwareScan = await this.scanFileForMalware(file);
        if (!malwareScan.isClean) {
          if (rules.requireVirusScan) {
            return {
              success: false,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              errors: [...errors, ...malwareScan.threats],
              warnings: [...warnings, ...malwareScan.warnings]
            };
          } else {
            warnings.push(...malwareScan.threats);
          }
        }
      }

      // Step 4: Generate secure filename
      const secureFileName = this.generateSecureFileName(file.name, userId);
      const fullPath = `${path}/${secureFileName}`;

      // Step 5: Upload to Firebase Storage
      const storageRef = ref(storage, fullPath);
      
      // Create upload task with progress tracking
      const uploadTask = uploadBytes(storageRef, file);
      
      // Monitor upload progress
      if (onProgress) {
        uploadTask.on('state_changed', (snapshot) => {
          const progress = {
            loaded: snapshot.bytesTransferred,
            total: snapshot.totalBytes,
            percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          };
          onProgress(progress);
        });
      }

      await uploadTask;
      const downloadURL = await getDownloadURL(storageRef);

      // Step 6: Log successful upload
      await this.logFileUpload(userId, file.name, fullPath, 'success');

      return {
        success: true,
        url: downloadURL,
        fileName: secureFileName,
        fileSize: file.size,
        fileType: file.type,
        errors: [],
        warnings
      };

    } catch (error: any) {
      console.error('File upload error:', error);
      
      // Log failed upload
      await this.logFileUpload(userId, file.name, path, 'error', error.message);

      return {
        success: false,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        errors: [...errors, `Upload failed: ${error.message}`],
        warnings
      };
    }
  }

  /**
   * Validate basic file properties
   */
  private static async validateBasicFile(
    file: File,
    rules: FileValidationRules
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size > rules.maxSize) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(rules.maxSize)})`);
    }

    // Check file type
    if (!rules.allowedTypes.includes(file.type)) {
      errors.push(`File type '${file.type}' is not allowed. Allowed types: ${rules.allowedTypes.join(', ')}`);
    }

    // Check file extension
    const extension = this.getFileExtension(file.name).toLowerCase();
    if (!rules.allowedExtensions.includes(extension)) {
      errors.push(`File extension '.${extension}' is not allowed. Allowed extensions: ${rules.allowedExtensions.join(', ')}`);
    }

    // Check for dangerous extensions
    if (this.DANGEROUS_EXTENSIONS.includes(extension)) {
      errors.push(`File extension '.${extension}' is potentially dangerous and not allowed`);
    }

    // Check filename length
    if (file.name.length > 255) {
      errors.push('Filename is too long (maximum 255 characters)');
    }

    // Check for suspicious characters in filename
    if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
      warnings.push('Filename contains special characters that may cause issues');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate file security
   */
  private static async validateFileSecurity(file: File): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Read file content for analysis
    const content = await this.readFileContent(file);

    // Check for suspicious patterns
    for (const pattern of this.MALWARE_SIGNATURES) {
      if (pattern.test(content)) {
        errors.push(`Suspicious content detected: ${pattern.source}`);
      }
    }

    // Check for executable signatures
    if (this.hasExecutableSignature(content)) {
      errors.push('File appears to contain executable code');
    }

    // Check for embedded scripts
    if (this.hasEmbeddedScripts(content)) {
      warnings.push('File may contain embedded scripts');
    }

    // Check file header
    const header = content.substring(0, 100);
    if (this.hasSuspiciousHeader(header)) {
      errors.push('File has suspicious header signature');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Scan file for malware
   */
  private static async scanFileForMalware(file: File): Promise<{ isClean: boolean; threats: string[]; warnings: string[] }> {
    const threats: string[] = [];
    const warnings: string[] = [];

    try {
      // Read file content
      const content = await this.readFileContent(file);

      // Check for known malware patterns
      const malwarePatterns = [
        /eval\s*\(/gi,
        /document\.write/gi,
        /window\.location/gi,
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload\s*=/gi,
        /onerror\s*=/gi,
        /onclick\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
      ];

      for (const pattern of malwarePatterns) {
        if (pattern.test(content)) {
          threats.push(`Malware pattern detected: ${pattern.source}`);
        }
      }

      // Check for suspicious file combinations
      if (file.type.startsWith('image/') && content.includes('<script')) {
        threats.push('Image file contains script tags');
      }

      // Check for data URIs
      if (content.includes('data:')) {
        warnings.push('File contains data URIs which may be suspicious');
      }

      // Check for external references
      if (content.includes('http://') || content.includes('https://')) {
        warnings.push('File contains external references');
      }

      return {
        isClean: threats.length === 0,
        threats,
        warnings
      };

    } catch (error) {
      console.error('Malware scan error:', error);
      return {
        isClean: false,
        threats: ['Unable to scan file for malware'],
        warnings: []
      };
    }
  }

  /**
   * Generate secure filename
   */
  private static generateSecureFileName(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = this.getFileExtension(originalName);
    
    // Sanitize filename
    const sanitizedName = InputSanitizationService.sanitizeString(originalName).sanitizedValue;
    const cleanName = sanitizedName.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    return `${userId}_${timestamp}_${randomString}_${cleanName}.${extension}`;
  }

  /**
   * Get file extension
   */
  private static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Format file size
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Read file content as text
   */
  private static async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  /**
   * Check for executable signatures
   */
  private static hasExecutableSignature(content: string): boolean {
    const executableSignatures = [
      'MZ', // DOS/Windows executable
      'PE', // Portable Executable
      'ELF', // Linux executable
      '#!/', // Shell script
      '<?php', // PHP script
      '<%', // ASP script
    ];

    return executableSignatures.some(sig => content.startsWith(sig));
  }

  /**
   * Check for embedded scripts
   */
  private static hasEmbeddedScripts(content: string): boolean {
    return /<script|javascript:|vbscript:|on\w+\s*=/gi.test(content);
  }

  /**
   * Check for suspicious header
   */
  private static hasSuspiciousHeader(header: string): boolean {
    const suspiciousHeaders = [
      'MZ', 'PE', 'ELF', '#!/', '<?php', '<%', 'eval(', 'document.write'
    ];

    return suspiciousHeaders.some(sig => header.includes(sig));
  }

  /**
   * Delete uploaded file
   */
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Log file upload activity
   */
  private static async logFileUpload(
    userId: string,
    fileName: string,
    filePath: string,
    status: 'success' | 'error',
    errorMessage?: string
  ): Promise<void> {
    try {
      const logEntry = {
        userId,
        fileName,
        filePath,
        status,
        errorMessage,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      // Store in Firestore for audit trail
      // This would be implemented with your Firestore service
      console.log('File upload log:', logEntry);
    } catch (error) {
      console.error('Error logging file upload:', error);
    }
  }

  /**
   * Get file upload statistics
   */
  static async getUploadStatistics(userId: string): Promise<{
    totalUploads: number;
    totalSize: number;
    recentUploads: any[];
  }> {
    // This would query your database for upload statistics
    return {
      totalUploads: 0,
      totalSize: 0,
      recentUploads: []
    };
  }
}

export default SecureFileUploadService;