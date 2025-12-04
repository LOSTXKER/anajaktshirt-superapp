#!/usr/bin/env node
/**
 * Check production_jobs table structure and permissions
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_URL;

async function checkTable() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'production_jobs'
      );
    `);
    console.log('📋 Table exists:', tableCheck.rows[0].exists);

    if (tableCheck.rows[0].exists) {
      // Get columns
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'production_jobs'
        ORDER BY ordinal_position;
      `);
      console.log('\n📝 Columns:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });

      // Check RLS
      const rlsCheck = await client.query(`
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = 'production_jobs';
      `);
      console.log('\n🔒 RLS enabled:', rlsCheck.rows[0]?.relrowsecurity);

      // Check policies
      const policies = await client.query(`
        SELECT policyname, permissive, cmd
        FROM pg_policies 
        WHERE tablename = 'production_jobs';
      `);
      console.log('\n📜 Policies:');
      if (policies.rows.length === 0) {
        console.log('  ⚠️  No policies found! This might be the issue.');
      } else {
        policies.rows.forEach(pol => {
          console.log(`  - ${pol.policyname} (${pol.cmd})`);
        });
      }

      // Try to insert a test record
      console.log('\n🧪 Testing insert...');
      const testInsert = await client.query(`
        INSERT INTO production_jobs (job_number, work_type_code, ordered_qty)
        VALUES ('TEST-DELETE-ME', 'TEST', 1)
        RETURNING id;
      `);
      console.log('✅ Insert successful! ID:', testInsert.rows[0].id);
      
      // Delete test record
      await client.query(`DELETE FROM production_jobs WHERE job_number = 'TEST-DELETE-ME';`);
      console.log('🗑️  Test record deleted');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.detail) console.error('   Detail:', err.detail);
    if (err.hint) console.error('   Hint:', err.hint);
  } finally {
    await client.end();
  }
}

checkTable();



