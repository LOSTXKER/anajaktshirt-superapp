export { SupabaseOrderRepository, supabaseOrderRepository } from './orderRepository';
export { SupabaseProductionRepository, supabaseProductionRepository } from './productionRepository';
export { SupabaseSupplierRepository, supabaseSupplierRepository } from './supplierRepository';
export { SupabaseConfigRepository, supabaseConfigRepository } from './configRepository';
export { SupabaseChangeRequestRepository, supabaseChangeRequestRepository } from './changeRequestRepository';
export { SupabaseQCRepository, supabaseQCRepository } from './qcRepository';
export { SupabaseFinancialRepository, supabaseFinancialRepository } from './financialRepository';

// Combined Supabase Repository
import { supabaseOrderRepository } from './orderRepository';
import { supabaseProductionRepository } from './productionRepository';
import { supabaseSupplierRepository } from './supplierRepository';
import { supabaseConfigRepository } from './configRepository';
import { supabaseChangeRequestRepository } from './changeRequestRepository';
import { supabaseQCRepository } from './qcRepository';
import { supabaseFinancialRepository } from './financialRepository';
import type { IRepositoryFactory } from '../../services/repository';

export function createSupabaseRepository(): IRepositoryFactory {
  return {
    orders: supabaseOrderRepository,
    production: supabaseProductionRepository,
    suppliers: supabaseSupplierRepository,
    changeRequests: supabaseChangeRequestRepository,
    qc: supabaseQCRepository,
  };
}

// Legacy export for backward compatibility
export const supabaseRepository = {
  orders: supabaseOrderRepository,
  production: supabaseProductionRepository,
  suppliers: supabaseSupplierRepository,
  config: supabaseConfigRepository,
  changeRequests: supabaseChangeRequestRepository,
  qc: supabaseQCRepository,
  financial: supabaseFinancialRepository,
};

