import { useEffect, useState } from 'react';
import TimeUtils from '../../services/timeUtils.js';

/** Current time as an ISO string, refreshed every `intervalMs` (default 15 s). */
export default function useNow(intervalMs = 15000) {
  const [now, setNow] = useState(TimeUtils.getCurrentTimestamp());
  useEffect(() => {
    const t = setInterval(() => setNow(TimeUtils.getCurrentTimestamp()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
