'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/modules/shared/utils/cn';
import { uploadFile, isImageFile, formatFileSize, type UploadBucket, type UploadResult } from '@/modules/shared/services/uploadService';

export interface FileUploadProps {
  bucket: UploadBucket;
  folder?: string;
  onUpload?: (result: UploadResult) => void;
  onRemove?: (url: string) => void;
  accept?: string; // e.g., 'image/*' or '.pdf,.doc'
  maxSizeMB?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
  value?: string | string[]; // Existing file URL(s)
}

interface FileWithPreview {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
  url?: string;
}

export function FileUpload({
  bucket,
  folder,
  onUpload,
  onRemove,
  accept = 'image/*',
  maxSizeMB = 5,
  multiple = false,
  disabled = false,
  className,
  label,
  description,
  value,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const existingUrls = value ? (Array.isArray(value) ? value : [value]) : [];

  const handleFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Create preview objects
    const newFileObjects: FileWithPreview[] = await Promise.all(
      fileArray.map(async (file) => {
        let preview = '';
        if (isImageFile(file)) {
          preview = URL.createObjectURL(file);
        }
        return {
          file,
          preview,
          uploading: true,
          uploaded: false,
        };
      })
    );

    setFiles(prev => multiple ? [...prev, ...newFileObjects] : newFileObjects);

    // Upload each file
    for (let i = 0; i < newFileObjects.length; i++) {
      const fileObj = newFileObjects[i];
      
      const result = await uploadFile(fileObj.file, {
        bucket,
        folder,
        maxSizeMB,
      });

      setFiles(prev => prev.map((f, idx) => {
        if (f.file === fileObj.file) {
          return {
            ...f,
            uploading: false,
            uploaded: result.success,
            error: result.error,
            url: result.url,
          };
        }
        return f;
      }));

      if (onUpload) {
        onUpload(result);
      }
    }
  }, [bucket, folder, maxSizeMB, multiple, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [disabled, handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      if (file.url && onRemove) {
        onRemove(file.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, [onRemove]);

  const removeExisting = useCallback((url: string) => {
    if (onRemove) {
      onRemove(url);
    }
  }, [onRemove]);

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="block text-sm font-medium text-[#1D1D1F]">{label}</label>
      )}

      {/* Drop Zone */}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
          isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-[#E8E8ED] hover:border-[#4a4a4a]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
        
        <Upload className={cn(
          'w-10 h-10 mx-auto mb-3',
          isDragging ? 'text-blue-500' : 'text-[#86868B]'
        )} />
        
        <p className="text-[#86868B] text-sm">
          {isDragging ? (
            'วางไฟล์ที่นี่'
          ) : (
            <>
              <span className="text-blue-400">คลิกเพื่อเลือกไฟล์</span> หรือลากไฟล์มาวาง
            </>
          )}
        </p>
        
        {description && (
          <p className="text-[#86868B] text-xs mt-1">{description}</p>
        )}
        
        <p className="text-[#86868B] text-xs mt-2">
          สูงสุด {maxSizeMB}MB • {accept}
        </p>
      </div>

      {/* Existing Files */}
      {existingUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {existingUrls.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-white border border-[#E8E8ED]">
                {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <File className="w-8 h-8 text-[#86868B]" />
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeExisting(url);
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-[#1D1D1F] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded/Uploading Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileObj, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                fileObj.error ? 'border-red-500/50 bg-red-500/10' : 
                fileObj.uploaded ? 'border-green-500/50 bg-green-500/10' : 
                'border-[#E8E8ED] bg-white'
              )}
            >
              {/* Preview */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F5F5F7] flex-shrink-0">
                {fileObj.preview ? (
                  <img src={fileObj.preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <File className="w-6 h-6 text-[#86868B]" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#1D1D1F] truncate">{fileObj.file.name}</p>
                <p className="text-xs text-[#86868B]">{formatFileSize(fileObj.file.size)}</p>
                {fileObj.error && (
                  <p className="text-xs text-red-400 mt-1">{fileObj.error}</p>
                )}
              </div>

              {/* Status */}
              <div className="flex-shrink-0">
                {fileObj.uploading ? (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                ) : fileObj.error ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : fileObj.uploaded ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : null}
              </div>

              {/* Remove */}
              {!fileObj.uploading && (
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-[#86868B] hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Single Image Upload with Preview
export interface ImageUploadProps {
  bucket: UploadBucket;
  folder?: string;
  value?: string;
  onChange?: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  maxSizeMB?: number;
}

export function ImageUpload({
  bucket,
  folder,
  value,
  onChange,
  disabled = false,
  className,
  label,
  aspectRatio = 'square',
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    const result = await uploadFile(file, {
      bucket,
      folder,
      maxSizeMB,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    });

    setUploading(false);

    if (result.success && result.url) {
      onChange?.(result.url);
    } else {
      setError(result.error || 'อัพโหลดไม่สำเร็จ');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange?.(null);
    setError(null);
  };

  const aspectClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  }[aspectRatio];

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-[#1D1D1F]">{label}</label>
      )}

      <div className={cn('relative', aspectClass)}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          disabled={disabled || uploading}
          className="hidden"
        />

        {value ? (
          // Image Preview
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-white border border-[#E8E8ED] group">
            <img src={value} alt="" className="w-full h-full object-cover" />
            
            {!disabled && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="px-3 py-1.5 bg-white/20 text-[#1D1D1F] rounded-lg text-sm hover:bg-white/30 transition-colors"
                >
                  เปลี่ยน
                </button>
                <button
                  onClick={handleRemove}
                  className="px-3 py-1.5 bg-red-500/80 text-[#1D1D1F] rounded-lg text-sm hover:bg-red-500 transition-colors"
                >
                  ลบ
                </button>
              </div>
            )}
          </div>
        ) : (
          // Upload Zone
          <button
            onClick={() => !disabled && inputRef.current?.click()}
            disabled={disabled || uploading}
            className={cn(
              'w-full h-full min-h-[120px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors',
              disabled ? 'border-[#E8E8ED] cursor-not-allowed' : 'border-[#E8E8ED] hover:border-blue-500 cursor-pointer'
            )}
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-[#86868B]" />
                <span className="text-sm text-[#86868B]">คลิกเพื่ออัพโหลดรูป</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

