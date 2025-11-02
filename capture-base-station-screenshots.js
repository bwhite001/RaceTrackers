/**
 * Screenshot Capture Script for Base Station User Guide
 * 
 * This script captures screenshots for all user stories and workflows
 * in the Base Station Operations module.
 */

const screenshots = [
  {
    name: 'base-station-01-homepage',
    description: 'Homepage with Base Station Operations card',
    url: 'http://localhost:3001',
    actions: []
  },
  {
    name: 'base-station-02-runner-grid-tab',
    description: 'Runner Grid tab - main tracking interface',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'wait', selector: '[data-tab="grid"]' }
    ]
  },
  {
    name: 'base-station-03-data-entry-tab',
    description: 'Data Entry tab with quick actions',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="data-entry"]' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-04-withdrawal-dialog',
    description: 'Withdrawal Dialog for marking runners as withdrawn',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="data-entry"]' },
      { type: 'click', selector: 'button:contains("Withdraw Runner")' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-05-vet-out-dialog',
    description: 'Vet-Out Dialog for marking runners as vetted out',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="data-entry"]' },
      { type: 'click', selector: 'button:contains("Vet Out Runner")' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-06-log-operations-tab',
    description: 'Log Operations tab for entry management',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="log-ops"]' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-07-duplicates-dialog',
    description: 'Duplicate Entries Dialog showing side-by-side comparison',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="log-ops"]' },
      { type: 'click', selector: 'button:contains("View Duplicates")' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-08-deleted-entries-view',
    description: 'Deleted Entries View showing audit trail',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="log-ops"]' },
      { type: 'click', selector: 'button:contains("View Deleted")' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-09-lists-reports-tab',
    description: 'Lists & Reports tab with missing numbers',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="lists"]' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-10-missing-numbers-list',
    description: 'Missing Numbers List showing runners not at checkpoint',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="lists"]' },
      { type: 'wait', duration: 500 },
      { type: 'scroll', direction: 'down' }
    ]
  },
  {
    name: 'base-station-11-out-list',
    description: 'Out List showing withdrawn and vetted out runners',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="lists"]' },
      { type: 'click', selector: 'button:contains("Out List")' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-12-reports-panel',
    description: 'Reports Panel with generation and export options',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="lists"]' },
      { type: 'scroll', direction: 'down' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-13-housekeeping-tab',
    description: 'Housekeeping tab with strapper calls and backup',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="housekeeping"]' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-14-strapper-calls-panel',
    description: 'Strapper Calls Panel for resource management',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="housekeeping"]' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-15-backup-dialog',
    description: 'Backup & Restore Dialog',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="housekeeping"]' },
      { type: 'click', selector: 'button:contains("Backup Now")' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-16-help-dialog',
    description: 'Help Dialog with comprehensive documentation',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: 'button:contains("Help")' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-17-about-dialog',
    description: 'About Dialog with system information',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="housekeeping"]' },
      { type: 'click', selector: 'button:contains("About")' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-18-overview-tab',
    description: 'Overview tab with status management',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="overview"]' },
      { type: 'wait', duration: 500 }
    ]
  }
];

console.log('Screenshot capture plan created');
console.log(`Total screenshots to capture: ${screenshots.length}`);
console.log('\nScreenshots:');
screenshots.forEach((shot, index) => {
  console.log(`${index + 1}. ${shot.name} - ${shot.description}`);
});

module.exports = screenshots;
