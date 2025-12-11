import { v4 as uuidv4 } from 'uuid';
import { 
  MaterialType, 
  MaterialMetadata,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZES,
  FILE_MAGIC_NUMBERS,
  UploadResponse,
  ListMaterialsResponse
} from '../types/index.js';
import { createLogger } from '../utils/index.js';

const logger = createLogger('material-service');

// In-memory storage (replace with S3/OSS in production)
const materials: Map<string, MaterialMetadata> = new Map();
const userMaterialsIndex: Map<string, Set<string>> = new Map(); // userId -> materialIds

/**
 * Validate MIME type against allowed types
 */
export const validateMimeType = (mimeType: string, materialType: MaterialType): boolean => {
  const allowed = ALLOWED_MIME_TYPES[materialType];
  return allowed.includes(mimeType);
};

/**
 * Validate file magic number to ensure file type authenticity
 * This prevents file extension spoofing attacks
 */
export const validateMagicNumber = (buffer: Buffer, declaredMimeType: string): boolean => {
  const signatures = FILE_MAGIC_NUMBERS[declaredMimeType];
  if (!signatures) {
    // SVG doesn't have a magic number, validate differently
    if (declaredMimeType === 'image/svg+xml') {
      const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1000));
      return content.includes('<svg') && content.includes('xmlns');
    }
    return false;
  }

  // Check if buffer starts with any of the valid signatures
  for (const signature of signatures) {
    if (buffer.length >= signature.length) {
      let matches = true;
      for (let i = 0; i < signature.length; i++) {
        if (buffer[i] !== signature[i]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
  }

  // Special case for MP4 - check for 'ftyp' at offset 4
  if (declaredMimeType === 'video/mp4' && buffer.length >= 8) {
    const ftyp = buffer.toString('ascii', 4, 8);
    if (ftyp === 'ftyp') return true;
  }

  return false;
};

/**
 * Validate file size against limits
 */
export const validateFileSize = (size: number, materialType: MaterialType): boolean => {
  return size <= MAX_FILE_SIZES[materialType];
};

/**
 * Get material type from MIME type
 */
export const getMaterialTypeFromMime = (mimeType: string): MaterialType | null => {
  for (const [type, mimes] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (mimes.includes(mimeType)) {
      return type as MaterialType;
    }
  }
  return null;
};

/**
 * Sanitize SVG content to remove potentially harmful elements
 * This provides basic XSS protection for SVG files
 */
export const sanitizeSvg = (content: string): string => {
  // Remove script tags and event handlers
  let sanitized = content;
  
  // Remove <script> tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: URLs with scripts
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  return sanitized;
};

/**
 * Process and store an uploaded file
 * In production, this would stream to S3/OSS
 */
export const processUpload = async (
  userId: string,
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  declaredType?: MaterialType
): Promise<UploadResponse> => {
  logger.info('Processing upload', { userId, originalName, mimeType, size: buffer.length });

  // Determine material type
  let materialType = declaredType || getMaterialTypeFromMime(mimeType);
  if (!materialType) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  // Validate MIME type
  if (!validateMimeType(mimeType, materialType)) {
    throw new Error(`Invalid MIME type ${mimeType} for material type ${materialType}`);
  }

  // Validate file size
  if (!validateFileSize(buffer.length, materialType)) {
    const maxSizeMB = MAX_FILE_SIZES[materialType] / (1024 * 1024);
    throw new Error(`File too large. Maximum size for ${materialType} is ${maxSizeMB}MB`);
  }

  // Validate magic number (file signature)
  if (!validateMagicNumber(buffer, mimeType)) {
    logger.warn('Magic number validation failed', { userId, originalName, mimeType });
    throw new Error('File content does not match declared type. Possible file spoofing detected.');
  }

  // Sanitize SVG if needed
  let processedBuffer = buffer;
  if (materialType === MaterialType.SVG) {
    const sanitizedContent = sanitizeSvg(buffer.toString('utf8'));
    processedBuffer = Buffer.from(sanitizedContent, 'utf8');
  }

  // Generate unique filename
  const id = uuidv4();
  const extension = originalName.split('.').pop() || 'bin';
  const filename = `${id}.${extension}`;

  // In production, upload to S3/OSS here
  // For now, we store metadata only (file would be stored externally)
  const url = `/uploads/${userId}/${filename}`;

  const metadata: MaterialMetadata = {
    id,
    userId,
    type: materialType,
    filename,
    originalName,
    mimeType,
    size: processedBuffer.length,
    url,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Store material metadata
  materials.set(id, metadata);

  // Update user index
  if (!userMaterialsIndex.has(userId)) {
    userMaterialsIndex.set(userId, new Set());
  }
  userMaterialsIndex.get(userId)!.add(id);

  logger.info('Upload processed successfully', { 
    id, 
    userId, 
    type: materialType, 
    size: processedBuffer.length 
  });

  return {
    id,
    url,
    type: materialType,
    filename,
    size: processedBuffer.length,
  };
};

/**
 * Get material by ID
 */
export const getMaterialById = (id: string): MaterialMetadata | null => {
  return materials.get(id) || null;
};

/**
 * List materials for a user
 */
export const listUserMaterials = (
  userId: string,
  type?: MaterialType,
  page: number = 1,
  limit: number = 20
): ListMaterialsResponse => {
  const userMaterialIds = userMaterialsIndex.get(userId);
  if (!userMaterialIds) {
    return {
      materials: [],
      total: 0,
      page,
      limit,
      hasMore: false,
    };
  }

  let userMaterials = Array.from(userMaterialIds)
    .map(id => materials.get(id)!)
    .filter(m => m !== undefined);

  // Filter by type if specified
  if (type) {
    userMaterials = userMaterials.filter(m => m.type === type);
  }

  // Sort by creation date (newest first)
  userMaterials.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = userMaterials.length;
  const offset = (page - 1) * limit;
  const paged = userMaterials.slice(offset, offset + limit);

  return {
    materials: paged,
    total,
    page,
    limit,
    hasMore: offset + paged.length < total,
  };
};

/**
 * Delete material
 */
export const deleteMaterial = (id: string, userId: string): boolean => {
  const material = materials.get(id);
  if (!material || material.userId !== userId) {
    return false;
  }

  // In production, also delete from S3/OSS
  materials.delete(id);
  userMaterialsIndex.get(userId)?.delete(id);

  logger.info('Material deleted', { id, userId });
  return true;
};

/**
 * Get presigned URL for direct upload (for large files)
 * In production, this would generate a presigned S3/OSS URL
 */
export const getPresignedUploadUrl = async (
  userId: string,
  filename: string,
  mimeType: string,
  size: number
): Promise<{ uploadUrl: string; materialId: string }> => {
  const materialType = getMaterialTypeFromMime(mimeType);
  if (!materialType) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  if (!validateFileSize(size, materialType)) {
    const maxSizeMB = MAX_FILE_SIZES[materialType] / (1024 * 1024);
    throw new Error(`File too large. Maximum size for ${materialType} is ${maxSizeMB}MB`);
  }

  const id = uuidv4();
  
  // In production, generate presigned S3/OSS URL
  const uploadUrl = `/uploads/presigned/${userId}/${id}/${filename}`;

  logger.info('Generated presigned URL', { userId, materialId: id, filename });

  return {
    uploadUrl,
    materialId: id,
  };
};
