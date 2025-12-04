// =============================================
// ANAJAK ERP MODULE
// =============================================
// Clean, simple ERP module using Supabase
// =============================================

// Types
export * from './types';

// Services
export * from './services';

// Hooks
export * from './hooks';

// Components
export * from './components';

// Repositories (direct access)
export { supabaseOrderRepository } from './repositories/supabase/orderRepository';
export { supabaseProductionRepository } from './repositories/supabase/productionRepository';
export { supabaseSupplierRepository } from './repositories/supabase/supplierRepository';
export { supabaseConfigRepository } from './repositories/supabase/configRepository';

// ---------------------------------------------
// Auto-initialize Repository
// ---------------------------------------------

import { setRepository } from './services/repository';
import { createSupabaseRepository } from './repositories/supabase';

// Initialize once on module load
let initialized = false;

function initializeRepository() {
  if (initialized) return;
  
  try {
    const repository = createSupabaseRepository();
    setRepository(repository);
    initialized = true;
    console.log('✅ ERP Repository initialized (Supabase)');
  } catch (error) {
    console.error('❌ Failed to initialize ERP Repository:', error);
  }
}

// Auto-initialize on client side
if (typeof window !== 'undefined') {
  initializeRepository();
}

// Export for manual initialization if needed
export { initializeRepository };
