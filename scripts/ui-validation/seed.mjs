/** Seed a demo race (and optionally earlier base calls with deliberate data problems). */
export async function seedRace(page, BASE, { withBaseData = false } = {}) {
  await page.goto(BASE);
  await page.waitForTimeout(800);
  const raceId = await page.evaluate(async ({ withBaseData }) => {
    const db = await new Promise((res, rej) => { const r = indexedDB.open('RaceTrackerDB'); r.onsuccess = e => res(e.target.result); r.onerror = rej; });
    const add = (store, val) => new Promise((res, rej) => { const tx = db.transaction(store, 'readwrite'); const q = tx.objectStore(store).add(val); q.onsuccess = e => res(e.target.result); q.onerror = () => rej(q.error); });
    const now = Date.now();
    const iso = (m) => new Date(now - m * 60000).toISOString();
    const blk = (m) => { const d = new Date(now - m * 60000); d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0); return d.toISOString(); };
    const start = new Date(now - 120 * 60000);
    const date = start.toISOString().slice(0, 10);
    const hm = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
    const raceId = await add('races', {
      name: 'Mt Glorious Mountain Trails', date, startTime: hm, minRunner: 100, maxRunner: 159,
      createdAt: new Date().toISOString(), baseCallsign: 'VK4WIP', frequency: '147.225', distanceKm: 22,
    });
    await add('race_batches', { raceId, batchNumber: 1, batchName: 'All Runners', startTime: `${date}T${hm}:00` });
    const names = [['Sarah', 'Johnson', 'F'], ['Mike', 'Chen', 'M'], ['Emma', 'Williams', 'F'], ['Carlos', 'Ruiz', 'M']];
    for (let n = 100; n <= 159; n++) {
      const [f, l, g] = names[n % 4];
      await add('runners', { raceId, number: n, status: 'not-started', firstName: f, lastName: `${l} ${n}`, gender: g, batchNumber: 1 });
    }
    const cps = [
      ['Northbrook Bush Camp', 5, ['VK4MUD', 'VK4MKD', 'VK4EAR']],
      ['England Creek Bush Camp', 11, ['VK4IE', 'VK4TBA']],
      ['England Creek Rd & Joyners Ridge Rd', 14.5, ['VK4PMC', 'VK4JBX']],
    ];
    for (let i = 0; i < cps.length; i++) {
      await add('checkpoints', { raceId, number: i + 1, name: cps[i][0], locationName: cps[i][0], distanceKm: cps[i][1], operatorCallsigns: cps[i][2] });
    }
    if (withBaseData) {
      // Base already received earlier calls: CP1 100–119 an hour ago, CP2 100–109
      // half an hour ago (typical CP1→CP2 split 30 min → 110–119 become overdue).
      const row = (cp, number, m, entry) => add('base_station_runners', { raceId, checkpointNumber: cp, number, status: 'passed', commonTime: blk(m), markOffEntryTime: iso(entry ?? m - 3), notes: null });
      for (let n = 100; n <= 119; n++) await row(1, n, 60);
      for (let n = 100; n <= 109; n++) if (n !== 106 && n !== 107) await row(2, n, 30);
      await row(1, 105, 50, 47);   // duplicate: second CP1 record for 105
      await row(2, 106, 75);       // out of order: CP2 earlier than CP1
      await row(2, 107, 55);       // impossible pace: 6 km CP1→CP2 in ~5 min
      await row(2, 120, 30);       // skipped: seen CP2, never at CP1
      await add('radio_calls', { raceId, checkpointNumber: 1, receivedAt: iso(57), blocks: [{ time: blk(60), numbers: [] }], recorded: [], skipped: [], rejected: [], undoneAt: null, replaced: [] });
      await add('radio_calls', { raceId, checkpointNumber: 2, receivedAt: iso(27), blocks: [{ time: blk(30), numbers: [] }], recorded: [], skipped: [], rejected: [], undoneAt: null, replaced: [] });
    }
    const tx = db.transaction('settings', 'readwrite');
    tx.objectStore('settings').put({ key: 'currentRaceId', value: raceId });
    return raceId;
  }, { withBaseData });
  await page.evaluate((rid) => {
    const s = JSON.parse(localStorage.getItem('race-tracker-storage') || '{"state":{}}');
    s.state = { ...s.state, selectedRaceForMode: rid, currentRaceId: rid };
    localStorage.setItem('race-tracker-storage', JSON.stringify(s));
  }, raceId);
  return raceId;
}

