'use client';

import { createClient } from './supabase-client';

export type UploadBucket = 'designs' | 'mockups' | 'slips' | 'attachments';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface UploadOptions {
  bucket: UploadBucket;
  folder?: string; // e.g., 'order-id/design-id'
  fileName?: string; // Custom file name (optional)
  maxSizeMB?: number; // Max file size in MB
  allowedTypes?: string[]; // e.g., ['image/jpeg', 'image/png']
}

const DEFAULT_OPTIONS: Partial<UploadOptions> = {
  maxSizeMB: 10,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
};

// Generate unique file name
function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'file';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}.${ext}`;
}

// Get file extension from MIME type
function getExtFromMime(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'image/svg+xml': 'svg',
  };
  return mimeMap[mimeType] || 'file';
}

// Upload a single file
export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  const supabase = createClient();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Validate file size
    const maxBytes = (opts.maxSizeMB || 10) * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        success: false,
        error: `ไฟล์ใหญ่เกินไป (สูงสุด ${opts.maxSizeMB}MB)`,
      };
    }

    // Validate file type
    if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `ไม่รองรับไฟล์ประเภทนี้ (รองรับ: ${opts.allowedTypes.join(', ')})`,
      };
    }

    // Generate file path
    const fileName = opts.fileName || generateFileName(file.name);
    const filePath = opts.folder ? `${opts.folder}/${fileName}` : fileName;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(opts.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message || 'อัพโหลดไม่สำเร็จ',
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(opts.bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (err: any) {
    console.error('Upload exception:', err);
    return {
      success: false,
      error: err.message || 'เกิดข้อผิดพลาดในการอัพโหลด',
    };
  }
}

// Upload multiple files
export async function uploadFiles(
  files: File[],
  options: UploadOptions
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  
  for (const file of files) {
    const result = await uploadFile(file, options);
    results.push(result);
  }
  
  return results;
}

// Delete a file
export async function deleteFile(
  bucket: UploadBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Get signed URL for private files (if needed)
export async function getSignedUrl(
  bucket: UploadBucket,
  path: string,
  expiresIn: number = 3600 // 1 hour
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      return { error: error.message };
    }

    return { url: data.signedUrl };
  } catch (err: any) {
    return { error: err.message };
  }
}

// Convert File to base64 (for preview)
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Check if file is an image
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

