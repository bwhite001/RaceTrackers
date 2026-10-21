import useRaceMaintenanceStore from '../../modules/race-maintenance/store/raceMaintenanceStore';
import useCheckpointStore from '../../modules/checkpoint-operations/store/checkpointStore';
import useNow from '../../shared/hooks/useNow';
import TimeUtils from '../../services/timeUtils.js';
import { earliestTime } from '../../services/blocks.js';

/**
 * Race + checkpoint details every checkpoint tab needs: the live clock, the
 * earliest allowed time (race start), labels and callsigns from race config.
 */
export default function useCheckpointContext() {
  const { currentRace: race, checkpoints = [] } = useRaceMaintenanceStore();
  const { checkpointNumber } = useCheckpointStore();
  const now = useNow();
  const checkpoint = checkpoints.find(cp => cp.number === checkpointNumber) ?? null;
  const raceStart = race?.date && race?.startTime
    ? TimeUtils.createRaceTimestamp(race.date, race.startTime.slice(0, 5))
    : null;
  const operators = checkpoint?.operatorCallsigns ?? [];
  return {
    race,
    checkpoint,
    checkpointNumber,
    now,
    raceStart,
    earliest: earliestTime(raceStart, now),
    shortName: `CP${checkpointNumber ?? ''}`,
    location: checkpoint?.locationName || checkpoint?.name || '',
    operator: operators[0] ?? '',
    baseCallsign: race?.baseCallsign || 'VK4WIP',
    frequency: race?.frequency || '',
    callDueMinutes: race?.callDueMinutes ?? 5,
    overSize: race?.overSize ?? 5,
  };
}
