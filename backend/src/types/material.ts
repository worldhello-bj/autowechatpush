import { z } from 'zod';

// Supported material types
export enum MaterialType {
  IMAGE = 'image',
  VIDEO = 'video',
  GIF = 'gif',
  SVG = 'svg',
}

// Allowed MIME types for security
export const ALLOWED_MIME_TYPES: Record<MaterialType, string[]> = {
  [MaterialType.IMAGE]: ['image/jpeg', 'image/png', 'image/webp'],
  [MaterialType.VIDEO]: ['video/mp4', 'video/webm'],
  [MaterialType.GIF]: ['image/gif'],
  [MaterialType.SVG]: ['image/svg+xml'],
};

// Maximum file sizes (in bytes)
export const MAX_FILE_SIZES: Record<MaterialType, number> = {
  [MaterialType.IMAGE]: 5 * 1024 * 1024,  // 5MB
  [MaterialType.VIDEO]: 50 * 1024 * 1024, // 50MB
  [MaterialType.GIF]: 10 * 1024 * 1024,   // 10MB
  [MaterialType.SVG]: 1 * 1024 * 1024,    // 1MB
};

// Magic numbers for file type validation
export const FILE_MAGIC_NUMBERS: Record<string, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
  'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])], // RIFF
  'image/gif': [Buffer.from([0x47, 0x49, 0x46, 0x38])],  // GIF8
  'video/mp4': [Buffer.from([0x00, 0x00, 0x00]), Buffer.from([0x66, 0x74, 0x79, 0x70])], // ftyp
  'video/webm': [Buffer.from([0x1A, 0x45, 0xDF, 0xA3])],
};

// Material metadata
export interface MaterialMetadata {
  id: string;
  userId: string;
  type: MaterialType;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

// Upload request schema
export const uploadRequestSchema = z.object({
  type: z.nativeEnum(MaterialType).default(MaterialType.IMAGE),
});

export type UploadRequest = z.infer<typeof uploadRequestSchema>;

// Upload response
export interface UploadResponse {
  id: string;
  url: string;
  type: MaterialType;
  filename: string;
  size: number;
}

// List materials request schema
export const listMaterialsSchema = z.object({
  type: z.nativeEnum(MaterialType).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type ListMaterialsRequest = z.infer<typeof listMaterialsSchema>;

// List materials response
export interface ListMaterialsResponse {
  materials: MaterialMetadata[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
