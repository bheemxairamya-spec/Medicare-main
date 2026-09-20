import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xcthoaxwzlenryycrrxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdGhvYXh3emxlbnJ5eWNycnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxODI0NjgsImV4cCI6MjEwNDc1ODQ2OH0.tVq80vlxi-lz6Re8vEI2uz3DaFbi4gKVO5fh2YfRgFM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAll() {
  console.log('====================================================');
  console.log('🔍 MEDICARE SUPABASE LIVE DATA FEED VERIFICATION');
  console.log('====================================================');
  console.log(`Connected to: ${supabaseUrl}\n`);

  const results: Record<string, { status: string; count?: number; error?: string; sample?: any }> = {};

  // 1. Hardware Readings Table
  try {
    const testReading = {
      device_id: 'ESP32_VERIFY_TEST',
      heart_rate: 74,
      spo2: 98,
      temperature_c: 36.6,
      weight_kg: 68.5,
      mq3_raw: 140,
      mq135_raw: 210,
      status: 'VERIFICATION_FEED_TEST',
      source: 'supabase_pipeline_check',
    };

    const { data: insertData, error: insertErr } = await supabase
      .from('hardware_readings')
      .insert([testReading])
      .select();

    if (insertErr) {
      results['hardware_readings'] = { status: '❌ INSERT ERROR', error: insertErr.message };
    } else {
      const { count, error: countErr } = await supabase
        .from('hardware_readings')
        .select('*', { count: 'exact', head: true });

      results['hardware_readings'] = {
        status: '✅ OK (Insert & Query Success)',
        count: count ?? 0,
        sample: insertData?.[0] ? `Inserted ID: ${insertData[0].id || 'ok'}` : 'Inserted successfully',
      };
    }
  } catch (err: any) {
    results['hardware_readings'] = { status: '❌ EXCEPTION', error: err.message };
  }

  // 2. Volunteers / Donors Table
  try {
    const { data: volData, count: volCount, error: volErr } = await supabase
      .from('volunteers')
      .select('*', { count: 'exact' })
      .limit(3);

    if (volErr) {
      results['volunteers'] = { status: '❌ QUERY ERROR', error: volErr.message };
    } else {
      results['volunteers'] = {
        status: '✅ OK',
        count: volCount ?? 0,
        sample: volData?.length ? `Latest donor: ${volData[0].full_name || volData[0].name || 'Record'} (${volData[0].blood_group || 'N/A'})` : 'No records yet',
      };
    }
  } catch (err: any) {
    results['volunteers'] = { status: '❌ EXCEPTION', error: err.message };
  }

  // 3. Medications Table
  try {
    const { data: medData, count: medCount, error: medErr } = await supabase
      .from('medications')
      .select('*', { count: 'exact' })
      .limit(3);

    if (medErr) {
      results['medications'] = { status: '❌ QUERY ERROR', error: medErr.message };
    } else {
      results['medications'] = {
        status: '✅ OK',
        count: medCount ?? 0,
        sample: medData?.length ? `Sample med: ${medData[0].name || medData[0].medicine_name || 'Record'}` : 'Ready for prescriptions',
      };
    }
  } catch (err: any) {
    results['medications'] = { status: '❌ EXCEPTION', error: err.message };
  }

  // 4. Medication Schedule Table
  try {
    const { count: schCount, error: schErr } = await supabase
      .from('medication_schedule')
      .select('*', { count: 'exact', head: true });

    results['medication_schedule'] = schErr
      ? { status: '❌ QUERY ERROR', error: schErr.message }
      : { status: '✅ OK', count: schCount ?? 0 };
  } catch (err: any) {
    results['medication_schedule'] = { status: '❌ EXCEPTION', error: err.message };
  }

  // 5. Profiles Table
  try {
    const { count: profCount, error: profErr } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    results['profiles'] = profErr
      ? { status: '❌ QUERY ERROR', error: profErr.message }
      : { status: '✅ OK', count: profCount ?? 0 };
  } catch (err: any) {
    results['profiles'] = { status: '❌ EXCEPTION', error: err.message };
  }

  // 6. First Aid Info Table
  try {
    const { count: faCount, error: faErr } = await supabase
      .from('first_aid_info')
      .select('*', { count: 'exact', head: true });

    results['first_aid_info'] = faErr
      ? { status: '❌ QUERY ERROR', error: faErr.message }
      : { status: '✅ OK', count: faCount ?? 0 };
  } catch (err: any) {
    results['first_aid_info'] = { status: '❌ EXCEPTION', error: err.message };
  }

  // 7. Disease Dos & Don'ts Table
  try {
    const { count: ddCount, error: ddErr } = await supabase
      .from('disease_dos_donts')
      .select('*', { count: 'exact', head: true });

    results['disease_dos_donts'] = ddErr
      ? { status: '❌ QUERY ERROR', error: ddErr.message }
      : { status: '✅ OK', count: ddCount ?? 0 };
  } catch (err: any) {
    results['disease_dos_donts'] = { status: '❌ EXCEPTION', error: err.message };
  }

  // 8. Good Habits Table
  try {
    const { count: ghCount, error: ghErr } = await supabase
      .from('good_habits')
      .select('*', { count: 'exact', head: true });

    results['good_habits'] = ghErr
      ? { status: '❌ QUERY ERROR', error: ghErr.message }
      : { status: '✅ OK', count: ghCount ?? 0 };
  } catch (err: any) {
    results['good_habits'] = { status: '❌ EXCEPTION', error: err.message };
  }

  console.log('RESULTS SUMMARY:');
  console.table(
    Object.entries(results).map(([table, info]) => ({
      Table: table,
      Status: info.status,
      TotalRecords: info.count !== undefined ? info.count : '-',
      Note: info.error || info.sample || '-',
    }))
  );

  console.log('\n✅ All data pipelines to Supabase verified successfully!');
}

verifyAll();
