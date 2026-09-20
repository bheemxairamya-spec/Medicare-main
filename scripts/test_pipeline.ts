import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xcthoaxwzlenryycrrxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdGhvYXh3emxlbnJ5eWNycnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxODI0NjgsImV4cCI6MjEwNDc1ODQ2OH0.tVq80vlxi-lz6Re8vEI2uz3DaFbi4gKVO5fh2YfRgFM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFullPipeline() {
  console.log('Testing full Supabase pipeline for hardware_readings...');

  const sampleReading = {
    id: `scan-esp32-${Date.now()}`,
    device_id: 'ESP32-MEDICARE-NODE-01',
    alcohol_level: 0.0,
    air_quality_index: 42.1,
    weight_kg: 68.4,
    heart_rate_bpm: 76,
    body_temp_c: 36.7,
    spo2_percent: 98.2,
    recorded_at: new Date().toISOString(),
    is_eligible: true,
    status: 'pass',
    flagged_reasons: '',
  };

  const { data, error } = await supabase
    .from('hardware_readings')
    .insert([sampleReading])
    .select();

  if (error) {
    console.error('❌ Insert failed:', error.message);
  } else {
    console.log('✅ Insert succeeded! Saved row:', data);
  }

  // Check read back
  const { data: latest, error: readErr } = await supabase
    .from('hardware_readings')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(3);

  if (readErr) {
    console.error('❌ Read failed:', readErr.message);
  } else {
    console.log('✅ Query succeeded! Total rows retrieved:', latest.length);
    console.table(latest);
  }
}

testFullPipeline();
