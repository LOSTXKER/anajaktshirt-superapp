// Supabase Database Types
// Auto-generated types should be placed here after running:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ==================== CORE TABLES ====================
      customers: {
        Row: {
          id: string;
          name: string;
          company_name: string | null;
          phone: string | null;
          email: string | null;
          line_id: string | null;
          tier: 'bronze' | 'silver' | 'gold' | 'platinum';
          total_orders: number;
          total_spent: number;
          notes: string | null;
          address: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };

      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          order_type_code: string;
          status: string;
          priority: number;
          order_date: string;
          due_date: string | null;
          completed_date: string | null;
          sales_channel: string | null;
          payment_status: string;
          paid_amount: number;
          total_quantity: number;
          pricing: Json | null;
          shipping_address: Json | null;
          notes: string | null;
          internal_notes: string | null;
          design_free_revisions: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'order_number' | 'created_at' | 'updated_at'> & {
          id?: string;
          order_number?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };

      order_work_items: {
        Row: {
          id: string;
          order_id: string;
          work_type_code: string;
          position_code: string | null;
          size_code: string | null;
          description: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          status: string;
          production_mode: string;
          supplier_id: string | null;
          sequence_order: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_work_items']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['order_work_items']['Insert']>;
      };

      order_work_item_products: {
        Row: {
          id: string;
          work_item_id: string;
          product_id: string;
          product_name: string;
          color: string | null;
          size: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_work_item_products']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['order_work_item_products']['Insert']>;
      };

      order_payments: {
        Row: {
          id: string;
          order_id: string;
          amount: number;
          payment_method: string;
          payment_date: string;
          reference_number: string | null;
          payment_slip_url: string | null;
          status: string;
          verified_by: string | null;
          verified_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_payments']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['order_payments']['Insert']>;
      };

      order_designs: {
        Row: {
          id: string;
          order_id: string;
          work_item_id: string | null;
          design_name: string;
          current_version_id: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_designs']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['order_designs']['Insert']>;
      };

      design_versions: {
        Row: {
          id: string;
          design_id: string;
          version_number: number;
          file_url: string | null;
          file_name: string | null;
          thumbnail_url: string | null;
          status: string;
          is_paid_revision: boolean;
          revision_fee: number;
          feedback: string | null;
          approved_at: string | null;
          approved_by: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['design_versions']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['design_versions']['Insert']>;
      };

      order_mockups: {
        Row: {
          id: string;
          order_id: string;
          design_version_id: string | null;
          version_number: number;
          images: Json;
          status: string;
          customer_feedback: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_mockups']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['order_mockups']['Insert']>;
      };

      // ==================== PRODUCTION TABLES ====================
      production_jobs: {
        Row: {
          id: string;
          job_number: string;
          order_id: string;
          work_item_id: string;
          work_type_code: string;
          status: string;
          priority: number;
          station_id: string | null;
          assigned_to: string | null;
          total_qty: number;
          completed_qty: number;
          defect_qty: number;
          due_date: string | null;
          started_at: string | null;
          completed_at: string | null;
          description: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['production_jobs']['Row'], 'id' | 'job_number' | 'created_at' | 'updated_at'> & {
          id?: string;
          job_number?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['production_jobs']['Insert']>;
      };

      production_stations: {
        Row: {
          id: string;
          name: string;
          code: string;
          work_type_codes: string[];
          capacity_per_day: number;
          is_active: boolean;
          current_job_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['production_stations']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['production_stations']['Insert']>;
      };

      // ==================== SUPPLIER TABLES ====================
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_name: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          service_types: string[];
          rating: number;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['suppliers']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['suppliers']['Insert']>;
      };

      purchase_orders: {
        Row: {
          id: string;
          po_number: string;
          supplier_id: string;
          order_id: string | null;
          status: string;
          total_amount: number;
          notes: string | null;
          expected_date: string | null;
          received_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['purchase_orders']['Row'], 'id' | 'po_number' | 'created_at' | 'updated_at'> & {
          id?: string;
          po_number?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['purchase_orders']['Insert']>;
      };

      purchase_order_items: {
        Row: {
          id: string;
          purchase_order_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          received_qty: number;
          work_item_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['purchase_order_items']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['purchase_order_items']['Insert']>;
      };

      // ==================== CHANGE REQUEST TABLES ====================
      change_requests: {
        Row: {
          id: string;
          request_number: string;
          order_id: string;
          type: string;
          title: string;
          description: string | null;
          status: string;
          current_phase: string;
          requested_by: string | null;
          quoted_fee: number;
          approved_fee: number;
          impact_assessment: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['change_requests']['Row'], 'id' | 'request_number' | 'created_at' | 'updated_at'> & {
          id?: string;
          request_number?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['change_requests']['Insert']>;
      };

      // ==================== QC TABLES ====================
      qc_records: {
        Row: {
          id: string;
          order_id: string;
          production_job_id: string | null;
          stage: string;
          checked_qty: number;
          passed_qty: number;
          failed_qty: number;
          overall_result: string;
          checkpoints: Json;
          defects_found: Json;
          notes: string | null;
          checked_by: string | null;
          checked_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['qc_records']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['qc_records']['Insert']>;
      };

      // ==================== FINANCIAL TABLES ====================
      quotations: {
        Row: {
          id: string;
          quotation_number: string;
          order_id: string | null;
          customer_id: string;
          status: string;
          issue_date: string;
          due_date: string;
          total_amount: number;
          discount_amount: number;
          net_amount: number;
          tax_amount: number;
          grand_total: number;
          items: Json;
          notes: string | null;
          terms_and_conditions: string | null;
          sent_at: string | null;
          accepted_at: string | null;
          rejected_at: string | null;
          rejected_reason: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['quotations']['Row'], 'id' | 'quotation_number' | 'created_at' | 'updated_at'> & {
          id?: string;
          quotation_number?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['quotations']['Insert']>;
      };

      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          order_id: string;
          customer_id: string;
          status: string;
          issue_date: string;
          due_date: string;
          total_amount: number;
          paid_amount: number;
          outstanding_amount: number;
          items: Json;
          notes: string | null;
          payment_terms: string | null;
          sent_at: string | null;
          paid_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'invoice_number' | 'created_at' | 'updated_at'> & {
          id?: string;
          invoice_number?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };

      receipts: {
        Row: {
          id: string;
          receipt_number: string;
          invoice_id: string;
          order_id: string;
          customer_id: string;
          payment_date: string;
          amount: number;
          payment_method: string;
          reference_number: string | null;
          notes: string | null;
          received_by: string | null;
          payment_slip_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['receipts']['Row'], 'id' | 'receipt_number' | 'created_at' | 'updated_at'> & {
          id?: string;
          receipt_number?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['receipts']['Insert']>;
      };

      // ==================== CONFIG TABLES ====================
      work_types: {
        Row: {
          id: string;
          code: string;
          name: string;
          category: string;
          base_price: number;
          requires_design: boolean;
          default_production_mode: string;
          estimated_days: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['work_types']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['work_types']['Insert']>;
      };

      order_types: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          lead_time_min: number;
          lead_time_max: number;
          features_included: string[];
          features_excluded: string[];
          workflow_steps: string[];
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_types']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['order_types']['Insert']>;
      };

      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          model: string | null;
          category: string | null;
          color: string | null;
          size: string | null;
          base_price: number;
          stock_qty: number;
          is_active: boolean;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };

      // ==================== USER TABLES ====================
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          type: string;
          title: string;
          message: string | null;
          data: Json | null;
          is_read: boolean;
          read_at: string | null;
          link: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

