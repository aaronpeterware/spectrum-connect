/**
 * Check if database schema is installed correctly
 * Run with: node scripts/check-schema.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://argeddeskonatzovyzil.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyZ2VkZGVza29uYXR6b3Z5emlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mzc1NzIsImV4cCI6MjA4NDExMzU3Mn0.sTHJI8nZvD1_uZZOQ6WSaCNRdERk3lMaa76O0roJgI0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
  console.log('Checking database schema...\n');

  const tables = [
    'user_profiles',
    'conversations',
    'matches',
    'messages',
    'swipe_actions'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('not found')) {
          console.log(`[MISSING] Table '${table}' does not exist`);
        } else {
          console.log(`[ERROR] Table '${table}': ${error.message}`);
        }
      } else {
        console.log(`[OK] Table '${table}' exists (${count || 0} rows)`);
      }
    } catch (err) {
      console.log(`[ERROR] Table '${table}': ${err.message}`);
    }
  }

  // Check user_profiles columns
  console.log('\nChecking user_profiles columns...');
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, name, age, gender, seeking, goals, interests, is_fake, profile_photos, onboarding_completed')
      .limit(1);

    if (error) {
      console.log(`[ERROR] Missing columns in user_profiles: ${error.message}`);
      console.log('\nYou need to run the schema SQL in Supabase SQL Editor.');
      console.log('File: spectrum-app/supabase-schema.sql');
    } else {
      console.log('[OK] All required columns exist in user_profiles');
    }
  } catch (err) {
    console.log(`[ERROR] ${err.message}`);
  }

  // Check if fake profiles exist
  console.log('\nChecking for fake profiles...');
  try {
    const { data, error, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .eq('is_fake', true);

    if (error) {
      console.log(`[ERROR] ${error.message}`);
    } else {
      console.log(`[INFO] Found ${count || 0} fake profiles`);
      if ((count || 0) === 0) {
        console.log('       Run: node scripts/seed-fake-profiles.js');
      }
    }
  } catch (err) {
    console.log(`[ERROR] ${err.message}`);
  }

  console.log('\n===========================================');
  console.log('Schema check complete!');
  console.log('===========================================\n');
}

checkSchema()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
