# Race Tracker Test Suite Documentation

## Overview

This test suite provides comprehensive coverage for the Race Tracker application, with special focus on module isolation, data synchronization, and workflow integration. The tests ensure that each module (Race Maintenance, Checkpoint Operations, and Base Station) operates independently while maintaining data consistency across the application.

## Test Structure

```
src/test/
├── integration/              # Integration tests
│   ├── ModuleWorkflow.test  # End-to-end workflow tests
│   ├── DataSync.test        # Data synchronization tests
│   └── setup.js             # Integration test utilities
├── ModuleIsolation.test     # Module isolation tests
├── ExitOperationModal.test  # Exit handling tests
├── NavigationStore.test     # Navigation state tests
└── setup.js                 # Global test setup
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test ModuleIsolation.test.jsx

# Run integration tests only
npm test integration/

# Run with coverage
npm test -- --coverage
```

## Key Testing Areas

### 1. Module Isolation
- Navigation restrictions during operations
- Protected routes
- Operation state management
- Exit handling with unsaved changes
- Browser navigation protection

### 2. Data Synchronization
- Cross-module data flow
- Real-time updates
- Data consistency
- Error recovery
- Conflict resolution

### 3. Workflow Integration
- Complete race setup to operation flow
- Checkpoint to base station synchronization
- Multi-checkpoint operations
- Race completion workflow

## Test Utilities

### Mock Factories
```javascript
// Create mock stores
const stores = createMockStores();

// Create mock repositories
const repos = createMockRepositories();

// Create test data
const testData = createTestData();
```

### Helper Functions
```javascript
// Wait for async operations
await waitForAsync(ms);

// Render with router
renderWithRouter(<Component />, { route: '/path' });
```

## Common Testing Patterns

### 1. Testing Protected Routes
```javascript
test('prevents unauthorized navigation', async () => {
  // Start operation in one module
  // Attempt navigation to another module
  // Verify navigation was prevented
});
```

### 2. Testing Data Flow
```javascript
test('syncs data between modules', async () => {
  // Update data in checkpoint
  // Verify base station receives update
  // Check data consistency
});
```

### 3. Testing Operation Safety
```javascript
test('protects unsaved changes', async () => {
  // Make changes in module
  // Attempt to exit
  // Verify warning shown
  // Verify data preserved
});
```

## Edge Cases and Error Handling

### Covered Scenarios
- Network interruptions
- Database errors
- Concurrent operations
- Browser refresh/navigation
- Partial updates
- Data conflicts

### Testing Error Recovery
```javascript
test('recovers from sync failure', async () => {
  // Simulate error condition
  // Verify error handling
  // Check recovery process
  // Validate data integrity
});
```

## Mocking Strategy

### Store Mocks
- Navigation store for module state
- Module-specific stores for operations
- Settings store for configuration

### Repository Mocks
- Database operations
- Data persistence
- Error scenarios

### Browser Mocks
- IndexedDB for Dexie
- Local/Session Storage
- Navigation events

## Best Practices

1. **Test Independence**
   - Each test should run in isolation
   - Clean up after each test
   - Avoid test interdependence

2. **Realistic Scenarios**
   - Test real user workflows
   - Cover edge cases
   - Include error scenarios

3. **Clear Assertions**
   - Test one thing at a time
   - Clear failure messages
   - Meaningful test names

4. **Performance**
   - Minimize test duration
   - Efficient setup/teardown
   - Parallel test execution

## Extending the Test Suite

### Adding New Tests
1. Identify the testing area (unit/integration)
2. Create test file in appropriate directory
3. Import necessary utilities and mocks
4. Follow existing patterns and conventions

### Creating New Mocks
1. Add to appropriate factory in setup.js
2. Document new mock functionality
3. Update existing tests if needed

### Adding Test Coverage
1. Identify gaps in coverage
2. Add specific test cases
3. Update documentation

## Troubleshooting

### Common Issues
1. Async operation timing
2. Mock implementation errors
3. Test isolation problems
4. Browser API simulation

### Solutions
1. Use waitForAsync utility
2. Check mock factory implementation
3. Verify cleanup between tests
4. Review browser mock setup

## Maintenance

### Regular Tasks
1. Update test data for new features
2. Review and update mocks
3. Check coverage reports
4. Update documentation

### Version Control
1. Keep test files with related code
2. Document breaking changes
3. Update test suite for new features

## Contributing

1. Follow existing patterns
2. Add documentation for new tests
3. Update README for significant changes
4. Include test coverage reports
