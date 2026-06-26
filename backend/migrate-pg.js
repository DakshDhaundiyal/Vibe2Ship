// migrate-pg.js — Direct PostgreSQL migration runner for Supabase
// Uses the Supabase session pooler with SSL
// Usage: node migrate-pg.js [--seed]   (--seed also runs 003_seed.sql)

import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL; // https://xxxx.supabase.co
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD; // optional, for direct pg connection

// Extract project ref from URL
const projectRef = SUPABASE_URL
  .replace('https://', '')
  .replace('.supabase.co', '');

// Supabase session pooler — works without a separate DB password
// Uses the service role key as the password when connecting via the API
// Try both pooler and direct connection strings
const CONNECTION_STRINGS = [
  // Session pooler (port 5432)
  `postgresql://postgres.${projectRef}:${DB_PASSWORD || SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  // Direct connection (port 5432)  
  `postgresql://postgres:${DB_PASSWORD || SERVICE_ROLE_KEY}@db.${projectRef}.supabase.co:5432/postgres`,
];

async function tryConnect(connectionString) {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  await client.connect();
  return client;
}

async function runFile(client, filePath, label) {
  console.log(`\n⏳ Running ${label}...`);
  try {
    const sql = readFileSync(filePath, 'utf-8');
    await client.query(sql);
    console.log(`✅ ${label} — Complete`);
    return true;
  } catch (err) {
    console.error(`❌ ${label} — Error: ${err.message}`);
    return false;
  }
}

async function main() {
  const runSeed = process.argv.includes('--seed');
  
  console.log('🦸 Community Hero — Database Migration Runner');
  console.log(`Project: ${projectRef}`);
  console.log('');

  let client = null;
  
  for (const connStr of CONNECTION_STRINGS) {
    try {
      const masked = connStr.replace(/:([^:@]+)@/, ':***@');
      console.log(`Trying: ${masked}`);
      client = await tryConnect(connStr);
      console.log('✅ Connected to Supabase PostgreSQL\n');
      break;
    } catch (err) {
      console.warn(`  ↳ Failed: ${err.message}`);
    }
  }

  if (!client) {
    console.error('\n❌ Could not connect to Supabase PostgreSQL.');
    console.error('Please run the migrations manually in the Supabase SQL Editor:');
    console.error(`  https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.error('\nFiles to run in order:');
    console.error('  1. backend/migrations/001_schema.sql');
    console.error('  2. backend/migrations/002_functions.sql');
    console.error('  3. backend/migrations/003_seed.sql');
    process.exit(1);
  }

  const migrationsDir = join(__dirname, 'migrations');
  
  await runFile(client, join(migrationsDir, '001_schema.sql'), '001 Schema');
  await runFile(client, join(migrationsDir, '002_functions.sql'), '002 Functions');
  
  if (runSeed) {
    await runFile(client, join(migrationsDir, '003_seed.sql'), '003 Seed Data');
  } else {
    console.log('\n💡 Tip: Run with --seed flag to also load 35 NYC demo reports:');
    console.log('   node migrate-pg.js --seed');
  }

  await client.end();
  console.log('\n🎉 Migrations complete! Your database is ready.');
  console.log(`View tables: https://supabase.com/dashboard/project/${projectRef}/editor`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
