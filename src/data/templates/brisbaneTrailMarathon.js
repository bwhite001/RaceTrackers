/**
 * Brisbane Trail Marathon Template
 * 
 * Annual trail marathon starting and finishing at Enoggera Reservoir, The Gap
 * 
 * Event Details:
 * - Distance: 22km and 42km options
 * - Terrain: Trail running
 * - Checkpoints: 5 (including start/finish)
 * - Typical Runners: 150-200
 */

export const brisbaneTrailMarathon = {
  // Template Metadata
  id: 'brisbane-trail-marathon',
  name: 'Brisbane Trail Marathon',
  eventType: 'Trail Marathon',
  description: 'Annual trail marathon starting and finishing at Enoggera Reservoir, The Gap. 22km and 42km distance options.',
  
  // Default Race Configuration
  defaultStartTime: '06:30:00',
  defaultRunnerRangeStart: 1,
  defaultRunnerRangeEnd: 200,
  
  // Checkpoint Configuration
  checkpoints: [
    {
      number: 1,
      name: 'Start - Enoggera Reservoir',
      location: '-27.4447, 152.9556',
      orderSequence: 1,
      metadata: {
        operators: ['VK4HIT (Allan)'],
        description: 'Race start location at reservoir',
        terrain: 'Reservoir area',
        facilities: ['Water station', 'Toilets', 'Parking']
      }
    },
    {
      number: 2,
      name: 'CP1 - Mt Nebo Road',
      location: '-27.3875, 152.9123',
      orderSequence: 2,
      metadata: {
        operators: ['VK4SIR (Peter)', 'VK4SQL (Stephen)'],
        description: 'First checkpoint on Mt Nebo Road',
        terrain: 'Road checkpoint',
        facilities: ['Water station', 'First aid']
      }
    },
    {
      number: 3,
      name: 'CP2 - Walkabout Creek',
      location: '-27.4123, 152.9345',
      orderSequence: 3,
      metadata: {
        operators: ['VK4IE (John)', 'VK4AJJ (Andrew)'],
        description: 'Mid-course checkpoint',
        terrain: 'Creek area',
        facilities: ['Water station', 'First aid']
      }
    },
    {
      number: 4,
      name: 'CP3 - Simpson Falls',
      location: '-27.4289, 152.9478',
      orderSequence: 4,
      metadata: {
        operators: ['VK4SMA (Mark)', 'VK4TMK (Trish)'],
        description: 'Simpson Falls checkpoint',
        terrain: 'Falls area',
        facilities: ['Water station', 'First aid']
      }
    },
    {
      number: 5,
      name: 'Finish - Enoggera Reservoir',
      location: '-27.4447, 152.9556',
      orderSequence: 5,
      metadata: {
        operators: ['VK4BRW (Brandon)', 'VK4GJW (Greg)'],
        description: 'Finish line at reservoir',
        terrain: 'Reservoir area',
        facilities: ['Water station', 'First aid', 'Food', 'Medical', 'Toilets']
      }
    }
  ],
  
  // Race Metadata
  metadata: {
    organizer: 'WICEN Queensland',
    callsign: 'VK4WIP',
    baseLocation: 'Enoggera Reservoir, The Gap',
    baseGPS: '-27.4447, 152.9556',
    baseOperators: ['VK4BRW (Brandon)', 'VK4GJW (Greg)'],
    frequencies: {
      primary: '147.175 MHz (+offset)',
      fallback: '147.500 MHz'
    },
    baseOperationalBy: '0600 hrs',
    historicalDates: ['2024-04-28', '2025-04-27'],
    notes: [
      'Base station must be operational by 0600 hrs',
      'Early start time - operators arrive by 0530 hrs',
      'Good mobile coverage at most checkpoints',
      'Parking available at Enoggera Reservoir',
      'Two distance options: 22km and 42km'
    ],
    equipment: [
      'VHF radios (147.175 MHz)',
      'Backup radios (147.500 MHz)',
      'First aid kits at all checkpoints',
      'Runner tracking sheets',
      'Emergency contact list',
      'Distance markers for 22km/42km splits'
    ]
  },
  
  // Template Version
  version: '1.0.0',
  createdAt: '2025-01-01T00:00:00.000Z',
  lastUpdated: '2025-01-01T00:00:00.000Z'
};

export default brisbaneTrailMarathon;
