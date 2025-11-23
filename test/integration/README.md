# Integration Tests Documentation

## Overview

The integration tests verify the interaction between different modules of the Race Tracker application, focusing on data flow, state management, and complete operational workflows. These tests ensure that modules work together correctly while maintaining their isolation during active operations.

## Test Files

### 1. ModuleWorkflow.test.jsx
Tests complete end-to-end workflows across modules.

#### Key Scenarios:
- Complete race setup to operation workflow
- Checkpoint to base station transitions
- Race completion process
- Error recovery scenarios

#### Example Usage:
```javascript
describe('Complete Race Setup to Operation Workflow', () => {
  test('completes full race setup and transitions to operations', async () => {
    // Setup race
    // Initialize checkpoint
    // Record checkpoint data
    // Verify base station sync
  });
});
```

### 2. DataSync.test.jsx
Tests data synchronization between modules.

#### Key Scenarios:
- Checkpoint to base station updates
- Multiple checkpoint synchronization
- Data consistency verification
- Conflict resolution

#### Example Usage:
```javascript
describe('Checkpoint to Base Station Sync', () => {
  test('updates propagate from checkpoint to base station', async () => {
    // Update checkpoint data
    // Verify base station receives updates
    // Check data consistency
  });
});
```

## Test Utilities (setup.js)

### Mock Store Factory
```javascript
const stores = createMockStores();
const { navigationStore, checkpointStore, baseOperationsStore } = stores;
```

### Mock Repository Factory
```javascript
const repos = createMockRepositories();
const { checkpointRepository, baseOperationsRepository } = repos;
```

### Test Data Factory
```javascript
const testData = createTestData();
const { race, runners, checkpoints } = testData;
```

## Common Integration Patterns

### 1. Module Transition Testing
```javascript
// Start in one module
await act(async () => {
  fireEvent.click(screen.getByText(/checkpoint operations/i));
});

// Perform operations
await act(async () => {
  fireEvent.click(screen.getByText(/mark passed/i));
});

// Transition to another module
await act(async () => {
  fireEvent.click(screen.getByText(/base station/i));
});

// Verify data consistency
expect(screen.getByText(/runner 1.*passed/i)).toBeInTheDocument();
```

### 2. Data Flow Testing
```javascript
// Update data in source module
await checkpointStore.updateRunner(1, { status: 'passed' });

// Verify propagation to target module
await waitFor(() => {
  expect(baseStationStore.runners[0].status).toBe('passed');
});
```

### 3. Error Recovery Testing
```javascript
// Simulate error
baseOperationsRepository.syncWithCheckpoint.mockRejectedValueOnce(new Error());

// Attempt operation
await act(async () => {
  fireEvent.click(screen.getByText(/sync/i));
});

// Verify error handling
expect(screen.getByText(/sync failed/i)).toBeInTheDocument();

// Verify recovery
await act(async () => {
  fireEvent.click(screen.getByText(/retry/i));
});
```

## Testing Guidelines

### 1. Test Setup
- Use `beforeEach` to reset state
- Initialize required mocks
- Set up test data

### 2. Async Operations
- Use `act` for state updates
- Use `waitFor` for async assertions
- Handle promises properly

### 3. Error Scenarios
- Test network failures
- Test database errors
- Test concurrent operations

### 4. Data Verification
- Check data consistency
- Verify UI updates
- Confirm store states

## Best Practices

1. **Test Independence**
   - Reset state between tests
   - Clean up resources
   - Avoid shared state

2. **Realistic Scenarios**
   - Test actual user workflows
   - Include error cases
   - Test boundary conditions

3. **Performance**
   - Mock heavy operations
   - Minimize test duration
   - Use efficient assertions

## Common Issues and Solutions

### 1. Async Testing
Problem: Tests complete before async operations finish
Solution: Use `act` and `waitFor`

```javascript
await act(async () => {
  // Perform action
});

await waitFor(() => {
  // Assert result
});
```

### 2. State Management
Problem: State persists between tests
Solution: Reset stores in beforeEach

```javascript
beforeEach(() => {
  const store = useNavigationStore.getState();
  store.reset();
});
```

### 3. Mock Synchronization
Problem: Mocks don't reset properly
Solution: Clear all mocks before each test

```javascript
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Debugging Tips

1. Use `screen.debug()` to view component tree
2. Console.log mock calls and returns
3. Check test isolation with `.only`
4. Verify async operation timing

## Adding New Tests

1. Identify the integration scenario
2. Create test file if needed
3. Import required utilities
4. Follow existing patterns
5. Document new tests

## Maintenance

1. Update tests for new features
2. Review and update mocks
3. Maintain documentation
4. Check coverage regularly
