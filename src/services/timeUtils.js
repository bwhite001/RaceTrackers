import { format, parseISO, addMinutes, startOfMinute } from 'date-fns';

/**
 * Utility functions for time management in the race tracker
 */

export class TimeUtils {
  /**
   * Get current timestamp as ISO string
   */
  static getCurrentTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format timestamp for display
   */
  static formatTime(timestamp, formatString = 'HH:mm:ss') {
    if (!timestamp) return '--:--:--';
    try {
      return format(parseISO(timestamp), formatString);
    } catch (error) {
      console.error('Error formatting time:', error);
      return '--:--:--';
    }
  }

  /**
   * Format date for display
   */
  static formatDate(timestamp, formatString = 'MMM dd, yyyy') {
    if (!timestamp) return '';
    try {
      return format(parseISO(timestamp), formatString);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  /**
   * Format duration between two timestamps
   */
  static formatDuration(startTime, endTime) {
    if (!startTime || !endTime) return '--:--:--';
    
    try {
      const start = parseISO(startTime);
      const end = parseISO(endTime);
      const diffMs = end.getTime() - start.getTime();
      
      if (diffMs < 0) return '--:--:--';
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error formatting duration:', error);
      return '--:--:--';
    }
  }

  /**
   * Create a timestamp from race date and time
   */
  static createRaceTimestamp(raceDate, raceTime) {
    try {
      // raceDate is in YYYY-MM-DD format
      // raceTime is in HH:MM format
      const dateTimeString = `${raceDate}T${raceTime}:00`;
      return new Date(dateTimeString).toISOString();
    } catch (error) {
      console.error('Error creating race timestamp:', error);
      return new Date().toISOString();
    }
  }

  /**
   * Get the start of a 5-minute segment for a given timestamp
   */
  static getSegmentStart(timestamp, segmentMinutes = 5) {
    try {
      const date = parseISO(timestamp);
      const minutes = date.getMinutes();
      const segmentStart = Math.floor(minutes / segmentMinutes) * segmentMinutes;
      
      const segmentDate = new Date(date);
      segmentDate.setMinutes(segmentStart, 0, 0);
      
      return segmentDate.toISOString();
    } catch (error) {
      console.error('Error getting segment start:', error);
      return timestamp;
    }
  }

  /**
   * Get the end of a 5-minute segment for a given timestamp
   */
  static getSegmentEnd(timestamp, segmentMinutes = 5) {
    try {
      const segmentStart = this.getSegmentStart(timestamp, segmentMinutes);
      const segmentStartDate = parseISO(segmentStart);
      const segmentEnd = addMinutes(segmentStartDate, segmentMinutes);
      
      return segmentEnd.toISOString();
    } catch (error) {
      console.error('Error getting segment end:', error);
      return timestamp;
    }
  }

  /**
   * Generate a segment key for grouping
   */
  static getSegmentKey(timestamp, segmentMinutes = 5) {
    const start = this.getSegmentStart(timestamp, segmentMinutes);
    const end = this.getSegmentEnd(timestamp, segmentMinutes);
    return `${start}/${end}`;
  }

  /**
   * Group runners by time segments
   */
  static groupRunnersBySegments(runners, segmentMinutes = 5) {
    const segments = new Map();
    
    runners
      .filter(runner => runner.status === 'passed' && runner.recordedTime)
      .forEach(runner => {
        const segmentKey = this.getSegmentKey(runner.recordedTime, segmentMinutes);
        
        if (!segments.has(segmentKey)) {
          const [startTime, endTime] = segmentKey.split('/');
          segments.set(segmentKey, {
            startTime,
            endTime,
            runners: [],
            called: false
          });
        }
        
        segments.get(segmentKey).runners.push(runner);
      });
    
    // Sort segments by start time
    return Array.from(segments.values()).sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  /**
   * Check if a timestamp falls within a segment
   */
  static isTimestampInSegment(timestamp, segmentStart, segmentEnd) {
    try {
      const time = parseISO(timestamp);
      const start = parseISO(segmentStart);
      const end = parseISO(segmentEnd);
      
      return time >= start && time < end;
    } catch (error) {
      console.error('Error checking timestamp in segment:', error);
      return false;
    }
  }

  /**
   * Get elapsed time since race start
   */
  static getElapsedTime(raceStartTimestamp, currentTimestamp = null) {
    const current = currentTimestamp || this.getCurrentTimestamp();
    return this.formatDuration(raceStartTimestamp, current);
  }

  /**
   * Calculate runner's pace (time per mile/km)
   */
  static calculatePace(startTime, endTime, distance) {
    if (!startTime || !endTime || !distance || distance <= 0) {
      return '--:--';
    }
    
    try {
      const start = parseISO(startTime);
      const end = parseISO(endTime);
      const durationMs = end.getTime() - start.getTime();
      
      if (durationMs <= 0) return '--:--';
      
      const paceMs = durationMs / distance;
      const paceMinutes = Math.floor(paceMs / (1000 * 60));
      const paceSeconds = Math.floor((paceMs % (1000 * 60)) / 1000);
      
      return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error calculating pace:', error);
      return '--:--';
    }
  }

  /**
   * Parse time input (HH:MM or HH:MM:SS) and return in HH:MM format
   */
  static parseTimeInput(timeString) {
    if (!timeString) return '';
    
    const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
    const match = timeString.match(timeRegex);
    
    if (!match) return '';
    
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    
    if (hours > 23 || minutes > 59) return '';
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Validate date string (YYYY-MM-DD format)
   */
  static validateDateString(dateString) {
    if (!dateString) return false;
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    
    try {
      const date = new Date(dateString);
      return date.toISOString().startsWith(dateString);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  static getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Get current time in HH:MM format
   */
  static getCurrentTimeString() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  /**
   * Convert local datetime-local input to ISO string
   */
  static datetimeLocalToISO(datetimeLocal) {
    if (!datetimeLocal) return null;
    
    try {
      // datetime-local format: YYYY-MM-DDTHH:MM
      const date = new Date(datetimeLocal);
      return date.toISOString();
    } catch (error) {
      console.error('Error converting datetime-local to ISO:', error);
      return null;
    }
  }

  /**
   * Convert ISO string to datetime-local format
   */
  static isoToDatetimeLocal(isoString) {
    if (!isoString) return '';
    
    try {
      const date = parseISO(isoString);
      // Format as YYYY-MM-DDTHH:MM for datetime-local input
      return format(date, "yyyy-MM-dd'T'HH:mm");
    } catch (error) {
      console.error('Error converting ISO to datetime-local:', error);
      return '';
    }
  }

  /**
   * Get time zone offset string
   */
  static getTimezoneOffset() {
    const offset = new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset <= 0 ? '+' : '-';
    
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Check if a time is within business hours (for notifications)
   */
  static isBusinessHours(timestamp = null) {
    const time = timestamp ? parseISO(timestamp) : new Date();
    const hour = time.getHours();
    return hour >= 6 && hour <= 22; // 6 AM to 10 PM
  }
}

export default TimeUtils;
