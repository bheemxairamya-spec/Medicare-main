import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xcthoaxwzlenryycrrxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdGhvYXh3emxlbnJ5eWNycnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxODI0NjgsImV4cCI6MjEwNDc1ODQ2OH0.tVq80vlxi-lz6Re8vEI2uz3DaFbi4gKVO5fh2YfRgFM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testExactColumns() {
  const testUserId = 'a35162b3-c785-4fc6-85d3-711f058353cc'; // existing auth user in DB

  // 1. Medications test
  const { data: medData, error: medErr } = await supabase
    .from('medications')
    .insert([
      {
        user_id: testUserId,
        med_name: 'Metformin 500mg',
        dosage: '1 Tablet',
        times_per_day: 2,
      },
    ])
    .select();

  console.log('Medication test:', { medData, error: medErr?.message });

  if (medData && medData[0]) {
    const medId = medData[0].id;
    // 2. Medication schedule test
    const { data: schData, error: schErr } = await supabase
      .from('medication_schedule')
      .insert([
        {
          medication_id: medId,
          user_id: testUserId,
          reminder_time: '08:00 AM',
        },
      ])
      .select();

    console.log('Medication schedule test:', { schData, error: schErr?.message });
  }

  // 3. Volunteer test
  const { data: volData, error: volErr } = await supabase
    .from('volunteers')
    .insert([
      {
        user_id: testUserId,
        name: 'Ramya Test Donor',
        blood_group: 'B+',
        mobile: '9876543210',
        email: 'ramya@example.com',
        status: 'pending',
      },
    ])
    .select();

  console.log('Volunteer test:', { volData, error: volErr?.message });
}

testExactColumns();
