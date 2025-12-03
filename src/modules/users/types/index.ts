// User & Role Types

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  department: string | null;
  role_id: string | null;
  role?: Role;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user?: UserProfile;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout';
  entity_type: string;
  entity_id: string | null;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Permission helper types
export type Permission = 
  | '*'
  | 'dashboard:view'
  | 'stock:*' | 'stock:view' | 'stock:transaction' | 'stock:manage'
  | 'products:*' | 'products:view' | 'products:manage'
  | 'production:*' | 'production:view' | 'production:manage'
  | 'crm:*' | 'crm:view' | 'crm:manage'
  | 'users:*' | 'users:view' | 'users:manage'
  | 'settings:*' | 'settings:view' | 'settings:manage';

export const PERMISSION_LABELS: Record<string, string> = {
  '*': 'เข้าถึงทุกส่วน',
  'dashboard:view': 'ดูแดชบอร์ด',
  'stock:*': 'จัดการสต๊อกทั้งหมด',
  'stock:view': 'ดูสต๊อก',
  'stock:transaction': 'ทำรายการสต๊อก',
  'stock:manage': 'แก้ไขสต๊อก',
  'products:*': 'จัดการสินค้าทั้งหมด',
  'products:view': 'ดูสินค้า',
  'products:manage': 'แก้ไขสินค้า',
  'production:*': 'จัดการผลิตทั้งหมด',
  'production:view': 'ดูงานผลิต',
  'production:manage': 'แก้ไขงานผลิต',
  'crm:*': 'จัดการ CRM ทั้งหมด',
  'crm:view': 'ดูข้อมูลลูกค้า',
  'crm:manage': 'แก้ไขข้อมูลลูกค้า',
  'users:*': 'จัดการผู้ใช้ทั้งหมด',
  'users:view': 'ดูข้อมูลผู้ใช้',
  'users:manage': 'แก้ไขข้อมูลผู้ใช้',
  'settings:*': 'จัดการตั้งค่าทั้งหมด',
};

// Department options
export const DEPARTMENTS = [
  { value: 'management', label: 'ผู้บริหาร' },
  { value: 'production', label: 'ฝ่ายผลิต' },
  { value: 'warehouse', label: 'ฝ่ายคลังสินค้า' },
  { value: 'sales', label: 'ฝ่ายขาย' },
  { value: 'accounting', label: 'ฝ่ายบัญชี' },
  { value: 'hr', label: 'ฝ่ายบุคคล' },
];

