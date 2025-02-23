import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function applyPolicies() {
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../../supabase/migrations/20240220_storage_policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements and escape quotes
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
      .map(stmt => stmt.replace(/"/g, '\\"'));

    // Apply each statement using psql
    for (const statement of statements) {
      const command = `PGPASSWORD="${process.env.SUPABASE_DB_PASSWORD}" psql -h aws-0-us-west-1.pooler.supabase.com -U postgres.kaesskuawqgzwdrojebg -d postgres -c "${statement}"`;
      try {
        execSync(command, { stdio: 'inherit' });
        console.log('Successfully executed statement');
      } catch (error) {
        console.error('Error executing statement:', error);
        console.error('Statement:', statement);
      }
    }

    console.log('All policies applied successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

applyPolicies(); 