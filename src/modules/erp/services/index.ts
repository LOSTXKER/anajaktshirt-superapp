// =============================================
// ERP SERVICE LAYER - DATABASE AGNOSTIC
// =============================================
// This service layer uses Repository Pattern to abstract
// database operations. Can be swapped between:
// - Supabase
// - MySQL/Prisma
// - Mock Data (for development)
// =============================================

export * from './repository';
export * from './orderService';
export * from './productionService';
export * from './supplierService';
export * from './changeRequestService';
export * from './qcService';

