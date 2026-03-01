/**
 * Pinnacles Classic Template
 * 
 * Challenging trail run through Gold Creek and Mt Glorious areas
 * 
 * Event Details:
 * - Distance: Multiple options
 * - Terrain: Challenging trails
 * - Checkpoints: 3
 * - Typical Runners: 100-150
 */

export const pinnaclesClassic = {
  // Template Metadata
  id: 'pinnacles-classic',
  name: 'Pinnacles Classic',
  eventType: 'Trail Run',
  description: 'Challenging trail run through Gold Creek and Mt Glorious areas. Multiple distance options.',
  
  // Default Race Configuration
  defaultStartTime: '06:30:00',
  defaultRunnerRangeStart: 1,
  defaultRunnerRangeEnd: 150,
  
  // Checkpoint Configuration
  checkpoints: [
    {
      number: 1,
      name: 'CP1 - Mt Glorious Road Junction',
      location: '-27.3423, 152.7889',
      orderSequence: 1,
      metadata: {
        operators: ['VK4SIR (Peter)', 'VK4SQL (Stephen)'],
        description: 'First checkpoint at road junction',
        terrain: 'Road junction',
        facilities: ['Water station', 'First aid']
      }
    },
    {
      number: 2,
      name: 'CP2 - Pinnacles Lookout',
      location: '-27.3156, 152.7734',
      orderSequence: 2,
      metadata: {
        operators: ['VK4IE (John)', 'VK4AJJ (Andrew)'],
        description: 'Pinnacles lookout checkpoint',
        terrain: 'Mountain lookout',
        facilities: ['Water station', 'First aid']
      }
    },
    {
      number: 3,
      name: 'CP3 - Return Trail',
      location: '-27.3567, 152.8123',
      orderSequence: 3,
      metadata: {
        operators: ['VK4SMA (Mark)', 'VK4TMK (Trish)'],
        description: 'Return trail checkpoint',
        terrain: 'Trail section',
        facilities: ['Water station', 'First aid']
      }
    }
  ],
  
  // Race Metadata
  metadata: {
    organizer: 'WICEN Queensland',
    callsign: 'VK4WIP',
    baseLocation: 'Gold Creek Reservoir Car Park',
    baseGPS: '-27.3894, 152.8556',
    baseOperators: ['VK4BRW (Brandon)', 'VK4GJW (Greg)'],
    frequencies: {
      primary: '147.175 MHz (+offset)',
      fallback: '147.500 MHz'
    },
    baseOperationalBy: '0600 hrs',
    historicalDates: ['2024-06-16', '2025-06-15'],
    notes: [
      'Base station must be operational by 0600 hrs',
      'Challenging terrain - ensure all operators are prepared',
      'Limited mobile coverage at Pinnacles Lookout',
      'Parking available at Gold Creek Reservoir',
      'Weather can change quickly at elevation'
    ],
    equipment: [
      'VHF radios (147.175 MHz)',
      'Backup radios (147.500 MHz)',
      'First aid kits at all checkpoints',
      'Runner tracking sheets',
      'Emergency contact list',
      'Weather monitoring equipment'
    ]
  },
  
  // Template Version
  version: '1.0.0',
  createdAt: '2025-01-01T00:00:00.000Z',
  lastUpdated: '2025-01-01T00:00:00.000Z'
};

export default pinnaclesClassic;
