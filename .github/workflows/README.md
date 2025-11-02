# CI/CD Pipeline Documentation

## Overview

This CI/CD pipeline automates testing, building, and deployment of the Race Tracker application. It's designed to ensure code quality and maintain module isolation across all environments.

## Pipeline Stages

### 1. Test
- Runs linting
- Performs type checking
- Executes unit tests
- Runs integration tests
- Uploads test coverage reports

### 2. Build
- Creates production build
- Stores build artifacts
- Validates build output

### 3. Deploy
- Staging deployment (develop branch)
- Production deployment (main branch)
- Includes deployment verification

### 4. Notify
- Reports pipeline status
- Sends notifications for failures/success

## Configuration

### Required Secrets

Add these to your GitHub repository secrets:

```bash
# Node.js environment
NODE_ENV - Environment (development/staging/production)

# Deployment credentials (example for Netlify)
NETLIFY_AUTH_TOKEN - Netlify authentication token
NETLIFY_SITE_ID - Netlify site ID

# Notification settings (example for Slack)
SLACK_WEBHOOK - Slack webhook URL for notifications
```

### Environment Variables

Configure these in your repository settings:

```bash
# Build configuration
VITE_API_URL - API endpoint for each environment
VITE_APP_ENV - Application environment

# Test configuration
VITEST_COVERAGE - Enable/disable coverage
VITEST_MAX_WORKERS - Maximum test workers
```

## Branch Protection Rules

Set these rules in your repository settings:

1. `main` branch:
   - Require status checks to pass
   - Require review before merging
   - Require up-to-date branch

2. `develop` branch:
   - Require status checks to pass
   - Allow force push for CI

## Deployment Configuration

### Staging Environment

```yaml
# Example Netlify configuration
name: staging
url: https://staging.example.com
build_command: npm run build
publish_directory: dist
```

### Production Environment

```yaml
# Example Netlify configuration
name: production
url: https://app.example.com
build_command: npm run build
publish_directory: dist
```

## Module Isolation in CI/CD

The pipeline ensures module isolation by:

1. Running isolation tests
2. Verifying navigation protection
3. Testing data synchronization
4. Validating operation states

## Test Coverage Requirements

Maintain these minimum coverage thresholds:

```javascript
// jest.config.js or vitest.config.js
coverageThresholds: {
  global: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80
  },
  // Module-specific thresholds
  './src/modules/*/': {
    statements: 90,
    branches: 90,
    functions: 90,
    lines: 90
  }
}
```

## Automated Checks

### Pre-merge Checks
- Code style (ESLint)
- Type safety (TypeScript)
- Test coverage
- Build verification
- Module isolation tests

### Post-deploy Checks
- Smoke tests
- API health checks
- Module navigation tests
- Data consistency checks

## Troubleshooting

### Common Issues

1. **Failed Tests**
```bash
# Rerun failed tests
npm run test -- --bail
# Debug specific test
npm run test -- --testNamePattern="test name"
```

2. **Build Failures**
```bash
# Clean build cache
npm run clean
# Rebuild with verbose logging
npm run build -- --debug
```

3. **Deployment Issues**
```bash
# Verify environment
echo $NODE_ENV
# Check build output
ls -la dist/
```

### Recovery Steps

1. Failed deployment:
   - Check deployment logs
   - Verify environment variables
   - Confirm build artifacts
   - Roll back if necessary

2. Failed tests:
   - Check test logs
   - Verify test environment
   - Run tests locally
   - Debug specific failures

## Maintenance

### Regular Tasks

1. Update dependencies:
```bash
# Check for updates
npm outdated
# Update dependencies
npm update
```

2. Verify configurations:
```bash
# Test configuration
npm run test -- --showConfig
# Build configuration
npm run build -- --debug
```

3. Monitor performance:
```bash
# Check test execution time
npm run test -- --verbose
# Analyze build size
npm run build -- --analyze
```

## Contributing

1. Branch naming:
   - feature/* for new features
   - fix/* for bug fixes
   - chore/* for maintenance

2. Commit messages:
   - Follow conventional commits
   - Reference issues/PRs

3. Pull requests:
   - Include test coverage
   - Update documentation
   - Add migration steps if needed

## Support

For CI/CD issues:
1. Check pipeline logs
2. Review configuration
3. Test locally
4. Contact DevOps team

Remember to keep this documentation updated as the CI/CD pipeline evolves.
