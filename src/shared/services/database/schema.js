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

    // Version 6: Add audit trail, deleted entries, strapper calls, and withdrawal records
    this.version(6)
        .stores({
            races: "++id, name, date, startTime, minRunner, maxRunner, createdAt",
            runners: "++id, [raceId+number], raceId, number, status, recordedTime, notes",
            checkpoints: "++id, [raceId+number], raceId, number, name",
            checkpoint_runners: "++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, markOffTime, callInTime, status, notes",
            base_station_runners: "++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, commonTime, status, notes",
            settings: "key, value",
            // New tables for audit and operations
            deleted_entries: "++id, raceId, entryType, deletedAt, restorable",
            strapper_calls: "++id, [raceId+checkpoint], raceId, checkpoint, status, priority, createdAt",
            audit_log: "++id, raceId, entityType, action, performedAt",
            withdrawal_records: "++id, [raceId+runnerNumber], raceId, runnerNumber, checkpoint, withdrawalTime, reversedAt",
            vet_out_records: "++id, [raceId+runnerNumber], raceId, runnerNumber, checkpoint, vetOutTime"
        });
  }
}

const db = new RaceTrackerDB();

export default db;
