import Dexie from 'dexie';

// Database schema
class RaceTrackerDB extends Dexie {
  constructor() {
    super('RaceTrackerDB');

    this.version(5)
        .stores({
            races: "++id, name, date, startTime, minRunner, maxRunner, createdAt",
            runners: "++id, [raceId+number], raceId, number, status, recordedTime, notes",
            checkpoints: "++id, [raceId+number], raceId, number, name",
            checkpoint_runners: "++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, markOffTime, callInTime, status, notes",
            base_station_runners: "++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, commonTime, status, notes",
            settings: "key, value"
        });
  }
}

const db = new RaceTrackerDB();

export default db;
