async function testUpdatedEndpoints() {
  console.log('Testing updated backend endpoints...');

  // 1. Health check
  const hRes = await fetch('http://localhost:5173/api/health');
  const hData = await hRes.json();
  console.log('Health check:', hData);

  // 2. Trigger scan without simulate (ESP32 offline)
  const scanRes = await fetch('http://localhost:5173/api/hardware-readings/trigger-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_name: 'Test Patient' }),
  });
  const scanData = await scanRes.json();
  console.log('Scan (Real hardware offline check):', { status: scanRes.status, scanData });

  // 3. Trigger scan with simulate: true
  const simRes = await fetch('http://localhost:5173/api/hardware-readings/trigger-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_name: 'Test Patient', simulate: true }),
  });
  const simData = await simRes.json();
  console.log('Scan (Simulate demo test):', { status: simRes.status, success: simData.success, reading: simData.reading });
}

testUpdatedEndpoints();
