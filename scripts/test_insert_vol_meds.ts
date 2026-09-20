import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xcthoaxwzlenryycrrxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdGhvYXh3emxlbnJ5eWNycnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxODI0NjgsImV4cCI6MjEwNDc1ODQ2OH0.tVq80vlxi-lz6Re8vEI2uz3DaFbi4gKVO5fh2YfRgFM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsertVolAndMeds() {
  // Test 1: Insert into volunteers
  const testVolunteer = {
    id: `vol-${Date.now()}`,
    name: 'Dr. Aravind Swamy',
    blood_group: 'O+',
    mobile: '9876543210',
    email: 'aravind@example.com',
    status: 'Verified',
  };

  const { data: vData, error: vErr } = await supabase.from('volunteers').insert([testVolunteer]).select();
  console.log('Volunteer insert test 1:', { vData, error: vErr?.message });

  // Test 2: Insert into medications
  const testMed = {
    id: `med-${Date.now()}`,
    name: 'Amoxicillin 500mg',
    dosage: '1 Capsule',
    frequency: 'Twice daily',
  };

  const { data: mData, error: mErr } = await supabase.from('medications').insert([testMed]).select();
  console.log('Medication insert test 1:', { mData, error: mErr?.message });
}

testInsertVolAndMeds();
