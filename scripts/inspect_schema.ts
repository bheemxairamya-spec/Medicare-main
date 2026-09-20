import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xcthoaxwzlenryycrrxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdGhvYXh3emxlbnJ5eWNycnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxODI0NjgsImV4cCI6MjEwNDc1ODQ2OH0.tVq80vlxi-lz6Re8vEI2uz3DaFbi4gKVO5fh2YfRgFM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  // Query a row or select from hardware_readings
  const { data, error } = await supabase.from('hardware_readings').select('*').limit(1);
  console.log('hardware_readings query result:', { data, error });

  // Test inserting with different column name sets:
  const testPayloads = [
    { heartRate: 72, spo2: 98, temperature: 36.5, weight: 70, alcohol: 0, airQuality: 120 },
    { heart_rate: 72, spo2: 98, temperature: 36.5, weight: 70 },
    { bpm: 72, spo2: 98, temp: 36.5, weight: 70 },
    { payload: { heart_rate: 72, spo2: 98 } },
    { reading: JSON.stringify({ heart_rate: 72, spo2: 98 }) },
    { device_id: 'test' },
  ];

  for (const [idx, p] of testPayloads.entries()) {
    const { data: ins, error: insErr } = await supabase.from('hardware_readings').insert([p]).select();
    console.log(`Test payload ${idx}:`, p, '->', insErr ? `Error: ${insErr.message}` : `Success: ${JSON.stringify(ins)}`);
  }
}

inspectSchema();
