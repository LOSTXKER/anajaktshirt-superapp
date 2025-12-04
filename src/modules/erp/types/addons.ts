// =============================================
// ADDON TYPES
// =============================================

import type {
  AddonCategory,
  AddonPriceType,
  AddonStatus,
} from './enums';

import type {
  BaseEntity,
  BaseFilters,
} from './common';

// ---------------------------------------------
// Addon Type (Master Data)
// ---------------------------------------------

export interface AddonType extends BaseEntity {
  code: string;
  name: string;
  name_th: string;
  category: AddonCategory;

  // Pricing
  base_price: number;
  price_type: AddonPriceType;

  // Requirements
  requires_design: boolean;
  requires_material: boolean;
  material_lead_days: number;

  description?: string;
  sort_order: number;
  is_active: boolean;
}

// ---------------------------------------------
// Order Addon
// ---------------------------------------------

export interface OrderAddon extends BaseEntity {
  order_id: string;
  order_item_id?: string;

  // Addon Info
  addon_type_id?: string;
  addon_code: string;
  addon_name: string;
  addon_name_th?: string;
  category: AddonCategory;

  // Quantity & Price
  quantity: number;
  unit_price: number;
  total_price: number;

  // Status
  status: AddonStatus;

  // Design (if needed)
  requires_design: boolean;
  design_file_url?: string;
  design_status: string;
  design_approved_at?: string;

  // Material (if needed)
  requires_material: boolean;
  material_status: string;
  material_eta?: string;
  material_po_id?: string;

  // Attachment Info
  attached_by?: string;
  attached_at?: string;
  attachment_notes?: string;

  // QC
  qc_status?: string;
  qc_notes?: string;

  notes?: string;
  sort_order: number;
}

// ---------------------------------------------
// Addon Category Config
// ---------------------------------------------

export interface AddonCategoryConfig {
  code: AddonCategory;
  name: string;
  name_th: string;
  color: string;
  icon: string;
  description: string;
}

export const ADDON_CATEGORY_CONFIG: Record<AddonCategory, AddonCategoryConfig> = {
  packaging: {
    code: 'packaging',
    name: 'Packaging',
    name_th: 'บรรจุภัณฑ์',
    color: 'indigo',
    icon: 'package',
    description: 'ถุง กล่อง บรรจุภัณฑ์ต่างๆ',
  },
  labeling: {
    code: 'labeling',
    name: 'Labeling',
    name_th: 'ป้าย/แท็ก',
    color: 'amber',
    icon: 'tag',
    description: 'ป้ายแบรนด์ แท็กห้อย ป้ายซัก',
  },
  finishing: {
    code: 'finishing',
    name: 'Finishing',
    name_th: 'ตกแต่งสำเร็จ',
    color: 'pink',
    icon: 'sparkles',
    description: 'พับแพค รีด นึ่ง',
  },
  extra: {
    code: 'extra',
    name: 'Extra Services',
    name_th: 'บริการเสริม',
    color: 'purple',
    icon: 'plus-circle',
    description: 'บริการพิเศษอื่นๆ',
  },
};

// ---------------------------------------------
// Addon Pricing Tier
// ---------------------------------------------

export interface AddonPricingTier {
  addon_type_id: string;
  min_qty: number;
  max_qty?: number;
  unit_price: number;
}

// ---------------------------------------------
// Input Types
// ---------------------------------------------

export interface CreateAddonTypeInput {
  code: string;
  name: string;
  name_th: string;
  category: AddonCategory;

  base_price: number;
  price_type?: AddonPriceType;

  requires_design?: boolean;
  requires_material?: boolean;
  material_lead_days?: number;

  description?: string;
  sort_order?: number;
}

export interface AddOrderAddonInput {
  order_id: string;
  order_item_id?: string;

  addon_type_id?: string;
  addon_code: string;
  addon_name: string;
  addon_name_th?: string;

  quantity: number;
  unit_price: number;

  notes?: string;
}

export interface UpdateAddonStatusInput {
  addon_id: string;
  status: AddonStatus;
  notes?: string;
}

export interface AttachAddonInput {
  addon_id: string;
  attachment_notes?: string;
}

// ---------------------------------------------
// Filter Types
// ---------------------------------------------

export interface AddonTypeFilters extends BaseFilters {
  category?: AddonCategory;
  requires_design?: boolean;
  requires_material?: boolean;
  is_active?: boolean;
}

export interface OrderAddonFilters extends BaseFilters {
  order_id?: string;
  category?: AddonCategory;
  status?: AddonStatus;
  requires_design?: boolean;
  requires_material?: boolean;
}

// ---------------------------------------------
// Summary Types
// ---------------------------------------------

export interface AddonTypeSummary {
  id: string;
  code: string;
  name: string;
  name_th: string;
  category: AddonCategory;
  base_price: number;
  requires_design: boolean;
  requires_material: boolean;
}

export interface OrderAddonSummary {
  id: string;
  addon_name: string;
  category: AddonCategory;
  quantity: number;
  total_price: number;
  status: AddonStatus;
}

// ---------------------------------------------
// Stats Types
// ---------------------------------------------

export interface AddonStats {
  total_addons_sold: number;
  total_addon_revenue: number;
  most_popular: {
    addon_code: string;
    addon_name: string;
    count: number;
  }[];
  by_category: {
    category: AddonCategory;
    count: number;
    revenue: number;
  }[];
}

