/**
 * Mt Glorious Mountain Trail Template
 * 
 * Annual mountain trail race finishing at Maiala Park, Mt Glorious
 * Created from 2025 race data
 * 
 * Event Details:
 * - Distance: Multiple options (typically 22km, 42km)
 * - Terrain: Mountain trails
 * - Checkpoints: 5 (including start/finish)
 * - Typical Runners: 100-128
 */

export const mtGloriousTemplate = {
  // Template Metadata
  id: 'mt-glorious-mountain-trail',
  name: 'Mt Glorious Mountain Trail',
  eventType: 'Mountain Trail Run',
  description: 'Mountain trail race finishing at Maiala Park, Mt Glorious. Multiple distance options with challenging terrain.',
  
  // Default Race Configuration
  defaultStartTime: '07:00:00',
  defaultRunnerRangeStart: 1,
  defaultRunnerRangeEnd: 128,
  
  // Checkpoint Configuration
  checkpoints: [
    {
      number: 1,
      name: 'CP1 - Northbrook Bush Camp',
      location: '-27.321677, 152.714852',
      orderSequence: 1,
      metadata: {
        operators: ['VK4SIR (Peter)', 'VK4MKD (David)', 'VK4SQL (Stephen)'],
        description: 'First checkpoint at Northbrook Bush Camp',
        terrain: 'Bush camp area',
        facilities: ['Water station', 'First aid']
      }
    },
    {
      number: 2,
      name: 'CP2 - England Creek Bush Camp',
      location: '-27.345838, 152.730526',
      orderSequence: 2,
      metadata: {
        operators: ['VK4IE (John)', 'VK4AL (Alan T.)', 'VK4AJJ (Andrew)'],
        description: 'Mid-course checkpoint at England Creek',
        terrain: 'Creek crossing area',
        facilities: ['Water station', 'First aid']
      }
    },
    {
      number: 3,
      name: 'CP3 - England Creek Rd & Joyners Ridge Rd',
      location: '-27.366238, 152.730747',
      orderSequence: 3,
      metadata: {
        operators: ['VK4SMA (Mark)', 'VK4TMK (Trish)'],
        description: 'Road junction checkpoint',
        terrain: 'Road junction',
        facilities: ['Water station', 'First aid']
      }
    },
    {
      number: 4,
      name: 'CP4 - Near Apiary Site, Joyners Ridge Rd',
      location: '-27.346490, 152.750306',
      orderSequence: 4,
      metadata: {
        operators: ['VK4ALG (Alan)', 'VK4TBA (Ben)'],
        description: 'Final checkpoint before finish',
        terrain: 'Ridge road',
        facilities: ['Water station', 'First aid']
      }
    },
    {
      number: 5,
      name: 'Finish - Maiala Picnic Area',
      location: '-27.320035, 152.750278',
      orderSequence: 5,
      metadata: {
        operators: ['VK4BRW (Brandon)', 'VK4GJW (Greg)'],
        description: 'Finish line at Maiala Park',
        terrain: 'Picnic area',
        facilities: ['Water station', 'First aid', 'Food', 'Medical']
      }
    }
  ],
  
  // Race Metadata
  metadata: {
    organizer: 'WICEN Queensland',
    callsign: 'VK4WIP',
    baseLocation: 'Maiala Picnic Area, Mt Glorious Rd, Mt Glorious',
    baseGPS: '-27.320035, 152.750278',
    baseOperators: ['VK4BRW (Brandon)', 'VK4GJW (Greg)'],
    frequencies: {
      primary: '147.175 MHz (+offset)',
      fallback: '147.500 MHz'
    },
    baseOperationalBy: '0630 hrs',
    historicalDates: ['2024-11-10', '2025-11-09'],
    notes: [
      'Base station must be operational by 0630 hrs',
      'All operators should arrive 30 minutes before race start',
      'Checkpoint operators need 4WD vehicles for access',
      'Mobile coverage is limited in some areas - rely on radio'
    ],
    equipment: [
      'VHF radios (147.175 MHz)',
      'Backup radios (147.500 MHz)',
      'First aid kits at all checkpoints',
      'Runner tracking sheets',
      'Emergency contact list'
    ]
  },
  
  // Template Version
  version: '1.0.0',
  createdAt: '2025-01-01T00:00:00.000Z',
  lastUpdated: '2025-01-01T00:00:00.000Z'
};

export default mtGloriousTemplate;
