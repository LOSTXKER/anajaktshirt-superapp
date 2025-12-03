export interface AuditLog {
  id: string;
  user_id: string | null;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export' | 'import';
  entity_type: 'product' | 'transaction' | 'production_job' | 'customer' | 'user' | 'settings' | 'reservation' | 'stock_reservation' | 'order';
  entity_id: string | null;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  
  // Joined data
  user?: {
    email: string;
    full_name: string;
  };
}

export interface AuditLogFilters {
  action?: string;
  entity_type?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}

export const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: 'สร้าง', color: 'bg-green-100 text-green-700' },
  update: { label: 'แก้ไข', color: 'bg-blue-100 text-blue-700' },
  delete: { label: 'ลบ', color: 'bg-red-100 text-red-700' },
  login: { label: 'เข้าสู่ระบบ', color: 'bg-purple-100 text-purple-700' },
  logout: { label: 'ออกจากระบบ', color: 'bg-gray-100 text-gray-700' },
  view: { label: 'ดู', color: 'bg-slate-100 text-slate-700' },
  export: { label: 'ส่งออก', color: 'bg-orange-100 text-orange-700' },
  import: { label: 'นำเข้า', color: 'bg-teal-100 text-teal-700' },
};

export const ENTITY_LABELS: Record<string, string> = {
  product: 'สินค้า',
  transaction: 'ธุรกรรมสต๊อก',
  production_job: 'งานผลิต',
  customer: 'ลูกค้า',
  user: 'ผู้ใช้งาน',
  settings: 'ตั้งค่า',
  reservation: 'จองสต๊อก',
};

