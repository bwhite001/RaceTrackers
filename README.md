# 🏃 RaceTracker Pro

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0-646CFF.svg)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8.svg)](https://web.dev/progressive-web-apps/)
[![Test Coverage](https://img.shields.io/badge/Coverage-85%25-brightgreen.svg)](./test)

> **Offline-first Progressive Web App for race event management**  
> Track runners at checkpoints and manage race operations without internet connectivity.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Demo](#demo)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**RaceTracker Pro** is a comprehensive race tracking system designed for volunteers and coordinators managing running events. Built as a Progressive Web App (PWA), it provides full offline functionality, making it ideal for remote race locations with limited or no internet connectivity.

### Key Capabilities

- **Offline-First Architecture**: Complete functionality without internet
- **Dual Operation Modes**: Checkpoint tracking and Base Station management
- **Real-Time Analytics**: Live leaderboards and progress tracking
- **Data Portability**: JSON export/import with validation
- **Scalable**: Supports 1,000-2,000+ runners across multiple checkpoints
- **Cross-Platform**: Works on desktop, tablet, and mobile devices

---

## ✨ Features

### 🏁 Race Setup & Configuration
- Create and configure races with custom runner ranges
- Define multiple checkpoints with custom names
- Import/export race configurations
- Support for CSV/Excel runner data import

### 📍 Checkpoint Operations
- **Runner Mark-Off**: Quick tap interface for tracking runner arrivals
- **Callout Sheet**: Automatic 5-minute time grouping for efficient reporting
- **Overview Dashboard**: Real-time status tracking with color-coded indicators

### 🎯 Base Station Operations
- **Bulk Data Entry**: Efficient time assignment for multiple runners
- **Race Overview**: Comprehensive dashboard with live statistics
- **Withdrawal Management**: Track DNF, DNS, and withdrawn runners
- **Strapper Calls**: Manage medical and support requests
- **Report Generation**: Create detailed race reports and analytics

### 🎨 User Experience
- **Dark/Light Mode**: Customizable theme preferences
- **Responsive Design**: Optimized for all screen sizes
- **Accessibility**: WCAG 2.1 AA compliant
- **Keyboard Shortcuts**: Efficient navigation and operations
- **Offline Storage**: IndexedDB for reliable local data persistence

---

## 🚀 Demo

### Live Demo
🔗 **[Try RaceTracker Pro](https://bwhite001.github.io/RaceTrackers)** *(GitHub Pages)*

### Screenshots

Comming Soon

📸 [View all screenshots](./screenshots)

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** 18+ and npm 9+
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/bwhite001/RaceTrackers.git
cd RaceTrackers

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

---

## 📦 Installation

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/bwhite001/RaceTrackers.git
   cd RaceTrackers
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** (optional)
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Production Deployment

See [Deployment Guide](./docs/guides/deployment-guide.md) for detailed instructions on deploying to:
- GitHub Pages
- Netlify
- Vercel
- Self-hosted servers

---

## 💻 Usage

### Creating a Race

1. Launch the application
2. Click **"Create New Race"**
3. Enter race details:
   - Race name
   - Date and start time
   - Runner number range (e.g., 1-128)
4. Configure checkpoints
5. Save configuration

### Checkpoint Mode

**For volunteers at race checkpoints:**

1. Select **Checkpoint Mode**
2. Choose your checkpoint
3. **Mark-Off Tab**: Tap runner numbers as they pass
4. **Callout Sheet Tab**: View grouped times for reporting
5. **Overview Tab**: Monitor all runner statuses

### Base Station Mode

**For central race operations:**

1. Select **Base Station Mode**
2. **Data Entry Tab**: Enter finish times and runner numbers
3. **Overview Tab**: Monitor race progress and statistics
4. Generate reports and manage withdrawals

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Quick search |
| `Ctrl/Cmd + N` | New entry |
| `Ctrl/Cmd + S` | Save/Export |
| `Ctrl/Cmd + P` | Print report |
| `Esc` | Close dialog |

📖 [Full User Guide](./docs/guides/user-guide.md)

---

## 🛠 Development

### Project Structure

```
RaceTrackers/
├── config/              # Test configuration files
├── docs/                # Documentation
│   ├── guides/          # User and deployment guides
│   ├── implementation/  # Technical documentation
│   └── testing/         # Test reports and guides
├── notes/               # Development notes and planning
├── public/              # Static assets
├── scripts/             # Build and utility scripts
├── screenshots/         # Application screenshots
├── src/                 # Source code
│   ├── components/      # React components
│   ├── modules/         # Feature modules
│   ├── services/        # Business logic
│   ├── shared/          # Shared utilities
│   └── store/           # State management
├── test/                # Test suites
│   ├── base-operations/ # Base station tests
│   ├── database/        # Database tests
│   ├── e2e/             # End-to-end tests
│   └── integration/     # Integration tests
└── index.html           # Entry point
```

### Technology Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 18, React Router |
| **Build Tool** | Vite 7 |
| **Styling** | Tailwind CSS |
| **State Management** | Zustand |
| **Database** | Dexie.js (IndexedDB) |
| **PWA** | Vite PWA Plugin + Workbox |
| **Testing** | Vitest, React Testing Library, Puppeteer |
| **Validation** | Zod |

### Available Scripts

#### Development
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run preview          # Preview production build
```

#### Testing
```bash
npm test                 # Run all tests in watch mode
npm run test:run         # Run all tests once
npm run test:coverage    # Generate coverage report
npm run test:ui          # Open Vitest UI

# Test Suites
npm run test:suite:unit              # Unit tests
npm run test:suite:base-operations   # Base station tests
npm run test:suite:database          # Database tests
npm run test:suite:integration       # Integration tests
npm run test:suite:e2e               # E2E tests
```

#### Utilities
```bash
npm run test:seed        # Seed test data
npm run test:clear       # Clear test data
npm run screenshots:all  # Capture screenshots
```

📖 [Development Guide](./docs/guides/development-guide.md)

---

## 🧪 Testing

### Test Coverage

The project maintains **>85% test coverage** across all modules:

- **Unit Tests**: Component and utility testing
- **Integration Tests**: Module interaction testing
- **E2E Tests**: Complete workflow testing
- **Database Tests**: Schema and data integrity testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:suite:base-operations

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Test Organization

```
test/
├── base-operations/     # Base station component tests
├── database/            # Database schema and operations
├── e2e/                 # End-to-end workflow tests
├── integration/         # Cross-module integration tests
├── services/            # Service layer tests
└── unit/                # Unit tests
```

📖 [Testing Guide](./docs/guides/testing-guide.md)  
📊 [Test Report](./docs/testing/test-report.md)

---

## 🚀 Deployment

### GitHub Pages (Recommended)

1. **Configure GitHub Pages**
   - Go to repository Settings → Pages
   - Source: GitHub Actions

2. **Deploy**
   ```bash
   npm run build
   # Push to main branch - GitHub Actions will deploy automatically
   ```

3. **Access your app**
   ```
   https://your-username.github.io/RaceTrackers
   ```

### Manual Deployment

```bash
# Build for production
npm run build

# Deploy dist/ folder to your hosting service
```

### Environment Variables

```bash
# .env
VITE_APP_VERSION=1.0.0
VITE_API_URL=https://api.example.com  # Optional
```

📖 [Deployment Guide](./docs/guides/deployment-guide.md)

---

## 📚 Documentation

### User Documentation
- 📖 [User Guide](./docs/guides/user-guide.md) - Complete user manual
- 🎯 [Quick Start Guide](./docs/guides/quick-start.md) - Get started quickly
- 🚀 [Deployment Guide](./docs/guides/deployment-guide.md) - Deployment instructions

### Technical Documentation
- 🏗️ [Solution Design](./notes/SolutionDesign.md) - Architecture and design decisions
- 📋 [Implementation Summary](./docs/implementation/implementation-summary.md) - Feature implementation details
- 🗄️ [Database Schema](./notes/Epic-01-Database-Foundation.md) - Database design and migrations

### Development Documentation
- 🧪 [Testing Guide](./docs/guides/testing-guide.md) - Testing strategies and procedures
- 🐛 [Bug Fixes Report](./notes/BUG_FIXES_REPORT.md) - Known issues and resolutions
- 📝 [TODO List](./notes/COMPREHENSIVE_TODO.md) - Development roadmap

### Implementation Epics
- [Epic 01: Database Foundation](./notes/Epic-01-Database-Foundation.md)
- [Epic 02: Checkpoint Operations](./notes/Epic-02-Checkpoint-Operations.md)
- [Epic 03: Base Station Operations](./notes/Epic-03-Base-Station-Operations.md)
- [Epic 04: Data Import/Export](./notes/Epic-04-Data-Import-Export.md)
- [Epic 05: PWA Deployment](./notes/Epic-05-PWA-Deployment.md)
- [Epic 06: Race Setup & Configuration](./notes/Epic-06-Race-Setup-Configuration.md)
- [Epic 07: Advanced Analytics](./notes/Epic-07-Advanced-Analytics.md)

### Screenshots & Visual Guides
- 📸 [Base Station Guide](./screenshots/base-station-guide/README.md) - Visual walkthrough
- 🖼️ [All Screenshots](./screenshots/) - Application screenshots

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Maintain test coverage >85%
- Update documentation for new features
- Add tests for bug fixes
- Use meaningful commit messages

### Code Style

- **JavaScript/React**: ESLint configuration
- **CSS**: Tailwind CSS utilities
- **Testing**: Vitest + React Testing Library patterns

📖 [Contributing Guide](./CONTRIBUTING.md)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Brandon Johnston

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [Vite](https://vitejs.dev/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/)
- Testing with [Vitest](https://vitest.dev/) and [Testing Library](https://testing-library.com/)

---

## 📞 Support

- 📧 **Email**: support@racetracker.example.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/bwhite001/RaceTrackers/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/bwhite001/RaceTrackers/discussions)

---

## 🗺️ Roadmap

### Current Version: v0.0.0

### Upcoming Features
- [ ] Real-time synchronization between devices
- [ ] Advanced analytics and reporting
- [ ] GPS tracking integration
- [ ] Timing chip (RFID) support
- [ ] Multi-language support
- [ ] Mobile app versions (iOS/Android)

📋 [Full Roadmap](./notes/Extended-Roadmap-Summary.md)

---

<div align="center">

**Made with ❤️ for race organizers and volunteers**

[⬆ Back to Top](#-racetracker-pro)

</div>
