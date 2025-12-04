export { SupabaseOrderRepository, supabaseOrderRepository } from './orderRepository';
export { SupabaseProductionRepository, supabaseProductionRepository } from './productionRepository';
export { SupabaseSupplierRepository, supabaseSupplierRepository } from './supplierRepository';
export { SupabaseConfigRepository, supabaseConfigRepository } from './configRepository';

// Combined Supabase Repository
import { supabaseOrderRepository } from './orderRepository';
import { supabaseProductionRepository } from './productionRepository';
import { supabaseSupplierRepository } from './supplierRepository';
import { supabaseConfigRepository } from './configRepository';

export const supabaseRepository = {
  orders: supabaseOrderRepository,
  production: supabaseProductionRepository,
  suppliers: supabaseSupplierRepository,
  config: supabaseConfigRepository,
};

