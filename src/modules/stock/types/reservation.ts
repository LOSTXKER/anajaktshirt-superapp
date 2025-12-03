export interface StockReservation {
  id: string;
  job_id: string;
  product_id: string;
  quantity: number;
  status: 'reserved' | 'used' | 'released';
  reserved_by: string;
  reserved_at: string;
  released_at: string | null;
  
  // Joined data
  job?: {
    job_number: string;
    customer_name: string;
    status: string;
    due_date: string;
  };
  product?: {
    name: string;
    main_sku: string;
    current_stock: number;
  };
  reserved_by_user?: {
    full_name: string;
    email: string;
  };
}

export interface ReservationSummary {
  product_id: string;
  product_name: string;
  main_sku: string;
  current_stock: number;
  reserved_quantity: number;
  available_quantity: number;
}

export interface CreateReservationParams {
  job_id: string;
  product_id: string;
  quantity: number;
}

