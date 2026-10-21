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

    // Version 7: Add imported checkpoint results (non-breaking, additive only)
    // Stores checkpoint result JSONs imported from checkpoint devices.
    // Runners are stored as a JSON blob — this data is read-only at base station.
    this.version(7)
        .stores({
            races: "++id, name, date, startTime, minRunner, maxRunner, createdAt",
            runners: "++id, [raceId+number], raceId, number, status, recordedTime, notes",
            checkpoints: "++id, [raceId+number], raceId, number, name",
            checkpoint_runners: "++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, markOffTime, callInTime, status, notes",
            base_station_runners: "++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, commonTime, status, notes",
            settings: "key, value",
            deleted_entries: "++id, raceId, entryType, deletedAt, restorable",
            strapper_calls: "++id, [raceId+checkpoint], raceId, checkpoint, status, priority, createdAt",
            audit_log: "++id, raceId, entityType, action, performedAt",
            withdrawal_records: "++id, [raceId+runnerNumber], raceId, runnerNumber, checkpoint, withdrawalTime, reversedAt",
            vet_out_records: "++id, [raceId+runnerNumber], raceId, runnerNumber, checkpoint, vetOutTime",
            imported_checkpoint_results: "++id, [raceId+checkpointNumber], raceId, checkpointNumber, importedAt"
        });

    // Version 8: Add race batches, runner personal data, 3-time checkpoint model, base station entry time
    this.version(8)
        .stores({
            races: "++id, name, date, startTime, minRunner, maxRunner, createdAt",
            // runners: added firstName, lastName, gender, batchNumber (not indexed — queried via raceId)
            runners: "++id, [raceId+number], raceId, number, gender, batchNumber, status, recordedTime, notes",
            checkpoints: "++id, [raceId+number], raceId, number, name",
            // checkpoint_runners: added actualTime, commonTime, commonTimeLabel, calledIn; kept markOffTime for back-compat
            checkpoint_runners: "++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, actualTime, commonTime, calledIn, markOffTime, callInTime, status, notes",
            // base_station_runners: added markOffEntryTime
            base_station_runners: "++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, commonTime, markOffEntryTime, status, notes",
            settings: "key, value",
            deleted_entries: "++id, raceId, entryType, deletedAt, restorable",
            strapper_calls: "++id, [raceId+checkpoint], raceId, checkpoint, status, priority, createdAt",
            audit_log: "++id, raceId, entityType, action, performedAt",
            withdrawal_records: "++id, [raceId+runnerNumber], raceId, runnerNumber, checkpoint, withdrawalTime, reversedAt",
            vet_out_records: "++id, [raceId+runnerNumber], raceId, runnerNumber, checkpoint, vetOutTime",
            imported_checkpoint_results: "++id, [raceId+checkpointNumber], raceId, checkpointNumber, importedAt",
            // New: race batches / waves
            race_batches: "++id, [raceId+batchNumber], raceId, batchNumber, batchName, startTime"
        })
        .upgrade(tx => {
            // Migrate runners: set defaults for new fields
            tx.table('runners').toCollection().modify(runner => {
                if (!runner.gender) runner.gender = 'X';
                if (!runner.batchNumber) runner.batchNumber = 1;
            });
            // Migrate checkpoint_runners: copy markOffTime → actualTime
            tx.table('checkpoint_runners').toCollection().modify(cp => {
                if (!cp.actualTime && cp.markOffTime) cp.actualTime = cp.markOffTime;
                if (cp.calledIn === undefined) cp.calledIn = false;
            });
            // Migrate base_station_runners: set markOffEntryTime default
            tx.table('base_station_runners').toCollection().modify(bs => {
                if (!bs.markOffEntryTime) bs.markOffEntryTime = null;
            });
        });

    // Version 11: VK4WIP redesign (additive only — no data rewritten, no .upgrade()).
    //  checkpoint_runners: index `correction`; new data columns originalTime, editedAt,
    //    unmarkedAt, unmarkedTime (restore after an accidental unmark)
    //  base_station_runners: index `callId` (Undo a received call); data column manualTime
    //  radio_calls: one row per base Receive call {blocks, recorded, skipped, rejected, undoneAt}
    //  data_issue_resolutions: resolved base data-check issues {issueKey, resolution}
    //  readout_progress: resume an interrupted checkpoint read-out {tickedNumbers, overIndex}
    //  races / checkpoints / withdrawal_records gain nullable data columns only
    //    (baseCallsign, frequency, callDueMinutes, overSize; operatorCallsigns, distanceKm,
    //    locationName; reason) — no index needed.
    this.version(11)
        .stores({
            checkpoint_runners: "++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, actualTime, commonTime, calledIn, markOffTime, callInTime, status, notes, correction",
            base_station_runners: "++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, commonTime, markOffEntryTime, status, notes, callId",
            radio_calls: "++id, [raceId+checkpointNumber], raceId, checkpointNumber, receivedAt, undoneAt",
            data_issue_resolutions: "++id, [raceId+issueKey], raceId, issueKey, resolvedAt",
            readout_progress: "++id, [raceId+checkpointNumber+blockTime], raceId, checkpointNumber, blockTime"
        });

    // Version 9: Add GPS course data to races and checkpoint coordinates (non-breaking, additive)
    this.version(10)
        .stores({
            races: "++id, name, date, startTime, minRunner, maxRunner, createdAt",
            runners: "++id, [raceId+number], raceId, number, gender, batchNumber, status, recordedTime, notes",
            checkpoints: "++id, [raceId+number], raceId, number, name",
            // allowedBatches added as a data column (no index needed, nullable = all waves)
        });
        // No .upgrade() needed: allowedBatches is nullable, existing checkpoints default to undefined (all waves).

    this.version(9)
        .stores({
            races: "++id, name, date, startTime, minRunner, maxRunner, createdAt",
            runners: "++id, [raceId+number], raceId, number, gender, batchNumber, status, recordedTime, notes",
            checkpoints: "++id, [raceId+number], raceId, number, name",
            checkpoint_runners: "++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, actualTime, commonTime, calledIn, markOffTime, callInTime, status, notes",
            base_station_runners: "++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, commonTime, markOffEntryTime, status, notes",
            settings: "key, value",
            deleted_entries: "++id, raceId, entryType, deletedAt, restorable",
            strapper_calls: "++id, [raceId+checkpoint], raceId, checkpoint, status, priority, createdAt",
            audit_log: "++id, raceId, entityType, action, performedAt",
            withdrawal_records: "++id, [raceId+runnerNumber], raceId, runnerNumber, checkpoint, withdrawalTime, reversedAt",
            vet_out_records: "++id, [raceId+runnerNumber], raceId, runnerNumber, checkpoint, vetOutTime",
            imported_checkpoint_results: "++id, [raceId+checkpointNumber], raceId, checkpointNumber, importedAt",
            race_batches: "++id, [raceId+batchNumber], raceId, batchNumber, batchName, startTime"
            // courseGpx, courseBounds added to races as data columns (no index needed)
            // latitude, longitude added to checkpoints as data columns (no index needed)
        });
        // No .upgrade() needed: new GPS fields are nullable, existing records unaffected.
  }
}

const db = new RaceTrackerDB();

export default db;
