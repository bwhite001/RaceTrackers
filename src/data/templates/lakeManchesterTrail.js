/**
 * Lake Manchester Trail Template
 * 
 * Scenic trail run around Lake Manchester with multiple distance options
 * 
 * Event Details:
 * - Distance: 12km, 23km, 42km options
 * - Terrain: Lake trails
 * - Checkpoints: 3
 * - Typical Runners: 80-120
 */

export const lakeManchesterTrail = {
  // Template Metadata
  id: 'lake-manchester-trail',
  name: 'Lake Manchester Trail',
  eventType: 'Trail Run',
  description: 'Scenic trail run around Lake Manchester with multiple distance options (12km, 23km, 42km)',
  
  // Default Race Configuration
  defaultStartTime: '07:00:00',
  defaultRunnerRangeStart: 1,
  defaultRunnerRangeEnd: 120,
  
  // Checkpoint Configuration
  checkpoints: [
    {
      number: 1,
      name: 'CP1 - Northern Trail',
      location: '-27.4867, 152.7534',
      orderSequence: 1,
      metadata: {
        operators: ['VK4SIR (Peter)', 'VK4SQL (Stephen)'],
        description: 'First checkpoint on northern trail',
        terrain: 'Trail section',
        facilities: ['Water station', 'First aid']
      }
    },
    {
      number: 2,
      name: 'CP2 - Eastern Shore',
      location: '-27.4923, 152.7689',
      orderSequence: 2,
      metadata: {
        operators: ['VK4IE (John)', 'VK4AJJ (Andrew)'],
        description: 'Eastern shore checkpoint',
        terrain: 'Lakeside trail',
        facilities: ['Water station', 'First aid']
      }
    },
    {
      number: 3,
      name: 'CP3 - Southern Loop',
      location: '-27.5078, 152.7456',
      orderSequence: 3,
      metadata: {
        operators: ['VK4SMA (Mark)', 'VK4TMK (Trish)'],
        description: 'Southern loop checkpoint',
        terrain: 'Trail section',
        facilities: ['Water station', 'First aid']
      }
    }
  ],
  
  // Race Metadata
  metadata: {
    organizer: 'WICEN Queensland',
    callsign: 'VK4WIP',
    baseLocation: 'Lake Manchester Dam Wall',
    baseGPS: '-27.4989, 152.7423',
    baseOperators: ['VK4BRW (Brandon)', 'VK4GJW (Greg)'],
    frequencies: {
      primary: '147.175 MHz (+offset)',
      fallback: '147.500 MHz'
    },
    baseOperationalBy: '0630 hrs',
    historicalDates: ['2024-08-18', '2025-08-17'],
    notes: [
      'Base station must be operational by 0630 hrs',
      'Three distance options: 12km, 23km, 42km',
      'Good mobile coverage around lake',
      'Parking available at dam wall',
      'Scenic course with lake views',
      'Distance markers for all three options'
    ],
    equipment: [
      'VHF radios (147.175 MHz)',
      'Backup radios (147.500 MHz)',
      'First aid kits at all checkpoints',
      'Runner tracking sheets',
      'Emergency contact list',
      'Distance markers for 12km/23km/42km splits'
    ]
  },
  
  // Template Version
  version: '1.0.0',
  createdAt: '2025-01-01T00:00:00.000Z',
  lastUpdated: '2025-01-01T00:00:00.000Z'
};

export default lakeManchesterTrail;
