import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xcthoaxwzlenryycrrxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdGhvYXh3emxlbnJ5eWNycnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxODI0NjgsImV4cCI6MjEwNDc1ODQ2OH0.tVq80vlxi-lz6Re8vEI2uz3DaFbi4gKVO5fh2YfRgFM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectVolunteers() {
  const { data, error } = await supabase.from('volunteers').select('*').limit(1);
  console.log('Volunteers table query:', { data, error });

  // Test individual columns on volunteers table
  const columns = [
    'user_id', 'name', 'full_name', 'blood_group', 'mobile', 'phone', 'email',
    'status', 'date_of_birth', 'dob', 'age', 'gender', 'location', 'city',
    'emergency_contact_name', 'emergency_contact_phone', 'preferred_donation_center',
    'available_days', 'available_time', 'weight_kg', 'last_donated_date', 'created_at'
  ];

  console.log('\nTesting columns:');
  for (const col of columns) {
    const { error: colErr } = await supabase.from('volunteers').select(col).limit(1);
    console.log(`Column '${col}':`, colErr ? `❌ ${colErr.message}` : '✅ EXISTS');
  }
}

inspectVolunteers();
