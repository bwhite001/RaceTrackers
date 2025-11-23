# GitHub Actions Workflows for Test Suites

## Overview

Two GitHub Actions workflows have been created to run test suites in parallel on pull requests:

1. **test-suites.yml** - Runs all test suites in parallel (comprehensive)
2. **test-suites-smart.yml** - Runs only affected test suites based on changed files (optimized)

## Workflows

### 1. Test Suites (Comprehensive)

**File**: `test-suites.yml`

**Triggers**:
- Pull requests to `main` or `develop` branches
- Pushes to `main` or `develop` branches
- Manual workflow dispatch

**Strategy**:
- Runs all 7 test suites in parallel using matrix strategy
- Each suite runs independently
- Generates coverage reports for each suite
- Aggregates results and determines overall pass/fail
- Comments on PR with results summary

**Jobs**:

1. **test-suites** (Matrix Job)
   - Runs each suite: unit, base-operations, database, integration, e2e, services, components
   - Generates coverage for each suite
   - Uploads coverage and test results as artifacts
   - Continues even if one suite fails (fail-fast: false)

2. **test-results** (Aggregation Job)
   - Waits for all suite jobs to complete
   - Determines overall pass/fail status
   - Creates summary report in GitHub Actions UI
   - Comments on PR with detailed results

3. **final-status** (Status Check Job)
   - Sets final status for PR checks
   - Returns exit code 0 (success) or 1 (failure)
   - Used by branch protection rules

**Usage**:
```yaml
# Automatically runs on PR
# View results in GitHub Actions tab
# Check PR comments for summary
```

**Artifacts**:
- `coverage-{suite}` - Coverage reports for each suite (7 days retention)
- `test-results-{suite}` - Test results and logs (7 days retention)

---

### 2. Smart Test Suites (Optimized)

**File**: `test-suites-smart.yml`

**Triggers**:
- Pull requests to `main` or `develop` branches

**Strategy**:
- Detects which files changed in the PR
- Runs only the test suites affected by those changes
- Saves CI time by skipping unaffected suites
- Runs all suites if core files (package.json, configs) changed

**Jobs**:

1. **detect-changes**
   - Uses `dorny/paths-filter` action
   - Maps changed files to test suites
   - Outputs which suites need to run

2. **test-changed-suites** (Conditional Matrix Job)
   - Runs only suites with detected changes
   - Uses same matrix strategy as comprehensive workflow
   - Skips suites with no relevant changes

3. **smart-test-summary**
   - Creates summary showing which suites ran
   - Indicates skipped suites
   - Shows overall status

**File Mappings**:

| Suite | Triggers When These Files Change |
|-------|----------------------------------|
| **unit** | `src/test/*.test.{js,jsx}`, `src/store/**`, `src/components/Settings/**`, `src/components/Layout/**` |
| **base-operations** | `src/test/base-operations/**`, `src/modules/base-operations/**`, `src/components/BaseStation/**`, `src/views/BaseStationView.jsx` |
| **database** | `src/test/database/**`, `src/services/storage.js`, `src/shared/services/database/**` |
| **integration** | `src/test/integration/**`, `src/modules/**`, `src/shared/store/**` |
| **e2e** | `src/test/e2e/**`, `src/views/**`, `src/App.jsx` |
| **services** | `src/test/services/**`, `src/services/import-export/**` |
| **components** | `src/test/components/**`, `src/components/Shared/**`, `src/design-system/**` |
| **run-all** | `package.json`, `vitest.config*.js`, `test-runner.js`, `.github/workflows/**` |

**Usage**:
```yaml
# Automatically runs on PR
# Only affected suites execute
# Faster feedback for focused changes
```

---

## Workflow Comparison

| Feature | test-suites.yml | test-suites-smart.yml |
|---------|-----------------|----------------------|
| **Runs** | All 7 suites always | Only affected suites |
| **Speed** | Slower (comprehensive) | Faster (optimized) |
| **Coverage** | Complete | Targeted |
| **Use Case** | Final validation, main branch | Development PRs |
| **CI Time** | ~5-10 minutes | ~2-5 minutes (varies) |

---

## PR Status Checks

Both workflows set status checks that can be used in branch protection rules:

### Required Status Checks

Add these to your branch protection rules:

1. **Test Suites / Final Status Check** - From test-suites.yml
2. **Smart Test Suites / smart-test-summary** - From test-suites-smart.yml (optional)

### Status Meanings

- ✅ **Success**: All test suites passed
- ❌ **Failure**: One or more test suites failed
- ⏭️ **Skipped**: Suite not affected by changes (smart workflow only)

---

## Viewing Results

### In GitHub Actions UI

1. Go to **Actions** tab in repository
2. Click on workflow run
3. View individual suite jobs
4. Download artifacts (coverage reports, test results)

### In PR Comments

The comprehensive workflow automatically comments on PRs with:
- Overall status (✅ or ❌)
- Suite breakdown table
- Link to coverage artifacts

### In PR Checks

Status checks appear at the bottom of PR:
- Green checkmark = All tests passed
- Red X = Tests failed
- Click "Details" to view workflow run

---

## Local Testing

Before pushing, test locally using the same commands:

```bash
# Run all suites (like comprehensive workflow)
npm run test:suites

# Run specific suite
npm run test:suite:unit

# Run multiple suites (like smart workflow)
node test-runner.js unit database services
```

---

## Configuration

### Customizing File Mappings

Edit `.github/workflows/test-suites-smart.yml`:

```yaml
filters: |
  unit:
    - 'src/test/*.test.{js,jsx}'
    - 'src/store/**'
    # Add more patterns here
```

### Adjusting Node Version

Both workflows use Node.js 18. To change:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change version here
```

### Modifying Artifact Retention

Default is 7 days. To change:

```yaml
- name: Upload coverage artifact
  uses: actions/upload-artifact@v4
  with:
    retention-days: 14  # Change retention here
```

---

## Troubleshooting

### Workflow Not Triggering

**Issue**: Workflow doesn't run on PR

**Solutions**:
1. Check workflow file is in `.github/workflows/` directory
2. Verify YAML syntax is correct
3. Ensure PR targets `main` or `develop` branch
4. Check repository Actions settings are enabled

### All Suites Failing

**Issue**: All test suites fail in CI but pass locally

**Solutions**:
1. Check Node.js version matches (18)
2. Verify all dependencies are in `package.json`
3. Check for environment-specific issues
4. Review workflow logs for errors

### Smart Workflow Running All Suites

**Issue**: Smart workflow runs all suites even for small changes

**Solutions**:
1. Check if core files (package.json, configs) were changed
2. Review file mapping patterns in workflow
3. Verify `dorny/paths-filter` action is working

### Coverage Artifacts Missing

**Issue**: Coverage artifacts not uploaded

**Solutions**:
1. Ensure coverage generation succeeds
2. Check coverage directory path is correct
3. Verify `continue-on-error: true` for coverage step
4. Review artifact upload logs

---

## Best Practices

### 1. Use Smart Workflow for Development

Enable `test-suites-smart.yml` for faster feedback during development:
- Runs only affected suites
- Saves CI time
- Provides quick validation

### 2. Use Comprehensive Workflow for Release

Use `test-suites.yml` for:
- Release branches
- Main branch merges
- Final validation before deployment

### 3. Review Coverage Reports

Download coverage artifacts regularly:
1. Go to workflow run
2. Scroll to "Artifacts" section
3. Download `coverage-{suite}` artifacts
4. Open `index.html` in browser

### 4. Monitor CI Time

Track workflow execution time:
- Optimize slow suites
- Adjust file mappings in smart workflow
- Consider splitting large suites

### 5. Keep Workflows Updated

Regularly update:
- Action versions (e.g., `actions/checkout@v4`)
- Node.js version
- File mapping patterns
- Artifact retention policies

---

## Integration with Branch Protection

### Recommended Settings

1. **Require status checks to pass**:
   - ✅ Test Suites / Final Status Check

2. **Require branches to be up to date**:
   - ✅ Enabled

3. **Do not allow bypassing**:
   - ✅ Enabled for all users

### Configuration Steps

1. Go to **Settings** → **Branches**
2. Add rule for `main` branch
3. Enable "Require status checks to pass before merging"
4. Search for "Test Suites / Final Status Check"
5. Select the check
6. Save changes

---

## Maintenance

### Adding New Test Suite

When adding a new test suite:

1. Create vitest config: `vitest.config.newsuite.js`
2. Add npm script: `"test:suite:newsuite": "vitest run --config vitest.config.newsuite.js"`
3. Update `test-suites.yml` matrix:
   ```yaml
   matrix:
     suite:
       - unit
       - base-operations
       - newsuite  # Add here
   ```
4. Update `test-suites-smart.yml` filters:
   ```yaml
   newsuite:
     - 'src/test/newsuite/**'
   ```
5. Update documentation

### Removing Test Suite

To remove a suite:

1. Remove from workflow matrix
2. Remove from smart workflow filters
3. Remove vitest config file
4. Remove npm scripts
5. Update documentation

---

## Examples

### Example 1: PR with Base Station Changes

**Changed Files**:
- `src/components/BaseStation/DataEntry.jsx`
- `src/test/base-operations/DataEntry.test.jsx`

**Smart Workflow Behavior**:
- ✅ Runs: base-operations suite
- ⏭️ Skips: unit, database, integration, e2e, services, components

**Result**: Fast feedback (~2 minutes)

### Example 2: PR with Config Changes

**Changed Files**:
- `package.json`
- `vitest.config.js`

**Smart Workflow Behavior**:
- ✅ Runs: All 7 suites (core files changed)

**Result**: Comprehensive validation (~8 minutes)

### Example 3: PR with Multiple Module Changes

**Changed Files**:
- `src/modules/base-operations/services/BaseService.js`
- `src/modules/checkpoint-operations/store/checkpointStore.js`
- `src/shared/store/navigationStore.js`

**Smart Workflow Behavior**:
- ✅ Runs: base-operations, integration suites
- ⏭️ Skips: unit, database, e2e, services, components

**Result**: Targeted validation (~4 minutes)

---

## Support

For issues or questions:

1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Test locally using npm scripts
4. Check [TEST_SUITES.md](../../src/test/TEST_SUITES.md) for test suite details

---

**Last Updated**: 2024  
**Workflows**: 2 (comprehensive + smart)  
**Test Suites**: 7 independent suites  
**CI Strategy**: Parallel matrix execution
