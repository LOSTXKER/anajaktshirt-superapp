// CRM Module Types

export type CustomerType = 'individual' | 'company';
export type CustomerTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type CustomerStatus = 'active' | 'inactive' | 'blocked';
export type PaymentTerms = 'cash' | 'credit_7' | 'credit_15' | 'credit_30';
export type InteractionType = 'call' | 'email' | 'line' | 'visit' | 'order' | 'complaint' | 'note';

export interface Customer {
  id: string;
  code: string;
  name: string;
  type: CustomerType;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  line_id: string | null;
  address: string | null;
  district: string | null;
  province: string | null;
  postal_code: string | null;
  tax_id: string | null;
  credit_limit: number;
  payment_terms: PaymentTerms;
  tier: CustomerTier;
  total_orders: number;
  total_spent: number;
  status: CustomerStatus;
  notes: string | null;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  contacts?: CustomerContact[];
  interactions?: CustomerInteraction[];
}

export interface CustomerContact {
  id: string;
  customer_id: string;
  name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  line_id: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface CustomerInteraction {
  id: string;
  customer_id: string;
  type: InteractionType;
  subject: string | null;
  content: string | null;
  attachments: string[];
  created_by: string | null;
  user?: {
    full_name: string;
  };
  created_at: string;
}

// Tier configurations
export const CUSTOMER_TIER_CONFIG: Record<CustomerTier, { label: string; color: string; bgColor: string; minSpent: number }> = {
  bronze: { label: 'ทองแดง', color: 'text-[#AF52DE]', bgColor: 'bg-[#AF52DE]/10', minSpent: 0 },
  silver: { label: 'เงิน', color: 'text-[#86868B]', bgColor: 'bg-[#86868B]/10', minSpent: 50000 },
  gold: { label: 'ทอง', color: 'text-[#FF9500]', bgColor: 'bg-[#FF9500]/10', minSpent: 200000 },
  platinum: { label: 'แพลทินัม', color: 'text-[#007AFF]', bgColor: 'bg-[#007AFF]/10', minSpent: 500000 },
};

export const CUSTOMER_STATUS_CONFIG: Record<CustomerStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: 'ใช้งาน', color: 'text-[#34C759]', bgColor: 'bg-[#34C759]/10' },
  inactive: { label: 'ไม่เคลื่อนไหว', color: 'text-[#86868B]', bgColor: 'bg-[#86868B]/10' },
  blocked: { label: 'ระงับ', color: 'text-[#FF3B30]', bgColor: 'bg-[#FF3B30]/10' },
};

export const PAYMENT_TERMS_CONFIG: Record<PaymentTerms, { label: string; days: number }> = {
  cash: { label: 'เงินสด', days: 0 },
  credit_7: { label: 'เครดิต 7 วัน', days: 7 },
  credit_15: { label: 'เครดิต 15 วัน', days: 15 },
  credit_30: { label: 'เครดิต 30 วัน', days: 30 },
};

export const INTERACTION_TYPE_CONFIG: Record<InteractionType, { label: string; icon: string; color: string }> = {
  call: { label: 'โทรศัพท์', icon: '📞', color: 'text-[#34C759]' },
  email: { label: 'อีเมล', icon: '✉️', color: 'text-[#007AFF]' },
  line: { label: 'LINE', icon: '💬', color: 'text-[#00C300]' },
  visit: { label: 'พบลูกค้า', icon: '🤝', color: 'text-[#AF52DE]' },
  order: { label: 'รับออเดอร์', icon: '🛒', color: 'text-[#FF9500]' },
  complaint: { label: 'รับเรื่องร้องเรียน', icon: '⚠️', color: 'text-[#FF3B30]' },
  note: { label: 'บันทึก', icon: '📝', color: 'text-[#86868B]' },
};

// Province options (sample - can be expanded)
export const PROVINCES = [
  'กรุงเทพมหานคร',
  'นนทบุรี',
  'ปทุมธานี',
  'สมุทรปราการ',
  'นครปฐม',
  'ชลบุรี',
  'ระยอง',
  'เชียงใหม่',
  'ขอนแก่น',
  'นครราชสีมา',
  'ภูเก็ต',
  'สงขลา',
];

