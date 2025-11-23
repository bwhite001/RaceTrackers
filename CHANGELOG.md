# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive README.md with project overview, features, and documentation links
- LICENSE file (MIT License)
- CONTRIBUTING.md with contribution guidelines
- GitHub Actions workflows for CI/CD
  - `deploy.yml` - Automated deployment to GitHub Pages
  - `ci.yml` - Continuous integration with tests and build verification
- Quick Start Guide in docs/guides/
- Repository structure reorganization

### Changed
- Reorganized repository structure for better maintainability
  - Moved test configuration files to `/config` directory
  - Moved utility scripts to `/scripts` directory
  - Moved test data to `/test/data` directory
- Updated package.json scripts to reference new file locations
- Updated vite.config.js base path for GitHub Pages deployment
- Moved original proposal document to `docs/original-proposal.txt`

### Removed
- `demo.html` (test file no longer needed)

## Repository Structure Changes

### New Directory Structure

```
RaceTrackers/
├── .github/
│   └── workflows/          # CI/CD workflows
│       ├── ci.yml
│       └── deploy.yml
├── config/                 # Test configuration files
│   ├── vitest.config.base-operations.js
│   ├── vitest.config.components.js
│   ├── vitest.config.database.js
│   ├── vitest.config.e2e.js
│   ├── vitest.config.integration.js
│   ├── vitest.config.services.js
│   └── vitest.config.unit.js
├── docs/                   # Documentation
│   ├── guides/
│   │   ├── quick-start.md
│   │   ├── user-guide.md
│   │   ├── testing-guide.md
│   │   └── deployment-guide.md
│   ├── implementation/
│   ├── screenshots/
│   └── testing/
├── notes/                  # Development notes
├── public/                 # Static assets
├── scripts/                # Utility scripts
│   ├── capture-base-station-screenshots.js
│   ├── final-screenshots.js
│   └── run-e2e-test.js
├── screenshots/            # Application screenshots
├── src/                    # Source code
├── test/                   # Test suites
│   └── data/              # Test data files
│       └── runner_test.csv
├── CHANGELOG.md           # This file
├── CONTRIBUTING.md        # Contribution guidelines
├── LICENSE                # MIT License
├── README.md              # Project overview
├── index.html             # Entry point
├── package.json           # Dependencies and scripts
├── postcss.config.js      # PostCSS configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── vite.config.js         # Vite configuration
└── vitest.config.js       # Main Vitest configuration
```

### Files Moved

| Original Location | New Location | Reason |
|------------------|--------------|--------|
| `vitest.config.*.js` (7 files) | `config/` | Organize test configurations |
| `capture-base-station-screenshots.js` | `scripts/` | Group utility scripts |
| `final-screenshots.js` | `scripts/` | Group utility scripts |
| `run-e2e-test.js` | `scripts/` | Group utility scripts |
| `runner_test.csv` | `test/data/` | Organize test data |
| `RaceTrackerApp.txt` | `docs/original-proposal.txt` | Archive original proposal |

### Files Removed

- `demo.html` - Removed as it was a temporary test file

### Root Directory Cleanup

The root directory now contains only essential configuration files:
- Package management: `package.json`, `package-lock.json`
- Build configuration: `vite.config.js`, `postcss.config.js`, `tailwind.config.js`
- Test configuration: `vitest.config.js` (main config)
- Entry point: `index.html`
- Documentation: `README.md`, `CONTRIBUTING.md`, `LICENSE`, `CHANGELOG.md`
- Project configuration: `.gitignore`, `.blackboxrules`

## [0.0.0] - 2025-01-XX

### Initial Release
- Core race tracking functionality
- Checkpoint operations module
- Base station operations module
- Race maintenance module
- Offline-first PWA architecture
- IndexedDB data persistence
- Export/import functionality
- Comprehensive test suite (>85% coverage)

---

## Links

- [GitHub Repository](https://github.com/bwhite001/RaceTrackers)
- [Documentation](./docs/README.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [License](./LICENSE)
