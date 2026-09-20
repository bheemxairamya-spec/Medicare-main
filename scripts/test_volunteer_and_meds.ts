import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xcthoaxwzlenryycrrxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdGhvYXh3emxlbnJ5eWNycnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxODI0NjgsImV4cCI6MjEwNDc1ODQ2OH0.tVq80vlxi-lz6Re8vEI2uz3DaFbi4gKVO5fh2YfRgFM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVolunteersAndMeds() {
  console.log('Testing Volunteers and Medications tables in Supabase...');

  // 1. Check volunteers schema
  const { data: volData, error: volErr } = await supabase.from('volunteers').select('*').limit(1);
  console.log('Volunteers sample:', { volData, volErr });

  // 2. Check medications schema
  const { data: medData, error: medErr } = await supabase.from('medications').select('*').limit(1);
  console.log('Medications sample:', { medData, medErr });

  // 3. Check medication_schedule schema
  const { data: schData, error: schErr } = await supabase.from('medication_schedule').select('*').limit(1);
  console.log('Medication schedule sample:', { schData, schErr });
}

testVolunteersAndMeds();
