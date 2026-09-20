import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xcthoaxwzlenryycrrxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdGhvYXh3emxlbnJ5eWNycnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxODI0NjgsImV4cCI6MjEwNDc1ODQ2OH0.tVq80vlxi-lz6Re8vEI2uz3DaFbi4gKVO5fh2YfRgFM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthAndDataFeed() {
  const testEmail = `medicare.check.${Date.now()}@gmail.com`;
  const testPassword = 'Password123!';

  // Sign up test
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Test Verified User',
        role: 'patient',
      },
    },
  });

  if (authErr) {
    console.log('Signup result:', authErr.message);
  } else {
    console.log('✅ User created in Supabase Auth:', authData.user?.id);
    console.log('✅ Email confirmation state:', authData.user?.confirmed_at ? 'Confirmed' : 'Confirmation email sent');
  }

  // Query hardware readings
  const { data: readings } = await supabase
    .from('hardware_readings')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(2);

  console.log('✅ Live Hardware Telemetry in Supabase:', readings?.length, 'recent readings');
}

testAuthAndDataFeed();
