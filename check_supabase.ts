import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const url = process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

console.log('=== SUPABASE BACKEND DATA CHECK ===');
console.log('Supabase URL:', url);
console.log('Using Key:', serviceKey ? `${serviceKey.slice(0, 15)}...` : 'NONE');

if (!url || !serviceKey) {
  console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function checkTable(tableName: string) {
  try {
    const { data, count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(10);

    if (error) {
      return { table: tableName, exists: false, error: error.message, count: 0, sample: [] };
    }
    return { table: tableName, exists: true, count: count ?? data?.length ?? 0, sample: data };
  } catch (err: any) {
    return { table: tableName, exists: false, error: err.message, count: 0, sample: [] };
  }
}

async function run() {
  const tables = [
    'hardware_readings',
    'volunteers',
    'volunteer_habits',
    'medications',
    'medication_schedule',
    'appointments',
    'push_subscriptions',
    'good_habits',
    'first_aid_info',
    'disease_dos_donts',
    'profiles',
  ];

  console.log('\n--- 1. TABLES & RECORD COUNTS ---');
  for (const t of tables) {
    const res = await checkTable(t);
    if (res.exists) {
      console.log(`✅ Table [${t}]: ${res.count} records found.`);
      if (res.sample && res.sample.length > 0) {
        console.log(`   Sample record IDs / values:`, JSON.stringify(res.sample.slice(0, 2)));
      }
    } else {
      console.log(`❌ Table [${t}]: NOT FOUND or Error -> ${res.error}`);
    }
  }

  console.log('\n--- 2. AUTH USERS CHECK ---');
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.log(`⚠️ Auth Admin Query: ${error.message}`);
    } else {
      console.log(`✅ Registered Auth Users Count: ${data.users.length}`);
      data.users.forEach((u, i) => {
        console.log(`   [User ${i + 1}] ID: ${u.id} | Email: ${u.email} | Created: ${u.created_at} | Meta:`, u.user_metadata);
      });
    }
  } catch (e: any) {
    console.log(`⚠️ Auth check error: ${e.message}`);
  }

  console.log('\n=== CHECK COMPLETED ===');
}

run().catch(console.error);
