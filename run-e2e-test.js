#!/usr/bin/env node

/**
 * Automated E2E Test Runner
 * 
 * This script:
 * 1. Starts the Vite dev server
 * 2. Waits for it to be ready
 * 3. Runs the complete E2E test
 * 4. Displays results
 * 5. Cleans up
 * 
 * Usage: node run-e2e-test.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEV_SERVER_URL = 'http://localhost:5173';
const MAX_WAIT_TIME = 60000; // 60 seconds
const CHECK_INTERVAL = 1000; // 1 second

let devServerProcess = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, colors.bright + colors.blue);
  console.log('='.repeat(70) + '\n');
}

// Check if server is ready
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(DEV_SERVER_URL, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Wait for server to be ready
async function waitForServer() {
  const startTime = Date.now();
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds with 1 second intervals
  
  log('⏳ Waiting for dev server to be ready...', colors.yellow);
  
  while (attempts < maxAttempts) {
    const isReady = await checkServer();
    if (isReady) {
      console.log('');
      log('✅ Dev server is ready!', colors.green);
      return true;
    }
    attempts++;
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    process.stdout.write('.');
  }
  
  console.log('');
  log('⚠️  Server health check timed out, but proceeding anyway...', colors.yellow);
  log('The server may still be starting up. Waiting 5 more seconds...', colors.yellow);
  await new Promise(resolve => setTimeout(resolve, 5000));
  return true; // Proceed anyway
}

// Start dev server
function startDevServer() {
  return new Promise((resolve, reject) => {
    logSection('🚀 Starting Development Server');
    
    log('Starting Vite dev server...', colors.blue);
    
    devServerProcess = spawn('npm', ['run', 'dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      detached: false
    });
    
    let output = '';
    
    devServerProcess.stdout.on('data', (data) => {
      output += data.toString();
      // Look for the "Local:" line that indicates server is ready
      if (output.includes('Local:') || output.includes('localhost:5173')) {
        log('📡 Dev server started', colors.green);
        resolve();
      }
    });
    
    devServerProcess.stderr.on('data', (data) => {
      const message = data.toString();
      // Vite outputs some info to stderr, so we check if it's actually an error
      if (message.includes('error') || message.includes('Error')) {
        log(`⚠️  ${message}`, colors.yellow);
      }
    });
    
    devServerProcess.on('error', (error) => {
      log(`❌ Failed to start dev server: ${error.message}`, colors.red);
      reject(error);
    });
    
    // Timeout fallback
    setTimeout(() => {
      if (devServerProcess && !devServerProcess.killed) {
        resolve(); // Assume it started even if we didn't see the output
      }
    }, 10000);
  });
}

// Run E2E test
function runE2ETest() {
  return new Promise((resolve, reject) => {
    logSection('🧪 Running E2E Test');
    
    log('Executing complete workflow test...', colors.blue);
    log('This will take approximately 5-7 minutes', colors.yellow);
    console.log('');
    
    const testProcess = spawn('node', ['src/test/e2e/complete-workflow-test.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test process exited with code ${code}`));
      }
    });
    
    testProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// Display test results
function displayResults() {
  logSection('📊 Test Results');
  
  const resultsPath = join(__dirname, 'E2E-TEST-RESULTS.json');
  
  if (!fs.existsSync(resultsPath)) {
    log('⚠️  No test results file found', colors.yellow);
    return;
  }
  
  try {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    console.log('');
    log('╔════════════════════════════════════════════════════════════════╗', colors.bright);
    log('║                        TEST SUMMARY                            ║', colors.bright);
    log('╚════════════════════════════════════════════════════════════════╝', colors.bright);
    console.log('');
    
    log(`Test Name: ${results.testName}`, colors.blue);
    log(`Timestamp: ${new Date(results.timestamp).toLocaleString()}`, colors.blue);
    console.log('');
    
    log(`Total Steps: ${results.summary.total}`, colors.bright);
    log(`Passed: ${results.summary.passed} ✅`, colors.green);
    log(`Failed: ${results.summary.failed} ${results.summary.failed > 0 ? '❌' : ''}`, 
        results.summary.failed > 0 ? colors.red : colors.green);
    log(`Duration: ${(results.summary.duration / 1000).toFixed(2)}s`, colors.blue);
    log(`Coverage: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`, 
        colors.bright + colors.green);
    console.log('');
    
    // Show failed steps if any
    if (results.summary.failed > 0) {
      log('Failed Steps:', colors.red);
      results.steps
        .filter(step => step.status === 'failed')
        .forEach(step => {
          log(`  ❌ Step ${step.stepNumber}: ${step.name}`, colors.red);
          if (step.error) {
            log(`     Error: ${step.error}`, colors.yellow);
          }
        });
      console.log('');
    }
    
    // Show bugs if any
    if (results.bugs && results.bugs.length > 0) {
      log('Bugs Found:', colors.yellow);
      results.bugs.forEach(bug => {
        log(`  🐛 Bug #${bug.bugNumber}: ${bug.description}`, colors.yellow);
        log(`     Status: ${bug.status}`, bug.status === 'FIXED' ? colors.green : colors.red);
      });
      console.log('');
    }
    
    // Show artifacts location
    log('📸 Screenshots saved to:', colors.blue);
    log('   screenshots/e2e-tests/complete-workflow/', colors.bright);
    console.log('');
    
    log('📄 Test results saved to:', colors.blue);
    log('   E2E-TEST-RESULTS.json', colors.bright);
    console.log('');
    
    // Final status
    if (results.summary.failed === 0) {
      log('🎉 ALL TESTS PASSED! Application is production ready!', colors.bright + colors.green);
    } else {
      log('⚠️  Some tests failed. Please review the results above.', colors.yellow);
    }
    
  } catch (error) {
    log(`❌ Error reading test results: ${error.message}`, colors.red);
  }
}

// Cleanup function
function cleanup() {
  if (devServerProcess && !devServerProcess.killed) {
    logSection('🧹 Cleaning Up');
    log('Stopping dev server...', colors.yellow);
    
    try {
      // Kill the process group to ensure all child processes are terminated
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', devServerProcess.pid, '/f', '/t']);
      } else {
        process.kill(-devServerProcess.pid);
      }
      log('✅ Dev server stopped', colors.green);
    } catch (error) {
      log('⚠️  Error stopping dev server (it may have already stopped)', colors.yellow);
    }
  }
}

// Main execution
async function main() {
  console.clear();
  
  log('╔════════════════════════════════════════════════════════════════╗', colors.bright + colors.blue);
  log('║         Automated E2E Test Runner for RaceTracker Pro         ║', colors.bright + colors.blue);
  log('╚════════════════════════════════════════════════════════════════╝', colors.bright + colors.blue);
  console.log('');
  
  try {
    // Step 1: Start dev server
    await startDevServer();
    
    // Step 2: Wait for server to be ready
    log('Giving dev server time to initialize...', colors.blue);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Give it 5 seconds
    await waitForServer();
    
    // Step 3: Run E2E test
    await runE2ETest();
    
    // Step 4: Display results
    displayResults();
    
  } catch (error) {
    console.log('');
    log('❌ Test execution failed:', colors.red);
    log(error.message, colors.red);
    console.log('');
    
    if (error.stack) {
      log('Stack trace:', colors.yellow);
      console.log(error.stack);
    }
    
    process.exit(1);
  } finally {
    // Always cleanup
    cleanup();
    
    console.log('');
    log('Test run complete. Press Ctrl+C to exit if needed.', colors.blue);
    
    // Give a moment for cleanup to complete
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('');
  log('Received SIGINT, cleaning up...', colors.yellow);
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('');
  log('Received SIGTERM, cleaning up...', colors.yellow);
  cleanup();
  process.exit(0);
});

// Run the main function
main().catch((error) => {
  console.error('Unhandled error:', error);
  cleanup();
  process.exit(1);
});
