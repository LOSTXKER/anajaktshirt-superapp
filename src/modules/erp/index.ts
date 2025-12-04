// =============================================
// ANAJAK ERP MODULE
// =============================================
// Database-agnostic ERP system
// Supports: Mock (dev), Supabase (current), MySQL (future)
// =============================================

// Types
export * from './types';

// Services
export * from './services';

// Hooks
export * from './hooks';

// Components
export * from './components';

// Storage (localStorage)
export * from './storage';

// Mock Repository (for development)
export { createMockRepository } from './mocks';

// ---------------------------------------------
// Initialize ERP Module
// ---------------------------------------------
// Call this in your app initialization
// 
// For development (mock data):
//   import { initializeERP } from '@/modules/erp';
//   initializeERP('mock');
// 
// For production (Supabase):
//   import { initializeERP } from '@/modules/erp';
//   initializeERP('supabase');
// 
// For future MySQL:
//   import { initializeERP } from '@/modules/erp';
//   initializeERP('mysql');
// ---------------------------------------------

import { setRepository, type IRepositoryFactory } from './services/repository';
// import { createMockRepository } from './mocks'; // Mock removed
import { createSupabaseRepository } from './repositories/supabase';

export type DatabaseProvider = 'supabase' | 'mysql';

let isInitialized = false;
let currentProvider: DatabaseProvider | null = null;

export function initializeERP(provider: DatabaseProvider = 'supabase'): void {
  if (isInitialized && currentProvider === provider) {
    console.log(`ERP already initialized with ${provider}`);
    return;
  }

  let repository: IRepositoryFactory;

  switch (provider) {
    case 'supabase':
      repository = createSupabaseRepository();
      console.log('🗄️ ERP initialized with SUPABASE (production mode)');
      break;

    case 'mysql':
      // TODO: Implement MySQLRepository (Prisma)
      console.warn('⚠️ MySQL repository not implemented yet, falling back to Supabase');
      repository = createSupabaseRepository();
      break;

    default:
      console.warn(`⚠️ Unknown provider: ${provider}, using Supabase`);
      repository = createSupabaseRepository();
  }

  setRepository(repository);
  isInitialized = true;
  currentProvider = provider;
}

// Auto-initialize
if (typeof window !== 'undefined') {
  initializeERP('supabase');
}

export function getERPProvider(): DatabaseProvider | null {
  return currentProvider;
}

export function isERPInitialized(): boolean {
  return isInitialized;
}

// ---------------------------------------------
// Auto-initialize with mock in development
// ---------------------------------------------

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Use Supabase even in development
  initializeERP('supabase');
}

