# Race Tracker Test Suite Troubleshooting Guide

## Common Issues and Solutions

### 1. Test Setup Issues

#### Module Import Errors
```
Error: Cannot find module '@/components/...'
```
**Solution:**
- Check vite.config.js path aliases
- Verify import paths are relative to src/
- Check for circular dependencies

#### Mock Implementation Errors
```
TypeError: Cannot read property 'mockImplementation' of undefined
```
**Solution:**
- Ensure vi.mock() is called before imports
- Check mock factory implementation
- Verify store/repository is properly mocked

### 2. Async Testing Issues

#### Test Completes Before Updates
```
Expected: "passed"
Received: "not-started"
```
**Solution:**
```javascript
// Wrong
fireEvent.click(button);
expect(result).toBe('passed');

// Correct
await act(async () => {
  fireEvent.click(button);
});
await waitFor(() => {
  expect(result).toBe('passed');
});
```

#### Timeout Errors
```
Error: Timed out in waitFor after 1000ms
```
**Solution:**
- Increase timeout in waitFor
- Check for missing state updates
- Verify async operations complete
```javascript
await waitFor(() => {
  expect(element).toBeInTheDocument();
}, { timeout: 5000 });
```

### 3. Module Isolation Issues

#### Unexpected Navigation
```
Error: Navigation occurred during operation
```
**Solution:**
- Check navigationStore mock state
- Verify operation status is correct
- Ensure protected routes are working
```javascript
useNavigationStore.mockImplementation(() => ({
  currentModule: MODULE_TYPES.CHECKPOINT,
  operationStatus: OPERATION_STATUS.IN_PROGRESS,
  canNavigateTo: (moduleType) => moduleType === MODULE_TYPES.CHECKPOINT
}));
```

#### State Leaks Between Tests
```
Error: Unexpected state change detected
```
**Solution:**
- Reset stores in beforeEach
- Clear mocks between tests
- Clean up subscriptions
```javascript
beforeEach(() => {
  vi.clearAllMocks();
  const store = useNavigationStore.getState();
  store.reset();
});
```

### 4. Data Sync Issues

#### IndexedDB Errors
```
Error: IndexedDB access denied
```
**Solution:**
- Check IndexedDB mock setup
- Verify database cleanup between tests
- Reset database state
```javascript
beforeEach(() => {
  indexedDB.deleteDatabase('RaceTrackerDB');
});
```

#### Race Conditions
```
Error: Inconsistent data state
```
**Solution:**
- Use proper async/await
- Implement proper cleanup
- Add synchronization points
```javascript
// Wait for all updates to complete
await Promise.all([
  checkpointUpdate,
  baseStationSync
]);
```

### 5. Component Rendering Issues

#### Component Not Found
```
TestingLibraryElementError: Unable to find element
```
**Solution:**
- Check component mounting
- Verify render wrapper setup
- Check for async rendering
```javascript
const { container } = render(
  <MemoryRouter>
    <Component />
  </MemoryRouter>
);
await waitFor(() => {
  expect(screen.getByText(/expected text/i)).toBeInTheDocument();
});
```

#### Event Handler Issues
```
Error: Fire event did not trigger handler
```
**Solution:**
- Verify event bubbling
- Check event handler binding
- Ensure component is mounted
```javascript
const handler = vi.fn();
render(<Button onClick={handler} />);
await userEvent.click(screen.getByRole('button'));
expect(handler).toHaveBeenCalled();
```

## Debugging Strategies

### 1. Test Isolation Debug
```javascript
// Run single test
test.only('specific test', async () => {
  // Test code
});

// Debug specific describe block
describe.only('specific suite', () => {
  // Test suite
});
```

### 2. Component Tree Inspection
```javascript
// Print component tree
screen.debug();

// Print specific element
screen.debug(screen.getByText(/specific text/i));
```

### 3. Mock Inspection
```javascript
// Check mock calls
console.log(mockFunction.mock.calls);

// Check mock results
console.log(mockFunction.mock.results);
```

### 4. State Tracking
```javascript
// Track store state changes
const unsubscribe = store.subscribe((state) => {
  console.log('State updated:', state);
});

// Clean up
afterEach(() => {
  unsubscribe();
});
```

## When to File an Issue

### Create an Issue When:
1. Test failures are inconsistent
2. Performance degradation is observed
3. Mock implementations don't match real behavior
4. Integration tests fail in CI but pass locally

### Issue Template:
```markdown
## Test Failure Description
- Test file:
- Test name:
- Error message:

## Environment
- Node version:
- npm/yarn version:
- OS:

## Steps to Reproduce
1.
2.
3.

## Expected vs Actual
Expected:
Actual:

## Additional Context
- Console output
- Test setup details
- Related changes
```

## Performance Optimization

### Slow Tests
If tests are running slowly:
1. Check for unnecessary async waits
2. Reduce test data size
3. Optimize mock implementations
4. Use test.concurrent for parallel execution

### Memory Leaks
If memory usage is high:
1. Check for uncleaned subscriptions
2. Verify store cleanup
3. Monitor IndexedDB size
4. Clear large test data

## Maintenance Tips

### Regular Checks
1. Run full test suite weekly
2. Monitor test execution time
3. Review test coverage
4. Update mocks for API changes

### Code Review Guidelines
1. Check test isolation
2. Verify error handling
3. Confirm async patterns
4. Review mock implementations

## Getting Help

### Resources
1. Test documentation in /src/test/README.md
2. Integration test guide in /src/test/integration/README.md
3. Vitest documentation
4. React Testing Library guides

### Support Channels
1. Create GitHub issue
2. Review existing issues
3. Check documentation
4. Contact team lead

Remember: Good tests should be reliable, maintainable, and meaningful. If you're spending too much time debugging tests, there might be an underlying architectural issue to address.
