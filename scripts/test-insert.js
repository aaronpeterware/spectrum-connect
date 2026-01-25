/**
 * Test inserting a profile to see what columns exist
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://argeddeskonatzovyzil.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyZ2VkZGVza29uYXR6b3Z5emlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mzc1NzIsImV4cCI6MjA4NDExMzU3Mn0.sTHJI8nZvD1_uZZOQ6WSaCNRdERk3lMaa76O0roJgI0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testInsert() {
  console.log('Testing user_profiles table...\n');

  // Try to read any existing data
  const { data: existing, error: readError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);

  if (readError) {
    console.log('Read error:', readError.message);
  } else {
    console.log('Existing data:', existing);
    if (existing && existing.length > 0) {
      console.log('Columns found:', Object.keys(existing[0]));
    }
  }

  // Try inserting a test profile with just id and name
  console.log('\nTrying basic insert (id, name only)...');
  const { data: inserted, error: insertError } = await supabase
    .from('user_profiles')
    .insert({ id: 'test_profile_123', name: 'Test User' })
    .select();

  if (insertError) {
    console.log('Insert error:', insertError.message);
    console.log('Full error:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('Insert success:', inserted);

    // Clean up
    await supabase.from('user_profiles').delete().eq('id', 'test_profile_123');
    console.log('Cleaned up test profile');
  }
}

testInsert()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
