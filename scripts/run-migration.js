#!/usr/bin/env node
/**
 * Run SQL migrations for Production Tracking
 * Usage: node scripts/run-migration.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL or DIRECT_URL not found in .env.local');
  console.log('\nPlease add one of these to your .env.local:');
  console.log('DATABASE_URL="postgresql://..."');
  console.log('or');
  console.log('DIRECT_URL="postgresql://..."');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Migration files to run
    const migrations = [
      'database/production-tracking-schema.sql',
      'database/schema-updates-v2.sql',
    ];

    for (const migrationFile of migrations) {
      const filePath = path.join(process.cwd(), migrationFile);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${migrationFile} (file not found)`);
        continue;
      }

      console.log(`📄 Running: ${migrationFile}`);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await client.query(sql);
        console.log(`✅ ${migrationFile} - Success!\n`);
      } catch (err) {
        // Continue on certain errors (like "already exists")
        if (err.message.includes('already exists') || err.message.includes('does not exist')) {
          console.log(`⚠️  ${migrationFile} - Partial (some objects already exist)\n`);
        } else {
          throw err;
        }
      }
    }

    console.log('🎉 All migrations completed!');
    
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();



