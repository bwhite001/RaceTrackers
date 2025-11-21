# RaceTracker Pro - Sprint Execution Tasks

**Purpose:** Execution-ready task breakdown for Sprints 8-14  
**Format:** Copy-paste ready for AI implementation  
**Status:** Ready for immediate execution  
**Generated:** December 2024

---

## 🎯 How to Use This Document

### For AI Implementation:
1. Copy any task block below
2. Paste into new conversation with AI assistant
3. AI will have full context and acceptance criteria
4. Track completion by checking boxes

### For Project Management:
1. Import tasks into Jira/GitHub Projects
2. Assign to developers
3. Track sprint progress
4. Update estimates as needed

---

## 📋 SPRINT 8: MVP Core Completion (Week 1-2)

**Goal:** Production-ready core functionality  
**Story Points:** 34  
**Team:** 2 developers

---

### TASK 8.1: Complete Import/Export Validation (P0)

**Priority:** P0 - Critical  
**Effort:** 5-7 days  
**Assignee:** Backend Developer  
**Dependencies:** Zod library

#### Context
Currently, import/export is only 40% complete. Missing validation, checksums, and conflict resolution for multi-device safety. This blocks production deployment.

#### Requirements
1. Install Zod validation library: `npm install zod`
2. Create `src/services/ImportService.js`
3. Implement schema validation for all import data
4. Add SHA-256 checksum generation and verification
5. Build conflict detection algorithm
6. Create conflict resolution UI (newer/older/manual merge)
7. Implement transaction-based import (all-or-nothing)
8. Add import preview functionality
9. Test with corrupted data, network drops, format mismatches

#### Acceptance Criteria
- [ ] Zod schemas validate all import data types
- [ ] SHA-256 checksums generated on export
- [ ] Checksums verified on import (reject if mismatch)
- [ ] Conflict detection identifies timestamp differences
- [ ] UI presents conflicts with resolution options
- [ ] Import uses database transactions (rollback on error)
- [ ] Preview shows data before committing
- [ ] Round-trip test: export → import → verify (100% data integrity)
- [ ] Error handling for all edge cases
- [ ] Unit tests >90% coverage

#### Files to Create/Modify
- `src/services/ImportService.js` (new)
- `src/services/ExportService.js` (enhance existing)
- `src/components/ImportExport/ImportExportModal.jsx` (enhance)
- `src/components/ImportExport/ConflictResolutionDialog.jsx` (new)
- `src/test/ImportExport.test.js` (new)

#### Reference Documents
- `notes/Epic-04-Data-Import-Export.md` - Detailed specifications
- `notes/SolutionDesign.md` - Import/Export System section
- `notes/COMPREHENSIVE_TODO.md` - Epic 4 section

#### Testing Requirements
- Unit tests for validation logic
- Integration tests for import/export flow
- E2E test: full round-trip with conflicts
- Performance test: 1000+ runner import

---

### TASK 8.2: Configure PWA Service Worker (P0)

**Priority:** P0 - Critical  
**Effort:** 4-5 days  
**Assignee:** Frontend Developer  
**Dependencies:** vite-plugin-pwa (already installed)

#### Context
PWA is only 50% complete. Service worker not configured, offline mode incomplete. Required for production deployment as true PWA.

#### Requirements
1. Configure Workbox caching strategies in `vite.config.js`
2. Implement offline-first caching for all app routes
3. Add runtime caching for dynamic data
4. Configure cache versioning and cleanup
5. Test all features work offline
6. Implement offline indicator UI
7. Add install prompt for desktop/mobile
8. Test on Chrome, Firefox, Safari (desktop & mobile)
9. Optimize bundle size (<500KB target)

#### Acceptance Criteria
- [ ] Service worker caches all static assets
- [ ] Offline-first strategy implemented
- [ ] All features work without network
- [ ] Cache updates on new version
- [ ] Old caches cleaned up automatically
- [ ] Offline indicator shows when disconnected
- [ ] Install prompt appears on supported browsers
- [ ] PWA installable on iOS, Android, desktop
- [ ] Bundle size <500KB initial load
- [ ] Lighthouse PWA score = 100

#### Files to Create/Modify
- `vite.config.js` (configure PWA plugin)
- `public/manifest.json` (enhance)
- `src/components/Layout/OfflineIndicator.jsx` (new)
- `src/components/Layout/InstallPrompt.jsx` (new)
- `src/serviceWorker.js` (if custom logic needed)

#### Reference Documents
- `notes/Epic-05-PWA-Deployment.md` - Complete PWA specifications
- `notes/COMPREHENSIVE_TODO.md` - Epic 5 section
- Vite PWA Plugin docs: https://vite-pwa-org.netlify.app/

#### Testing Requirements
- Test offline functionality (disconnect network)
- Test install on Chrome, Edge, Safari
- Test cache updates on version change
- Run Lighthouse audit (target 100 PWA score)
- Test on 3G network (performance)

---

### TASK 8.3: Expand Test Coverage to >85% (P0)

**Priority:** P0 - Critical  
**Effort:** 7-10 days  
**Assignee:** QA Engineer + Developers  
**Dependencies:** Testing libraries (already installed)

#### Context
Current test coverage is ~40-50%. Need >85% for production confidence. Missing unit, integration, and E2E tests for critical flows.

#### Requirements
1. Run coverage report: `npm run test:coverage`
2. Identify untested code paths
3. Write unit tests for all services
4. Write integration tests for workflows
5. Write E2E tests for critical paths
6. Add performance tests (1000+ runners)
7. Add accessibility tests (keyboard, screen reader)
8. Achieve >85% overall coverage

#### Acceptance Criteria
- [ ] Unit test coverage >90% for services
- [ ] Integration test coverage >80% for workflows
- [ ] E2E tests cover all critical user journeys
- [ ] Performance tests pass (1000+ runners)
- [ ] Accessibility tests pass (WCAG 2.1 AA)
- [ ] All tests pass in CI/CD pipeline
- [ ] Coverage report shows >85% overall
- [ ] No critical code paths untested

#### Critical Flows to Test
1. **Race Creation Flow**
   - Create race → Add runners → Configure checkpoints → Save
2. **Checkpoint Operations**
   - Mark runner → Generate callout sheet → Call in times
3. **Base Station Operations**
   - Bulk entry → Withdrawal → Reports → Export
4. **Import/Export**
   - Export race → Import on new device → Verify data
5. **Offline Functionality**
   - Disconnect network → Perform operations → Reconnect → Sync

#### Files to Create/Modify
- `src/test/services/ImportService.test.js` (new)
- `src/test/services/ExportService.test.js` (new)
- `src/test/integration/RaceCreation.test.js` (new)
- `src/test/integration/CheckpointFlow.test.js` (new)
- `src/test/integration/BaseStationFlow.test.js` (new)
- `src/test/e2e/complete-race-workflow.test.js` (new)
- `src/test/performance/large-dataset.test.js` (new)
- `src/test/accessibility/keyboard-navigation.test.js` (new)

#### Reference Documents
- `notes/COMPREHENSIVE_TODO.md` - Testing Gaps section
- `notes/Epic-01-Database-Foundation.md` - Testing strategy
- `src/test/README.md` - Testing guidelines

#### Testing Requirements
- Run all tests: `npm test`
- Run coverage: `npm run test:coverage`
- Run E2E: `npm run test:e2e`
- Verify >85% coverage in report

---

### TASK 8.4: Test Schema v5→v6 Migration (P0)

**Priority:** P0 - Critical  
**Effort:** 1 day  
**Assignee:** Backend Developer  
**Dependencies:** None

#### Context
Schema v6 migration from v5 is untested. Risk of data loss on upgrade. Need migration test suite before production.

#### Requirements
1. Create test data in schema v5 format
2. Run migration to v6
3. Verify all data preserved
4. Test with corrupted data
5. Verify rollback works
6. Document migration procedure

#### Acceptance Criteria
- [ ] Test data created in v5 format
- [ ] Migration to v6 successful
- [ ] All v5 data present in v6
- [ ] New v6 tables created correctly
- [ ] Corrupted data handled gracefully
- [ ] Rollback procedure documented
- [ ] Migration guide written

#### Files to Create/Modify
- `src/test/migration/v5-to-v6.test.js` (new)
- `src/shared/services/database/migrations/v5-to-v6.js` (document)
- `docs/guides/migration-guide.md` (new)

#### Reference Documents
- `src/shared/services/database/schema.js` - Current schema
- `notes/COMPREHENSIVE_TODO.md` - Data Migration Testing section

#### Testing Requirements
- Test with empty database
- Test with 100 runners
- Test with 1000+ runners
- Test with corrupted data
- Verify rollback works

---

### TASK 8.5: Fix All P0 Bugs (P0)

**Priority:** P0 - Critical  
**Effort:** 2-3 days  
**Assignee:** All Developers  
**Dependencies:** Bug reports

#### Context
Critical bugs blocking production. Must be resolved before deployment.

#### Known P0 Bugs
1. **Race creation loading screen hang**
   - Investigate async timing issues
   - Check IndexedDB transaction handling
   - Verify data persistence logic
   - Add timeout and error handling

2. **Runner initialization errors**
   - Ensure all runner range types parsed correctly
   - Add fallback for malformed data
   - Improve error messages

3. **Navigation during operations**
   - Verify operation locks work correctly
   - Test all navigation scenarios
   - Fix any bypass routes

#### Acceptance Criteria
- [ ] All P0 bugs identified and logged
- [ ] Root cause analysis completed
- [ ] Fixes implemented and tested
- [ ] Regression tests added
- [ ] No new bugs introduced
- [ ] All P0 bugs closed

#### Files to Modify
- Various (based on bug reports)

#### Reference Documents
- GitHub Issues (P0 label)
- `notes/COMPREHENSIVE_TODO.md` - Identified Issues section

#### Testing Requirements
- Reproduce each bug
- Verify fix resolves issue
- Add regression test
- Test on all browsers

---

## 📋 SPRINT 9: Production Deployment (Week 3-4)

**Goal:** Live production deployment  
**Story Points:** 26  
**Team:** 2 developers + DevOps

---

### TASK 9.1: Set Up Production Infrastructure (P0)

**Priority:** P0 - Critical  
**Effort:** 3-5 days  
**Assignee:** DevOps Engineer  
**Dependencies:** None

#### Context
No production deployment procedures exist. Need hosting, CI/CD, monitoring, and backup systems.

#### Requirements
1. Choose hosting platform (Netlify/Vercel/AWS)
2. Configure HTTPS and domain
3. Set up CI/CD pipeline (GitHub Actions)
4. Configure environment variables
5. Set up monitoring (Sentry, LogRocket)
6. Configure CDN for assets
7. Set up backup procedures
8. Document deployment process

#### Acceptance Criteria
- [ ] Production hosting configured
- [ ] HTTPS enabled with valid certificate
- [ ] Custom domain configured
- [ ] CI/CD pipeline deploys on merge to main
- [ ] Environment variables secured
- [ ] Error monitoring active (Sentry)
- [ ] User session recording active (LogRocket)
- [ ] CDN serving static assets
- [ ] Automated backups configured
- [ ] Deployment runbook documented

#### Files to Create
- `.github/workflows/deploy.yml` (CI/CD)
- `docs/deployment/production-setup.md` (runbook)
- `docs/deployment/rollback-procedure.md` (rollback)
- `docs/deployment/monitoring-guide.md` (monitoring)

#### Reference Documents
- `notes/COMPREHENSIVE_TODO.md` - Deployment Readiness section
- `notes/Epic-05-PWA-Deployment.md` - Deployment strategy

#### Testing Requirements
- Test deployment from CI/CD
- Test rollback procedure
- Verify monitoring captures errors
- Test backup and restore

---

### TASK 9.2: Security Audit and Fixes (P0)

**Priority:** P0 - Critical  
**Effort:** 2-3 days  
**Assignee:** Security Engineer / Senior Developer  
**Dependencies:** None

#### Context
No security audit performed. Need to identify and fix vulnerabilities before production.

#### Requirements
1. Install DOMPurify: `npm install dompurify`
2. Audit all user input fields
3. Sanitize all text inputs
4. Validate all form data
5. Check for XSS vulnerabilities
6. Review authentication (if any)
7. Scan dependencies for vulnerabilities
8. Configure security headers

#### Acceptance Criteria
- [ ] DOMPurify installed and configured
- [ ] All user inputs sanitized
- [ ] All forms validated
- [ ] No XSS vulnerabilities found
- [ ] Dependency scan clean (npm audit)
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Security audit report completed
- [ ] All critical/high vulnerabilities fixed

#### Files to Create/Modify
- `src/utils/sanitize.js` (new - DOMPurify wrapper)
- All form components (add sanitization)
- `vite.config.js` (security headers)
- `docs/security/audit-report.md` (new)

#### Reference Documents
- `notes/COMPREHENSIVE_TODO.md` - Security Issues section
- OWASP Top 10: https://owasp.org/www-project-top-ten/

#### Testing Requirements
- Run npm audit
- Test XSS attack vectors
- Verify sanitization works
- Test security headers

---

### TASK 9.3: Complete User Documentation (P1)

**Priority:** P1 - High  
**Effort:** 5-7 days  
**Assignee:** Technical Writer / Developer  
**Dependencies:** None

#### Context
User documentation incomplete. Essential for adoption and reducing support burden.

#### Requirements
1. Write complete user guide for all features
2. Create video tutorials (5-10 min each)
3. Write troubleshooting guide
4. Create quick reference cards
5. Add in-app help tooltips
6. Write admin guide
7. Create training materials

#### Acceptance Criteria
- [ ] User guide covers all MVP features
- [ ] Video tutorials created (race setup, checkpoint ops, base station)
- [ ] Troubleshooting guide with common issues
- [ ] Quick reference cards (PDF, printable)
- [ ] In-app help tooltips on all complex features
- [ ] Admin guide for deployment and maintenance
- [ ] Training materials for volunteers

#### Files to Create
- `docs/guides/user-guide.md` (complete)
- `docs/guides/admin-guide.md` (new)
- `docs/guides/troubleshooting.md` (new)
- `docs/guides/quick-reference.pdf` (new)
- `docs/training/checkpoint-volunteer.md` (new)
- `docs/training/base-station-operator.md` (new)
- Video files (upload to YouTube/Vimeo)

#### Reference Documents
- `notes/COMPREHENSIVE_TODO.md` - Missing Documentation section
- `notes/BASE_STATION_README.md` - Base station docs
- Existing user guides in `docs/guides/`

#### Testing Requirements
- Have non-technical user follow guide
- Verify all features documented
- Test troubleshooting steps
- Review with stakeholders

---

### TASK 9.4: User Acceptance Testing (UAT) (P0)

**Priority:** P0 - Critical  
**Effort:** 3-4 days  
**Assignee:** QA Engineer + Beta Testers  
**Dependencies:** All previous Sprint 9 tasks

#### Context
Need real users to test before production launch. Identify any UX issues or bugs.

#### Requirements
1. Recruit 10+ beta testers
2. Provide test scenarios
3. Collect feedback
4. Fix critical issues
5. Verify fixes with testers
6. Get sign-off for production

#### Acceptance Criteria
- [ ] 10+ beta testers recruited
- [ ] Test scenarios provided
- [ ] All testers complete scenarios
- [ ] Feedback collected and analyzed
- [ ] Critical issues fixed
- [ ] Fixes verified by testers
- [ ] User satisfaction >4.5/5
- [ ] Sign-off received for production

#### Test Scenarios
1. Create new race with 100 runners
2. Configure 4 checkpoints
3. Mark runners at checkpoint
4. Generate callout sheet
5. Enter bulk times at base station
6. Generate race report
7. Export and import race data
8. Test offline functionality

#### Files to Create
- `docs/testing/uat-plan.md` (new)
- `docs/testing/uat-scenarios.md` (new)
- `docs/testing/uat-feedback.md` (new)

#### Reference Documents
- `notes/COMPREHENSIVE_TODO.md` - Testing section

#### Testing Requirements
- All scenarios completed by all testers
- Feedback documented
- Issues logged and prioritized
- Critical issues fixed

---

### TASK 9.5: Production Deployment (P0)

**Priority:** P0 - Critical  
**Effort:** 1 day  
**Assignee:** DevOps Engineer  
**Dependencies:** All previous Sprint 9 tasks

#### Context
Final production deployment after all checks pass.

#### Requirements
1. Final code review
2. Run all tests
3. Build production bundle
4. Deploy to production
5. Smoke test production
6. Monitor for errors
7. Announce launch

#### Acceptance Criteria
- [ ] All tests passing
- [ ] Code review approved
- [ ] Production build successful
- [ ] Deployment successful
- [ ] Smoke tests pass
- [ ] No critical errors in first hour
- [ ] Monitoring shows healthy metrics
- [ ] Launch announcement sent

#### Deployment Checklist
- [ ] All P0 tasks complete
- [ ] >85% test coverage
- [ ] Lighthouse PWA score 100
- [ ] Security audit passed
- [ ] UAT sign-off received
- [ ] Documentation complete
- [ ] Backup procedures tested
- [ ] Rollback plan ready
- [ ] Support team briefed

#### Files to Reference
- `docs/deployment/production-setup.md`
- `docs/deployment/rollback-procedure.md`

#### Reference Documents
- `notes/COMPREHENSIVE_TODO.md` - Deployment Readiness section

#### Testing Requirements
- Smoke test all critical paths
- Monitor error rates
- Check performance metrics
- Verify offline functionality

---

## 📋 SPRINT 10: Architecture Cleanup (Week 5-6)

**Goal:** Technical debt reduction  
**Story Points:** 21  
**Team:** 2 developers

---

### TASK 10.1: Implement DAL Pattern (P1)

**Priority:** P1 - High  
**Effort:** 3-4 days  
**Assignee:** Backend Developer  
**Dependencies:** None

#### Context
StorageService is 858 lines and violates Single Responsibility Principle. Need to refactor into focused DAL classes.

#### Requirements
1. Create `src/database/dal/` directory
2. Create RaceDAL.js (race CRUD operations)
3. Create RunnerDAL.js (runner CRUD operations)
4. Create CheckpointDAL.js (checkpoint CRUD operations)
5. Create CheckpointTimeDAL.js (time tracking operations)
6. Create BaseStationCallInDAL.js (call-in operations)
7. Refactor StorageService to use DAL classes
8. Update all components to use DAL

#### Acceptance Criteria
- [ ] 5 DAL classes created
- [ ] Each DAL has single responsibility
- [ ] All database operations go through DAL
- [ ] StorageService refactored or removed
- [ ] Components updated to use DAL
- [ ] All tests updated and passing
- [ ] No functionality broken
- [ ] Code more maintainable

#### Files to Create
- `src/database/dal/RaceDAL.js` (new)
- `src/database/dal/RunnerDAL.js` (new)
- `src/database/dal/CheckpointDAL.js` (new)
- `src/database/dal/CheckpointTimeDAL.js` (new)
- `src/database/dal/BaseStationCallInDAL.js` (new)
- `src/database/dal/index.js` (new - exports)

#### Files to Modify
- `src/services/storage.js` (refactor or deprecate)
- All components using StorageService

#### Reference Documents
- `notes/COMPREHENSIVE_TODO.md` - Epic 1, DAL Pattern section
- `notes/Epic-01-Database-Foundation.md` - DAL specifications
- `notes/SolutionDesign.md` - Data Access Layer section

#### Testing Requirements
- Unit tests for each DAL class
- Integration tests for DAL interactions
- Verify all existing functionality works
- Performance tests (no regression)

---

### TASK 10.2: Extract Service Layer (P1)

**Priority:** P1 - High  
**Effort:** 3-4 days  
**Assignee:** Backend Developer  
**Dependencies:** TASK 10.1 (DAL Pattern)

#### Context
Business logic is mixed with data access and UI components. Need clean service layer.

#### Requirements
1. Create `src/services/` directory structure
2. Create CheckpointService.js (checkpoint business logic)
3. Create BaseStationService.js (base station business logic)
4. Create RaceManagementService.js (race management logic)
5. Create AnalyticsService.js (calculations and analytics)
6. Move business logic from components to services
7. Services use DAL for data access

#### Acceptance Criteria
- [ ] 4 service classes created
- [ ] Business logic extracted from components
- [ ] Services use DAL for data access
- [ ] Components simplified (UI only)
- [ ] Services are stateless and testable
- [ ] All tests updated and passing
- [ ] No functionality broken

#### Files to Create
- `src/services/CheckpointService.js` (new)
- `src/services/BaseStationService.js` (new)
- `src/services/RaceManagementService.js` (new)
- `src/services/AnalyticsService.js` (new)

#### Files to Modify
- All components with business logic

#### Reference Documents
- `notes/COMPREHENSIVE_TODO.md` - Service Layer section
- `notes/SolutionDesign.md` - Architecture section

#### Testing Requirements
- Unit tests for each service
- Mock DAL in service tests
- Integration tests for service workflows
- Verify all functionality works

---

### TASK 10.3: Refactor Large Stores (P2)

**Priority:** P2 - Medium  
**Effort:** 2-3 days  
**Assignee:** Frontend Developer  
**Dependencies:** None

#### Context
useRaceStore is 800+ lines. Need to split by domain for maintainability.

#### Requirements
1. Analyze useRaceStore dependencies
2. Split into domain-specific stores:
   - useRaceConfigStore (race configuration)
   - useRunnerStore (runner management)
   - useCheckpointStore (checkpoint operations)
   - useAnalyticsStore (analytics and reporting)
3. Update components to use new stores
4. Ensure no functionality broken

#### Acceptance Criteria
- [ ] useRaceStore split into 4 stores
- [ ] Each store has clear responsibility
- [ ] Components updated to use new stores
- [ ] Store composition works correctly
- [ ] All tests updated and passing
- [ ] No functionality broken
- [ ] Code more maintainable

#### Files to Create
- `src/store/useRaceConfigStore.js` (new)
- `src/store/useRunnerStore.js` (new)
- `src/store/useCheckpointStore.js` (new)
- `src/store/useAnalyticsStore.js` (new)

#### Files to Modify
- `src/store/useRaceStore.js` (refactor or deprecate)
- All components using useRaceStore

#### Reference Documents
- `notes/COMPREHENSIVE_TODO.md` - Store Refactoring section

#### Testing Requirements
- Unit tests for each store
- Integration tests for store interactions
- Verify all functionality works
- Performance tests (no regression)

---

### TASK 10.4: Code Cleanup and Optimization (P2)

**Priority:** P2 - Medium  
**Effort:** 1-2 days  
**Assignee:** All Developers  
**Dependencies:** Previous Sprint 10 tasks

#### Context
After refactoring, need to clean up unused code and optimize performance.

#### Requirements
1. Remove unused imports and variables
2. Remove deprecated code
3. Optimize re-renders (React.memo, useCallback)
4. Remove console.logs
5. Update comments and documentation
6. Run linter and fix issues
7. Format all code consistently

#### Acceptance Criteria
- [ ] No unused imports or variables
- [ ] No deprecated code
- [ ] Optimized re-renders
- [ ] No console.logs in production
- [ ] Comments up to date
- [ ] Linter passes with no errors
- [ ] Code formatted consistently
- [ ] Bundle size optimized

#### Files to Modify
- All files (cleanup)

#### Reference Documents
- ESLint configuration
- Prettier configuration

#### Testing Requirements
- All tests still passing
- Performance improved or same
- Bundle size reduced or same

---

## 📋 SPRINT 11-12: CSV Import (Epic 6) (Week 7-9)

**Goal:** Streamlined race setup  
**Story Points:** 21  
**Team:** 2 developers

---

### TASK 11.1: Implement CSV/Excel Parser (P1)

**Priority:** P1 - High  
**Effort:** 3-4 days  
**Assignee:** Backend Developer  
**Dependencies:** xlsx library

#### Context
Manual runner entry takes 2 hours. CSV import will reduce to 10 minutes (90% time savings).

#### Requirements
1. Install xlsx library: `npm install xlsx`
2. Create `src/services/RunnerImportService.js`
3. Implement CSV parser with quote handling
4. Implement Excel parser (XLSX)
5. Add column mapping detection
6. Create validation schema with Zod
7. Implement error reporting
8. Add duplicate detection

#### Acceptance Criteria
- [ ] CSV files parsed correctly
- [ ] Excel files parsed correctly
- [ ] Column mapping auto-detected
- [ ] Data validated before import
- [ ] Errors reported with row numbers
- [ ] Duplicates detected
- [ ] Large files handled (1000+ rows)
- [ ] Unit tests >90% coverage

#### Files to Create
- `src/services/RunnerImportService.js` (new)
- `src/test/services/RunnerImportService.test.js` (new)

#### Reference Documents
- `notes/Epic-06-Race-Setup-Configuration.md` - Complete specifications
- `notes/COMPREHENSIVE_TODO.md` - Epic 6 section

#### Testing Requirements
- Test with various CSV formats
- Test with Excel files
- Test with malformed data
- Test with 1000+ rows
- Test column mapping variations

---

### TASK 11.2: Build Import UI (P1)

**Priority:** P1 - High  
**Effort:** 3-4 days  
**Assignee:** Frontend Developer  
**Dependencies:** TASK 11.1

#### Context
Need user-friendly UI for CSV/Excel import with preview and error handling.

#### Requirements
1. Create `src/components/Setup/RunnerImportDialog.jsx`
2. Build file upload interface
3. Create preview table component
4. Add error highlighting
5. Implement column mapping UI
6. Add import progress indicator
7. Create template download button

#### Acceptance Criteria
- [ ] File upload works (drag-and-drop + click)
- [ ] Preview shows first 10 rows
- [ ] Errors highlighted in red
- [ ] Column mapping UI intuitive
- [ ] Progress indicator during import
- [ ] Template downloadable
- [ ] Mobile responsive
- [ ] Accessible (keyboard navigation)

#### Files to Create
- `src/components/Setup/RunnerImportDialog.jsx` (new)
- `src/components/Setup/ImportPreviewTable.jsx` (new)
- `src/components/Setup/ColumnMappingUI.jsx` (new)

#### Reference Documents
- `notes/Epic-06-Race-Setup-Configuration.md` - UI specifications

#### Testing Requirements
- Test file upload
- Test preview with various data
- Test error display
- Test column mapping
- Test on mobile devices

---

### TASK 11.3: Checkpoint Configuration UI (P1)

**Priority:** P1 - High  
**Effort:** 2-3 days  
**Assignee:** Frontend Developer  
**Dependencies:** None

#### Requirements
1. Install react-dnd: `npm install react-dnd react-dnd-html5-backend`
2. Create `src/components/Setup/CheckpointConfiguration.jsx`
3. Implement drag-and-drop reordering
4. Add checkpoint validation
5. Create checkpoint templates

#### Acceptance Criteria
- [ ] Checkpoints can be added/edited/deleted
- [ ] Drag-and-drop reordering works
- [ ] Validation prevents invalid configs
- [ ] Templates available for common setups
- [ ] Mobile responsive
- [ ] Accessible

#### Files to Create
- `src/components/Setup/CheckpointConfiguration.jsx` (new)
- `src/components/Setup/CheckpointTemplates.jsx` (new)

#### Reference Documents
- `notes/Epic-06-Race-Setup-Configuration.md` - Checkpoint config specs

#### Testing Requirements
- Test drag-and-drop
- Test validation
- Test templates
- Test on mobile

---

### TASK 11.4: Race Templates (P1)

**Priority:** P1 - High  
**Effort:** 2-3 days  
**Assignee:** Backend Developer  
**Dependencies:** None

#### Requirements
1. Design template data structure
2. Implement template save/load
3. Create template library UI
4. Add template sharing (export/import)

#### Acceptance Criteria
- [ ] Templates can be saved
- [ ] Templates can be loaded
- [ ] Template library UI functional
- [ ] Templates can be exported/imported
- [ ] Common templates pre-loaded

#### Files to Create
- `src/services/TemplateService.js` (new)
- `src/components/Setup/TemplateLibrary.jsx` (new)

#### Reference Documents
- `notes/Epic-06-Race-Setup-Configuration.md` - Template specs

#### Testing Requirements
- Test save/load
- Test export/import
- Test template application

---

## 📋 SPRINT 13-14: Analytics (Epic 7) (Week 10-13)

**Goal:** Professional reporting and analytics  
**Story Points:** 34  
**Team:** 2 developers

---

### TASK 13.1: Real-Time Dashboard (P2)

**Priority:** P2 - Medium  
**Effort:** 5-7 days  
**Assignee:** Frontend Developer  
**Dependencies:** Chart.js

#### Requirements
1. Install Chart.js: `npm install chart.js react-chartjs-2`
2. Create `src/components/Analytics/Dashboard.jsx`
3. Implement live leaderboard calculation
4. Add auto-refresh (30-second intervals)
5. Create runner progress visualization
6. Add checkpoint flow diagram

#### Acceptance Criteria
- [ ] Dashboard shows live race stats
- [ ] Leaderboard updates every 30 seconds
- [ ] Progress visualization clear
- [ ] Checkpoint flow diagram accurate
- [ ] Performance good (1000+ runners)
- [ ] Mobile responsive

#### Files to Create
- `src/components/Analytics/Dashboard.jsx` (new)
- `src/components/Analytics/LiveLeaderboard.jsx` (new)
- `src/components/Analytics/ProgressVisualization.jsx` (new)
- `src/services/AnalyticsService.js` (enhance)

#### Reference Documents
- `notes/Epic-07-Advanced-Analytics.md` - Complete specifications

#### Testing Requirements
- Test with live data
- Test auto-refresh
- Test performance
- Test on mobile

---

### TASK 13.2: Performance Analysis (P2)

**Priority
