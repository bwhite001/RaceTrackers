#!/usr/bin/env node

/**
 * Test Suite Runner
 * 
 * Runs test suites independently to prevent cascading failures.
 * Each suite runs with its own vitest configuration.
 * 
 * Usage:
 *   node test-runner.js [options] [suites...]
 * 
 * Options:
 *   --all              Run all test suites
 *   --continue         Continue running suites even if one fails
 *   --coverage         Generate coverage reports
 *   --watch            Run in watch mode
 *   --verbose          Show detailed output
 *   --help             Show this help message
 * 
 * Suites:
 *   unit               Root-level component and store tests
 *   base-operations    Base station module tests
 *   database           Database and schema tests
 *   integration        Cross-module workflow tests
 *   e2e                End-to-end tests
 *   services           Service layer tests
 *   components         Shared component tests
 * 
 * Examples:
 *   node test-runner.js unit                    # Run unit tests only
 *   node test-runner.js unit database           # Run unit and database tests
 *   node test-runner.js --all                   # Run all suites
 *   node test-runner.js --all --continue        # Run all, don't stop on failure
 *   node test-runner.js unit --coverage         # Run unit tests with coverage
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Available test suites
const SUITES = {
  unit: {
    name: 'Unit Tests',
    config: 'vitest.config.unit.js',
    description: 'Root-level component and store tests'
  },
  'base-operations': {
    name: 'Base Operations Tests',
    config: 'vitest.config.base-operations.js',
    description: 'Base station module tests'
  },
  database: {
    name: 'Database Tests',
    config: 'vitest.config.database.js',
    description: 'Database schema and migration tests'
  },
  integration: {
    name: 'Integration Tests',
    config: 'vitest.config.integration.js',
    description: 'Cross-module workflow tests'
  },
  e2e: {
    name: 'E2E Tests',
    config: 'vitest.config.e2e.js',
    description: 'End-to-end workflow tests'
  },
  services: {
    name: 'Services Tests',
    config: 'vitest.config.services.js',
    description: 'Service layer tests'
  },
  components: {
    name: 'Components Tests',
    config: 'vitest.config.components.js',
    description: 'Shared component tests'
  }
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    suites: [],
    all: false,
    continue: false,
    coverage: false,
    watch: false,
    verbose: false,
    help: false
  };

  for (const arg of args) {
    if (arg === '--all') {
      options.all = true;
    } else if (arg === '--continue') {
      options.continue = true;
    } else if (arg === '--coverage') {
      options.coverage = true;
    } else if (arg === '--watch') {
      options.watch = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (!arg.startsWith('--')) {
      options.suites.push(arg);
    }
  }

  return options;
}

// Show help message
function showHelp() {
  console.log(`
Test Suite Runner

Usage:
  node test-runner.js [options] [suites...]

Options:
  --all              Run all test suites
  --continue         Continue running suites even if one fails
  --coverage         Generate coverage reports
  --watch            Run in watch mode
  --verbose          Show detailed output
  --help             Show this help message

Available Suites:
${Object.entries(SUITES).map(([key, suite]) => 
  `  ${key.padEnd(20)} ${suite.description}`
).join('\n')}

Examples:
  node test-runner.js unit
  node test-runner.js unit database
  node test-runner.js --all
  node test-runner.js --all --continue
  node test-runner.js unit --coverage
  `);
}

// Run a single test suite
function runSuite(suiteKey, options) {
  return new Promise((resolve, reject) => {
    const suite = SUITES[suiteKey];
    const configPath = resolve(process.cwd(), suite.config);

    // Check if config exists
    if (!existsSync(configPath)) {
      console.error(`❌ Config file not found: ${suite.config}`);
      reject(new Error(`Config not found: ${suite.config}`));
      return;
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 Running: ${suite.name}`);
    console.log(`📁 Config: ${suite.config}`);
    console.log(`${'='.repeat(80)}\n`);

    // Build vitest command
    const args = ['run', '--config', suite.config];
    
    if (options.coverage) {
      args.push('--coverage');
    }
    
    if (options.watch) {
      args.splice(0, 1); // Remove 'run' for watch mode
      args.unshift('--watch');
    }
    
    if (options.verbose) {
      args.push('--reporter=verbose');
    }

    // Spawn vitest process
    const vitestProcess = spawn('npx', ['vitest', ...args], {
      stdio: 'inherit',
      shell: true
    });

    vitestProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${suite.name} - PASSED\n`);
        resolve({ suite: suiteKey, passed: true });
      } else {
        console.log(`\n❌ ${suite.name} - FAILED (exit code: ${code})\n`);
        resolve({ suite: suiteKey, passed: false, code });
      }
    });

    vitestProcess.on('error', (error) => {
      console.error(`\n❌ ${suite.name} - ERROR: ${error.message}\n`);
      reject(error);
    });
  });
}

// Run multiple test suites
async function runSuites(suiteKeys, options) {
  const results = [];
  
  for (const suiteKey of suiteKeys) {
    if (!SUITES[suiteKey]) {
      console.error(`❌ Unknown suite: ${suiteKey}`);
      console.log(`Available suites: ${Object.keys(SUITES).join(', ')}`);
      if (!options.continue) {
        process.exit(1);
      }
      continue;
    }

    try {
      const result = await runSuite(suiteKey, options);
      results.push(result);
      
      // Stop on first failure unless --continue is specified
      if (!result.passed && !options.continue) {
        break;
      }
    } catch (error) {
      console.error(`❌ Error running suite ${suiteKey}:`, error.message);
      if (!options.continue) {
        process.exit(1);
      }
    }
  }

  return results;
}

// Print summary
function printSummary(results) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 TEST SUITE SUMMARY');
  console.log(`${'='.repeat(80)}\n`);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    const suite = SUITES[result.suite];
    console.log(`${status} - ${suite.name}`);
  });

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`${'='.repeat(80)}\n`);

  return failed === 0;
}

// Main execution
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  // Determine which suites to run
  let suitesToRun = options.suites;
  
  if (options.all) {
    suitesToRun = Object.keys(SUITES);
  }

  if (suitesToRun.length === 0) {
    console.error('❌ No test suites specified. Use --all or specify suite names.');
    console.log('Run with --help for usage information.');
    process.exit(1);
  }

  console.log('🚀 Test Suite Runner Starting...\n');
  console.log(`Suites to run: ${suitesToRun.join(', ')}`);
  console.log(`Continue on failure: ${options.continue ? 'Yes' : 'No'}`);
  console.log(`Coverage: ${options.coverage ? 'Yes' : 'No'}`);
  console.log(`Watch mode: ${options.watch ? 'Yes' : 'No'}`);

  try {
    const results = await runSuites(suitesToRun, options);
    const allPassed = printSummary(results);
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runSuite, runSuites, SUITES };
