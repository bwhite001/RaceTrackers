# Contributing to RaceTracker Pro

Thank you for your interest in contributing to RaceTracker Pro! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- A code editor (VS Code recommended)
- Basic knowledge of React, JavaScript, and PWAs

### Setting Up Your Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/bwhite001/RaceTrackers.git
   cd RaceTrackers
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/bwhite001/RaceTrackers.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Run tests**
   ```bash
   npm test
   ```

## Development Process

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature Branch

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create a new feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Write clear, focused commits**
   ```bash
   git commit -m "feat: add runner search functionality"
   ```

2. **Follow commit message conventions**
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

3. **Keep commits atomic**
   - One logical change per commit
   - Commits should be self-contained

4. **Write descriptive commit messages**
   ```
   feat: add bulk runner import from CSV
   
   - Implement CSV parser with validation
   - Add error handling for malformed data
   - Include progress indicator for large files
   - Add unit tests for parser
   
   Closes #123
   ```

## Coding Standards

### JavaScript/React

- Use functional components with hooks
- Follow existing code patterns
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Avoid deeply nested code

**Example:**
```javascript
/**
 * Calculates the common time (5-minute interval) for a given timestamp
 * @param {Date} actualTime - The actual timestamp
 * @returns {string} ISO 8601 formatted common time
 */
function calculateCommonTime(actualTime) {
  const minutes = actualTime.getMinutes();
  const roundedMinutes = Math.floor(minutes / 5) * 5;
  const commonTime = new Date(actualTime);
  commonTime.setMinutes(roundedMinutes, 0, 0);
  return commonTime.toISOString();
}
```

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing and sizing
- Use design system components when available

**Example:**
```jsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 
                   disabled:opacity-50 disabled:cursor-not-allowed">
  Submit
</button>
```

### File Organization

```
src/
├── components/          # Reusable UI components
│   ├── ComponentName/
│   │   ├── index.jsx
│   │   └── ComponentName.test.jsx
├── modules/             # Feature modules
│   ├── base-operations/
│   ├── checkpoint-operations/
│   └── race-maintenance/
├── services/            # Business logic
├── shared/              # Shared utilities
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── store/
└── types/               # Type definitions
```

## Testing Requirements

### Test Coverage

- Maintain **>85% test coverage** for all new code
- Write tests before or alongside implementation
- Test both happy paths and error cases

### Test Types

1. **Unit Tests** - Individual functions and components
   ```javascript
   describe('calculateCommonTime', () => {
     it('should round down to nearest 5-minute interval', () => {
       const input = new Date('2025-01-01T10:43:00');
       const result = calculateCommonTime(input);
       expect(result).toBe('2025-01-01T10:40:00.000Z');
     });
   });
   ```

2. **Integration Tests** - Module interactions
   ```javascript
   describe('Checkpoint Operations', () => {
     it('should mark runner and update leaderboard', async () => {
       // Test implementation
     });
   });
   ```

3. **E2E Tests** - Complete workflows
   ```javascript
   describe('Complete Race Workflow', () => {
     it('should create race, mark runners, and generate report', async () => {
       // Test implementation
     });
   });
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:suite:unit

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Test Guidelines

- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Clean up after tests
- Use test data factories

## Submitting Changes

### Before Submitting

1. **Ensure all tests pass**
   ```bash
   npm run test:run
   ```

2. **Check test coverage**
   ```bash
   npm run test:coverage
   ```

3. **Update documentation**
   - Update README if needed
   - Add/update JSDoc comments
   - Update relevant guides in `docs/`

4. **Rebase on latest main**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request on GitHub**
   - Use a clear, descriptive title
   - Reference related issues
   - Provide detailed description
   - Add screenshots for UI changes

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Related Issues
   Closes #123
   
   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] E2E tests added/updated
   - [ ] All tests passing
   
   ## Screenshots (if applicable)
   
   ## Checklist
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   - [ ] Tests added and passing
   - [ ] Coverage maintained >85%
   ```

### Review Process

1. **Automated Checks**
   - Tests must pass
   - Coverage must be >85%
   - No linting errors

2. **Code Review**
   - At least one approval required
   - Address all review comments
   - Make requested changes

3. **Merge**
   - Squash and merge preferred
   - Delete branch after merge

## Reporting Bugs

### Before Reporting

1. **Check existing issues**
   - Search for similar issues
   - Check closed issues

2. **Verify the bug**
   - Can you reproduce it?
   - Does it occur in latest version?
   - Does it occur in different browsers?

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
If applicable

## Environment
- OS: [e.g., Windows 10, macOS 12]
- Browser: [e.g., Chrome 120, Firefox 121]
- Version: [e.g., v1.0.0]

## Additional Context
Any other relevant information
```

## Suggesting Features

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches you've thought about

## Additional Context
Mockups, examples, etc.
```

## Module-Specific Guidelines

### Checkpoint Operations

- Maintain module isolation
- Use dedicated data tables
- Follow navigation protection patterns
- Test offline functionality

### Base Station Operations

- Ensure data integrity
- Validate bulk operations
- Test withdrawal/vet-out flows
- Verify report generation

### Database Operations

- Use Dexie transactions
- Maintain compound indexes
- Test migrations
- Validate data integrity

## Documentation

### When to Update Documentation

- New features added
- API changes
- Configuration changes
- Breaking changes
- Bug fixes affecting usage

### Documentation Locations

- `README.md` - Project overview
- `docs/guides/` - User guides
- `docs/implementation/` - Technical docs
- `notes/` - Development notes
- Code comments - Complex logic

## Questions?

- 💬 [GitHub Discussions](https://github.com/bwhite001/RaceTrackers/discussions)
- 📧 Email: support@racetracker.example.com
- 🐛 [GitHub Issues](https://github.com/bwhite001/RaceTrackers/issues)

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to RaceTracker Pro! 🎉
