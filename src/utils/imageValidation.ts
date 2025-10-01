interface ImageValidationOptions {
  minImages?: number;
  maxImages?: number;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  language?: 'ar' | 'en';
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateImageUpload = (
  files: FileList | null, 
  options: ImageValidationOptions = {}
): ValidationResult => {
  const {
    minImages = 1,
    maxImages = 10,
    maxFileSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    language = 'ar'
  } = options;

  const errors: string[] = [];
  
  if (!files || files.length === 0) {
    errors.push(
      language === 'ar' 
        ? `يجب رفع صورة واحدة على الأقل` 
        : `Please upload at least one image`
    );
    return { isValid: false, errors };
  }

  if (files.length < minImages) {
    errors.push(
      language === 'ar' 
        ? `يجب رفع ${minImages} صور على الأقل` 
        : `Please upload at least ${minImages} images`
    );
  }

  if (files.length > maxImages) {
    errors.push(
      language === 'ar' 
        ? `يمكن رفع ${maxImages} صور كحد أقصى` 
        : `You can upload maximum ${maxImages} images`
    );
  }

  Array.from(files).forEach((file, index) => {
    // File type validation
    if (!allowedTypes.includes(file.type)) {
      errors.push(
        language === 'ar' 
          ? `الملف ${index + 1} ليس صورة صالحة (JPEG, PNG, WebP فقط)` 
          : `File ${index + 1} is not a valid image (JPEG, PNG, WebP only)`
      );
    }

    // File size validation
    if (file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
      errors.push(
        language === 'ar' 
          ? `الملف ${index + 1} كبير جداً (الحد الأقصى ${maxSizeMB} ميجابايت)` 
          : `File ${index + 1} is too large (max ${maxSizeMB}MB)`
      );
    }

    // File name validation (basic)
    if (file.name.length > 100) {
      errors.push(
        language === 'ar' 
          ? `اسم الملف ${index + 1} طويل جداً` 
          : `File ${index + 1} name is too long`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSingleImage = (
  file: File,
  options: Omit<ImageValidationOptions, 'minImages' | 'maxImages'> = {}
): ValidationResult => {
  const {
    maxFileSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    language = 'ar'
  } = options;

  const errors: string[] = [];

  // File type validation
  if (!allowedTypes.includes(file.type)) {
    errors.push(
      language === 'ar' 
        ? 'الملف ليس صورة صالحة (JPEG, PNG, WebP فقط)' 
        : 'File is not a valid image (JPEG, PNG, WebP only)'
    );
  }

  // File size validation
  if (file.size > maxFileSize) {
    const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
    errors.push(
      language === 'ar' 
        ? `الملف كبير جداً (الحد الأقصى ${maxSizeMB} ميجابايت)` 
        : `File is too large (max ${maxSizeMB}MB)`
    );
  }

  // File name validation
  if (file.name.length > 100) {
    errors.push(
      language === 'ar' 
        ? 'اسم الملف طويل جداً' 
        : 'File name is too long'
    );
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const getImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const compressImage = (file: File, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions (max 1920px width)
      const maxWidth = 1920;
      const maxHeight = 1080;
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
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
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};
