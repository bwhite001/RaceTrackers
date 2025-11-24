/**
 * Manual Testing Script for Race Template System
 * 
 * This script provides comprehensive manual testing for the template system.
 * Run this in the browser console or as a Node.js script to verify functionality.
 * 
 * Usage:
 * 1. Open browser console in the running app
 * 2. Copy and paste this entire script
 * 3. Run: await runAllTests()
 */

// Import statements (adjust paths as needed for your environment)
import RaceTemplateService from '../../src/services/RaceTemplateService.js';
import StorageService from '../../src/services/storage.js';
import { templates } from '../../src/data/templates/index.js';

// Test Results Tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  if (details) console.log(`   ${details}`);
  
  testResults.tests.push({ testName, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

// Helper function to print summary
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.tests.length}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(60) + '\n');
  
  if (testResults.failed > 0) {
    console.log('Failed Tests:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`  - ${t.testName}: ${t.details}`));
  }
}

// ============================================================================
// TEST SUITE 1: Template Data Integrity
// ============================================================================

async function testTemplateDataIntegrity() {
  console.log('\n📋 TEST SUITE 1: Template Data Integrity\n');
  
  // Test 1.1: All templates exist
  try {
    const allTemplates = RaceTemplateService.getAllTemplates();
    logTest(
      '1.1: All 4 templates exist',
      allTemplates.length === 4,
      `Found ${allTemplates.length} templates`
    );
  } catch (error) {
    logTest('1.1: All 4 templates exist', false, error.message);
  }
  
  // Test 1.2: Mt Glorious template structure
  try {
    const mtGlorious = RaceTemplateService.getTemplateById('mt-glorious-mountain-trail');
    const hasRequiredFields = 
      mtGlorious &&
      mtGlorious.id === 'mt-glorious-mountain-trail' &&
      mtGlorious.name === 'Mt Glorious Mountain Trail' &&
      mtGlorious.eventType === 'Mountain Trail Run' &&
      mtGlorious.checkpoints.length === 5 &&
      mtGlorious.defaultRunnerRangeStart === 1 &&
      mtGlorious.defaultRunnerRangeEnd === 128;
    
    logTest(
      '1.2: Mt Glorious template has correct structure',
      hasRequiredFields,
      `Checkpoints: ${mtGlorious?.checkpoints.length}, Runners: ${mtGlorious?.defaultRunnerRangeStart}-${mtGlorious?.defaultRunnerRangeEnd}`
    );
  } catch (error) {
    logTest('1.2: Mt Glorious template structure', false, error.message);
  }
  
  // Test 1.3: All templates have GPS coordinates
  try {
    const allTemplates = RaceTemplateService.getAllTemplates();
    const allHaveGPS = allTemplates.every(template =>
      template.checkpoints.every(cp => cp.location && cp.location.includes(','))
    );
    
    logTest(
      '1.3: All templates have GPS coordinates',
      allHaveGPS,
      allHaveGPS ? 'All checkpoints have GPS' : 'Some checkpoints missing GPS'
    );
  } catch (error) {
    logTest('1.3: GPS coordinates check', false, error.message);
  }
  
  // Test 1.4: All templates have operator assignments
  try {
    const allTemplates = RaceTemplateService.getAllTemplates();
    const allHaveOperators = allTemplates.every(template =>
      template.checkpoints.every(cp => 
        cp.metadata?.operators && Array.isArray(cp.metadata.operators) && cp.metadata.operators.length > 0
      )
    );
    
    logTest(
      '1.4: All templates have operator assignments',
      allHaveOperators,
      allHaveOperators ? 'All checkpoints have operators' : 'Some checkpoints missing operators'
    );
  } catch (error) {
    logTest('1.4: Operator assignments check', false, error.message);
  }
  
  // Test 1.5: All templates have metadata
  try {
    const allTemplates = RaceTemplateService.getAllTemplates();
    const allHaveMetadata = allTemplates.every(template =>
      template.metadata &&
      template.metadata.organizer &&
      template.metadata.baseLocation &&
      template.metadata.frequencies
    );
    
    logTest(
      '1.5: All templates have complete metadata',
      allHaveMetadata,
      allHaveMetadata ? 'All templates have metadata' : 'Some templates missing metadata'
    );
  } catch (error) {
    logTest('1.5: Metadata check', false, error.message);
  }
}

// ============================================================================
// TEST SUITE 2: Service Layer Functionality
// ============================================================================

async function testServiceLayerFunctionality() {
  console.log('\n⚙️  TEST SUITE 2: Service Layer Functionality\n');
  
  // Test 2.1: getTemplateById works
  try {
    const template = RaceTemplateService.getTemplateById('brisbane-trail-marathon');
    logTest(
      '2.1: getTemplateById returns correct template',
      template && template.name === 'Brisbane Trail Marathon',
      template ? `Found: ${template.name}` : 'Template not found'
    );
  } catch (error) {
    logTest('2.1: getTemplateById', false, error.message);
  }
  
  // Test 2.2: getTemplateByName works
  try {
    const template = RaceTemplateService.getTemplateByName('Pinnacles Classic');
    logTest(
      '2.2: getTemplateByName returns correct template',
      template && template.id === 'pinnacles-classic',
      template ? `Found: ${template.id}` : 'Template not found'
    );
  } catch (error) {
    logTest('2.2: getTemplateByName', false, error.message);
  }
  
  // Test 2.3: getTemplatesByEventType filters correctly
  try {
    const trailRuns = RaceTemplateService.getTemplatesByEventType('Trail Run');
    logTest(
      '2.3: getTemplatesByEventType filters correctly',
      trailRuns.length >= 2,
      `Found ${trailRuns.length} Trail Run templates`
    );
  } catch (error) {
    logTest('2.3: getTemplatesByEventType', false, error.message);
  }
  
  // Test 2.4: validateTemplate validates correctly
  try {
    const template = RaceTemplateService.getTemplateById('mt-glorious-mountain-trail');
    const validation = RaceTemplateService.validateTemplate(template);
    logTest(
      '2.4: validateTemplate validates Mt Glorious',
      validation.isValid && validation.errors.length === 0,
      validation.isValid ? 'Valid' : `Errors: ${validation.errors.join(', ')}`
    );
  } catch (error) {
    logTest('2.4: validateTemplate', false, error.message);
  }
  
  // Test 2.5: validateTemplate catches invalid templates
  try {
    const invalidTemplate = { name: 'Test', checkpoints: [] };
    const validation = RaceTemplateService.validateTemplate(invalidTemplate);
    logTest(
      '2.5: validateTemplate catches invalid templates',
      !validation.isValid && validation.errors.length > 0,
      `Found ${validation.errors.length} validation errors`
    );
  } catch (error) {
    logTest('2.5: validateTemplate invalid', false, error.message);
  }
  
  // Test 2.6: exportTemplateAsJSON works
  try {
    const template = RaceTemplateService.getTemplateById('lake-manchester-trail');
    const json = RaceTemplateService.exportTemplateAsJSON(template);
    const parsed = JSON.parse(json);
    logTest(
      '2.6: exportTemplateAsJSON creates valid JSON',
      parsed && parsed.id === 'lake-manchester-trail',
      `JSON length: ${json.length} characters`
    );
  } catch (error) {
    logTest('2.6: exportTemplateAsJSON', false, error.message);
  }
  
  // Test 2.7: getTemplateStatistics returns correct data
  try {
    const template = RaceTemplateService.getTemplateById('mt-glorious-mountain-trail');
    const stats = RaceTemplateService.getTemplateStatistics(template);
    logTest(
      '2.7: getTemplateStatistics returns correct data',
      stats.checkpointCount === 5 && stats.defaultRunnerCount === 128,
      `Checkpoints: ${stats.checkpointCount}, Runners: ${stats.defaultRunnerCount}`
    );
  } catch (error) {
    logTest('2.7: getTemplateStatistics', false, error.message);
  }
  
  // Test 2.8: searchTemplates finds templates
  try {
    const results = RaceTemplateService.searchTemplates('glorious');
    logTest(
      '2.8: searchTemplates finds templates by keyword',
      results.length > 0 && results[0].name.includes('Glorious'),
      `Found ${results.length} results`
    );
  } catch (error) {
    logTest('2.8: searchTemplates', false, error.message);
  }
}

// ============================================================================
// TEST SUITE 3: Race Creation from Templates
// ============================================================================

async function testRaceCreationFromTemplates() {
  console.log('\n🏁 TEST SUITE 3: Race Creation from Templates\n');
  
  // Test 3.1: Create race from Mt Glorious template with defaults
  try {
    const template = RaceTemplateService.getTemplateById('mt-glorious-mountain-trail');
    const raceId = await RaceTemplateService.createRaceFromTemplate(template, {
      raceDate: '2025-11-09'
    });
    
    const race = await StorageService.getRace(raceId);
    const checkpoints = await StorageService.getCheckpoints(raceId);
    
    logTest(
      '3.1: Create race from Mt Glorious with defaults',
      race && checkpoints.length === 5,
      `Race ID: ${raceId}, Checkpoints: ${checkpoints.length}`
    );
    
    // Cleanup
    await StorageService.deleteRace(raceId);
  } catch (error) {
    logTest('3.1: Create race with defaults', false, error.message);
  }
  
  // Test 3.2: Create race with custom name
  try {
    const template = RaceTemplateService.getTemplateById('brisbane-trail-marathon');
    const raceId = await RaceTemplateService.createRaceFromTemplate(template, {
      raceName: 'Brisbane Trail Marathon 2026',
      raceDate: '2026-04-26'
    });
    
    const race = await StorageService.getRace(raceId);
    
    logTest(
      '3.2: Create race with custom name',
      race && race.name === 'Brisbane Trail Marathon 2026',
      `Race name: ${race?.name}`
    );
    
    // Cleanup
    await StorageService.deleteRace(raceId);
  } catch (error) {
    logTest('3.2: Create race with custom name', false, error.message);
  }
  
  // Test 3.3: Create race with custom runner range
  try {
    const template = RaceTemplateService.getTemplateById('pinnacles-classic');
    const raceId = await RaceTemplateService.createRaceFromTemplate(template, {
      raceDate: '2025-06-15',
      runnerRangeStart: 100,
      runnerRangeEnd: 200
    });
    
    const race = await StorageService.getRace(raceId);
    const runners = await StorageService.getRunners(raceId);
    
    logTest(
      '3.3: Create race with custom runner range',
      race && runners.length === 101 && runners[0].number === 100,
      `Runners: ${runners.length}, First: ${runners[0]?.number}, Last: ${runners[runners.length - 1]?.number}`
    );
    
    // Cleanup
    await StorageService.deleteRace(raceId);
  } catch (error) {
    logTest('3.3: Create race with custom runner range', false, error.message);
  }
  
  // Test 3.4: Verify GPS coordinates are preserved
  try {
    const template = RaceTemplateService.getTemplateById('mt-glorious-mountain-trail');
    const raceId = await RaceTemplateService.createRaceFromTemplate(template, {
      raceDate: '2025-11-09'
    });
    
    const checkpoints = await StorageService.getCheckpoints(raceId);
    const firstCheckpoint = checkpoints[0];
    
    // Check if location is preserved (should be in metadata or as a property)
    const hasGPS = checkpoints.every(cp => 
      (cp.location && cp.location.includes(',')) || 
      (cp.metadata && cp.metadata.location)
    );
    
    logTest(
      '3.4: GPS coordinates are preserved',
      hasGPS,
      `First checkpoint location: ${firstCheckpoint?.location || firstCheckpoint?.metadata?.location || 'Not found'}`
    );
    
    // Cleanup
    await StorageService.deleteRace(raceId);
  } catch (error) {
    logTest('3.4: GPS coordinates preserved', false, error.message);
  }
  
  // Test 3.5: Verify operator assignments are preserved
  try {
    const template = RaceTemplateService.getTemplateById('mt-glorious-mountain-trail');
    const raceId = await RaceTemplateService.createRaceFromTemplate(template, {
      raceDate: '2025-11-09'
    });
    
    const checkpoints = await StorageService.getCheckpoints(raceId);
    const hasOperators = checkpoints.every(cp => 
      cp.metadata && cp.metadata.operators && cp.metadata.operators.length > 0
    );
    
    logTest(
      '3.5: Operator assignments are preserved',
      hasOperators,
      hasOperators ? 'All checkpoints have operators' : 'Some checkpoints missing operators'
    );
    
    // Cleanup
    await StorageService.deleteRace(raceId);
  } catch (error) {
    logTest('3.5: Operator assignments preserved', false, error.message);
  }
  
  // Test 3.6: Verify metadata is preserved
  try {
    const template = RaceTemplateService.getTemplateById('lake-manchester-trail');
    const raceId = await RaceTemplateService.createRaceFromTemplate(template, {
      raceDate: '2025-08-17'
    });
    
    const race = await StorageService.getRace(raceId);
    const hasMetadata = 
      race.metadata &&
      race.metadata.organizer === 'WICEN Queensland' &&
      race.metadata.templateId === 'lake-manchester-trail';
    
    logTest(
      '3.6: Race metadata is preserved',
      hasMetadata,
      `Organizer: ${race.metadata?.organizer}, Template: ${race.metadata?.templateId}`
    );
    
    // Cleanup
    await StorageService.deleteRace(raceId);
  } catch (error) {
    logTest('3.6: Metadata preserved', false, error.message);
  }
}

// ============================================================================
// TEST SUITE 4: All Templates Validation
// ============================================================================

async function testAllTemplatesValidation() {
  console.log('\n✅ TEST SUITE 4: All Templates Validation\n');
  
  const allTemplates = RaceTemplateService.getAllTemplates();
  
  for (const template of allTemplates) {
    // Test 4.x: Each template is valid
    try {
      const validation = RaceTemplateService.validateTemplate(template);
      logTest(
        `4.${allTemplates.indexOf(template) + 1}: ${template.name} is valid`,
        validation.isValid,
        validation.isValid ? 'Valid' : `Errors: ${validation.errors.join(', ')}`
      );
    } catch (error) {
      logTest(`4.${allTemplates.indexOf(template) + 1}: ${template.name} validation`, false, error.message);
    }
  }
}

// ============================================================================
// TEST SUITE 5: Edge Cases and Error Handling
// ============================================================================

async function testEdgeCasesAndErrorHandling() {
  console.log('\n🔍 TEST SUITE 5: Edge Cases and Error Handling\n');
  
  // Test 5.1: Handle non-existent template ID
  try {
    const template = RaceTemplateService.getTemplateById('non-existent-id');
    logTest(
      '5.1: Handle non-existent template ID',
      template === null,
      template === null ? 'Correctly returns null' : 'Should return null'
    );
  } catch (error) {
    logTest('5.1: Non-existent template ID', false, error.message);
  }
  
  // Test 5.2: Handle empty search
  try {
    const results = RaceTemplateService.searchTemplates('');
    logTest(
      '5.2: Handle empty search query',
      Array.isArray(results),
      `Returns array with ${results.length} results`
    );
  } catch (error) {
    logTest('5.2: Empty search', false, error.message);
  }
  
  // Test 5.3: Handle invalid event type filter
  try {
    const results = RaceTemplateService.getTemplatesByEventType('Invalid Type');
    logTest(
      '5.3: Handle invalid event type',
      Array.isArray(results) && results.length === 0,
      'Returns empty array'
    );
  } catch (error) {
    logTest('5.3: Invalid event type', false, error.message);
  }
  
  // Test 5.4: Create race with checkpoint modifications
  try {
    const template = RaceTemplateService.getTemplateById('mt-glorious-mountain-trail');
    const raceId = await RaceTemplateService.createRaceFromTemplate(template, {
      raceDate: '2025-11-09',
      checkpointModifications: [
        { name: 'Modified CP1 Name' },
        {},
        { name: 'Modified CP3 Name' }
      ]
    });
    
    const checkpoints = await StorageService.getCheckpoints(raceId);
    const firstModified = checkpoints[0].name === 'Modified CP1 Name';
    const thirdModified = checkpoints[2].name === 'Modified CP3 Name';
    
    logTest(
      '5.4: Create race with checkpoint modifications',
      firstModified && thirdModified,
      `CP1: ${checkpoints[0]?.name}, CP3: ${checkpoints[2]?.name}`
    );
    
    // Cleanup
    await StorageService.deleteRace(raceId);
  } catch (error) {
    logTest('5.4: Checkpoint modifications', false, error.message);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

export async function runAllTests() {
  console.clear();
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(10) + 'RACE TEMPLATE SYSTEM - MANUAL TESTING' + ' '.repeat(10) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log('\nStarting comprehensive manual testing...\n');
  
  try {
    await testTemplateDataIntegrity();
    await testServiceLayerFunctionality();
    await testRaceCreationFromTemplates();
    await testAllTemplatesValidation();
    await testEdgeCasesAndErrorHandling();
    
    printSummary();
    
    return testResults;
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR during testing:', error);
    printSummary();
    throw error;
  }
}

// Export for use in browser console or Node.js
if (typeof window !== 'undefined') {
  window.runTemplateTests = runAllTests;
  console.log('✅ Testing script loaded! Run: await runTemplateTests()');
}

export default runAllTests;
