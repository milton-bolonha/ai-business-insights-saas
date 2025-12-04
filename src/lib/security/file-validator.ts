/**
 * Secure File Handling
 * 
 * Validates file uploads for security:
 * - File type validation
 * - Size limits
 * - Filename sanitization
 * - Renaming to prevent path traversal
 * 
 * Security: Never trust user-provided filenames
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
  mimeType?: string;
}

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

// Default file size limit: 10MB
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

// Default allowed types for CSV uploads
const DEFAULT_ALLOWED_TYPES = [
  "text/csv",
  "application/csv",
  "text/plain",
];

const DEFAULT_ALLOWED_EXTENSIONS = [".csv", ".txt"];

/**
 * Validate file type by MIME type
 */
function validateMimeType(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file extension
 */
function validateExtension(
  filename: string,
  allowedExtensions: string[]
): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return allowedExtensions.includes(ext);
}

/**
 * Sanitize filename to prevent path traversal and injection
 * 
 * Security: Remove dangerous characters and normalize
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and dangerous characters
  let sanitized = filename
    .replace(/[\/\\]/g, "") // Remove path separators
    .replace(/\.\./g, "") // Remove parent directory references
    .replace(/[<>:"|?*]/g, "") // Remove Windows reserved characters
    .trim();

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf("."));
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }

  // If empty after sanitization, use default
  if (!sanitized || sanitized.length === 0) {
    sanitized = `file_${Date.now()}.csv`;
  }

  return sanitized;
}

/**
 * Generate safe filename with timestamp
 * Prevents collisions and ensures uniqueness
 */
export function generateSafeFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  const ext = sanitized.substring(sanitized.lastIndexOf("."));
  const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf(".")) || "file";
  
  return `${nameWithoutExt}_${timestamp}_${random}${ext}`;
}

/**
 * Validate file upload
 * 
 * Security: Comprehensive validation before processing
 */
export async function validateFile(
  file: File,
  options: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const {
    maxSizeBytes = DEFAULT_MAX_SIZE,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    allowedExtensions = DEFAULT_ALLOWED_EXTENSIONS,
  } = options;

  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds limit of ${Math.round(maxSizeBytes / 1024 / 1024)}MB`,
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty",
    };
  }

  // Validate MIME type
  if (!validateMimeType(file.type, allowedTypes)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  // Validate extension
  if (!validateExtension(file.name, allowedExtensions)) {
    return {
      valid: false,
      error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(", ")}`,
    };
  }

  // Sanitize filename
  const sanitizedFilename = generateSafeFilename(file.name);

  return {
    valid: true,
    sanitizedFilename,
    mimeType: file.type,
  };
}

/**
 * Validate multiple files
 */
export async function validateFiles(
  files: File[],
  options: FileValidationOptions = {}
): Promise<{ valid: File[]; invalid: Array<{ file: File; error: string }> }> {
  const valid: File[] = [];
  const invalid: Array<{ file: File; error: string }> = [];

  for (const file of files) {
    const result = await validateFile(file, options);
    if (result.valid && result.sanitizedFilename) {
      // Create new File with sanitized name
      const sanitizedFile = new File([file], result.sanitizedFilename, {
        type: file.type,
      });
      valid.push(sanitizedFile);
    } else {
      invalid.push({
        file,
        error: result.error || "Validation failed",
      });
    }
  }

  return { valid, invalid };
}

