// migrate.js — Run all SQL migrations directly against Supabase via HTTP SQL endpoint
// Usage: node migrate.js
// This uses the Supabase SQL-over-HTTP approach via pg + service role

import 'dotenv/config';
import https from 'https';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runSQL(sql, label) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${label} — OK`);
          resolve(data);
        } else {
          console.error(`❌ ${label} — HTTP ${res.statusCode}: ${data}`);
          resolve(data); // don't reject — continue
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('🚀 Community Hero — Running Migrations via Supabase SQL HTTP');
  console.log(`Project: ${SUPABASE_URL}\n`);

  const migrations = [
    { file: 'migrations/001_schema.sql', label: '001 Schema (tables, indexes, RLS, storage)' },
    { file: 'migrations/002_functions.sql', label: '002 Functions (find_nearby_reports, stats, triggers)' },
    { file: 'migrations/003_seed.sql', label: '003 Seed (35 NYC demo reports)' },
  ];

  for (const { file, label } of migrations) {
    const filePath = join(__dirname, file);
    let sql;
    try {
      sql = readFileSync(filePath, 'utf-8');
    } catch (err) {
      console.error(`❌ Could not read ${file}: ${err.message}`);
      continue;
    }
    console.log(`⏳ Running ${label}...`);
    await runSQL(sql, label);
  }

  console.log('\n✅ Done. Check Supabase dashboard for tables.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
