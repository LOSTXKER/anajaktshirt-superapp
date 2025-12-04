// Client-side exports (safe for 'use client' components)
export { createClient, getSupabaseClient } from './client';

// Server-side exports (only import these in Server Components or Server Actions)
// Do NOT import these in client components or they will cause build errors
// Instead, use direct imports: import { createClient } from '@/lib/supabase/server';
// export { createClient as createServerClient, createServiceClient } from './server';

// Type exports (safe to use anywhere)
export type { Database, Tables, InsertTables, UpdateTables } from './types';

