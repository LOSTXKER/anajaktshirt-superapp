// =============================================
// COMMON TYPES
// =============================================

// ---------------------------------------------
// Base Entity (all entities extend this)
// ---------------------------------------------

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

// ---------------------------------------------
// Pagination
// ---------------------------------------------

export interface PaginationParams {
  page: number;
  limit: number;
  pageSize?: number; // Alias for limit
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Alias for backward compatibility
export interface Pagination {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount?: number; // Alias for pagination.total
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ---------------------------------------------
// Timestamps
// ---------------------------------------------

export interface Timestamps {
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface AuditFields extends Timestamps {
  created_by?: string;
  updated_by?: string;
  deleted_by?: string;
}

// ---------------------------------------------
// Address
// ---------------------------------------------

export interface Address {
  name?: string; // Recipient name
  phone?: string; // Contact phone
  address?: string;
  district?: string;
  province?: string;
  postal_code?: string;
  country?: string;
}

export interface ContactInfo {
  name?: string;
  phone?: string;
  email?: string;
  line_id?: string;
}

// ---------------------------------------------
// Money & Pricing
// ---------------------------------------------

export interface Money {
  amount: number;
  currency?: string;
}

export interface PricingBreakdown {
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  discount_reason?: string;
  surcharge_amount: number;
  surcharge_reason?: string;
  shipping_cost: number;
  tax_amount: number;
  tax_percent: number;
  total_amount: number;
}

// ---------------------------------------------
// File & Media
// ---------------------------------------------

export interface FileInfo {
  url: string;
  name?: string;
  size?: number;
  type?: string;
  uploaded_at?: string;
  uploaded_by?: string;
}

export interface ImageInfo extends FileInfo {
  thumbnail_url?: string;
  width?: number;
  height?: number;
}

// ---------------------------------------------
// User Reference (for display)
// ---------------------------------------------

export interface UserRef {
  id: string;
  full_name: string;
  name?: string; // Alias for full_name
  email?: string;
  avatar_url?: string;
}

// ---------------------------------------------
// Customer Reference (for display)
// ---------------------------------------------

export interface CustomerRef {
  id: string;
  code: string;
  name: string;
  company_name?: string;
  tier?: string;
  phone?: string;
}

// ---------------------------------------------
// Filter Base
// ---------------------------------------------

export interface BaseFilters {
  search?: string;
  date_from?: string;
  date_to?: string;
  created_by?: string;
}

// ---------------------------------------------
// Snapshot Pattern (for immutable historical data)
// ---------------------------------------------

export interface CustomerSnapshot {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  line_id?: string;
  tier?: string;
  address?: Address;
}

export interface ProductSnapshot {
  id: string;
  sku: string;
  name: string;
  model?: string;
  color?: string;
  size?: string;
  cost?: number;
  price?: number;
}

export interface SupplierSnapshot {
  id: string;
  code: string;
  name: string;
  contact_name?: string;
  phone?: string;
}

// ---------------------------------------------
// API Response Types
// ---------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface ApiListResponse<T> extends ApiResponse<T[]> {
  pagination?: PaginatedResult<T>['pagination'];
}

// ---------------------------------------------
// Action Result
// ---------------------------------------------

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string; // Single error message
  errors?: string[]; // Multiple error messages
}

// ---------------------------------------------
// Select Option (for dropdowns)
// ---------------------------------------------

export interface SelectOption<T = string> {
  value: T;
  label: string;
  label_th?: string;
  disabled?: boolean;
  meta?: Record<string, unknown>;
}

// ---------------------------------------------
// Table Column Config
// ---------------------------------------------

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  label_th?: string;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => React.ReactNode;
}

// ---------------------------------------------
// Form Field Config
// ---------------------------------------------

export interface FormField {
  name: string;
  label: string;
  label_th?: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'textarea' | 'select' | 'date' | 'datetime' | 'checkbox' | 'radio' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

