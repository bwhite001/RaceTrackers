# Base Reporting UI Refactoring Plan

## Current Understanding

### Existing Base Station Implementation
The current Base Station implementation has:
1. **BaseStationView.jsx** - Main view with 3 tabs:
   - Runner Grid (IsolatedBaseStationRunnerGrid)
   - Data Entry (bulk time assignment)
   - Call-In Page (call-in tracking)

2. **Data Entry Features**:
   - Master View: Shows all runners with status counts
   - Bulk Entry: Common time assignment for groups
   - Checkpoint data import
   - Range parsing (e.g., "100-105")

3. **Call-In Page Features**:
   - Bulk/Individual mode toggle
   - Time segment grouping
   - Runner selection and marking

### Legacy Application Requirements (from task description)

#### Core Functional Components:
1. **Entry Management**
   - Add entries (runner number + checkpoint/time)
   - Withdrawal and Vet-Out (with reversal using *)
   - Duplicate handling
   - Validation of runner numbers

2. **Logging and Checkpoints**
   - Checkpoint and time capture
   - Default 5-minute time blocks
   - Multiple checkpoint support

3. **List and Table Operations**
   - Missing numbers list
   - Out list (withdrawn/vetted out)
   - Strapper support (pending resource calls)
   - Log operations (update, delete, view deleted, duplicates)
   - Sorting (CP/Time, Number, Default order)

4. **Backup and Data Integrity**
   - Backup/Restore to external storage
   - Audit trail (deleted items preserved)

5. **Reporting**
   - Missing numbers report
   - Out list report
   - Checkpoint logs
   - CSV/Excel export

6. **Special Features**
   - Strapper integration (pending calls)
   - Radio communication/packet logging
   - Custom sorting

#### Hotkey Requirements (from legacy):
- Alt+A: Add Checkpoint
- Alt+B, Alt+D: Add Number
- Alt M, V, S, K, I, P: Sort operations
- Alt+K, Alt+X: Backup
- Alt+E, Alt+L: Delete
- Alt+R: Reports Print
- Alt+S: Out List
- Alt+V, Alt+W: Vet Out/Withdraw
- Alt+H, Alt+O: Help/About
- Esc: Cancel
- Alt+X, Alt+N: Next/Commit
- Alt+Q: Quit

### Gap Analysis

#### Missing Features (Legacy → Current):
1. ❌ **Missing Numbers List** - Not implemented
2. ❌ **Out List (Withdrawn/Vet-Out)** - Not implemented
3. ❌ **Strapper Calls Management** - Not implemented
4. ❌ **Duplicate Entry Detection/Resolution** - Not implemented
5. ❌ **Deleted Entries View (Audit Trail)** - Not implemented
6. ❌ **Log Operations Panel** - Not implemented
7. ❌ **Sorting Options** - Limited sorting
8. ❌ **Withdrawal Dialog with Reversal** - Not implemented
9. ❌ **Reports Generation** - Limited reporting
10. ❌ **Hotkey Support** - Not implemented
11. ❌ **Backup/Restore UI** - Not in base station
12. ❌ **Help/About Dialogs** - Not implemented

#### Existing Features to Preserve:
1. ✅ Runner Grid with status visualization
2. ✅ Bulk data entry
3. ✅ Time segment grouping
4. ✅ Search functionality
5. ✅ Dark mode support
6. ✅ Responsive design

---

## Refactoring Plan

### Phase 1: Information Gathering ✅
- [x] Read BaseStationView.jsx
- [x] Read DataEntry.jsx
- [x] Read BaseStationCallInPage.jsx
- [x] Read IsolatedBaseStationRunnerGrid.jsx
- [x] Read SharedRunnerGrid.jsx
- [x] Read baseOperationsStore.js
- [x] Read BaseOperationsRepository.js
- [x] Read useRaceStore.js
- [x] Understand current architecture

### Phase 2: Detailed Planning ✅
- [x] Create comprehensive plan documents
- [x] Document UI layouts
- [x] Define component structure
- [x] Plan database schema
- [x] Get stakeholder approval

### Phase 3: Database & Repository ✅
- [x] Update database schema (version 6)
- [x] Add deleted_entries table
- [x] Add strapper_calls table
- [x] Add audit_log table
- [x] Add withdrawal_records table
- [x] Add vet_out_records table
- [x] Enhance BaseOperationsRepository with 20+ new methods
  - [x] Audit trail methods
  - [x] Deleted entries management
  - [x] Withdrawal operations
  - [x] Vet-out operations
  - [x] Strapper calls management
  - [x] Missing numbers detection
  - [x] Out list generation
  - [x] Duplicate detection
  - [x] Report generation

### Phase 4: Store Enhancement ✅
- [x] Enhance baseOperationsStore.js with new state/actions
- [x] Add withdrawal/vet-out actions
- [x] Add strapper calls actions
- [x] Add deleted entries actions
- [x] Add duplicate detection actions
- [x] Add report generation actions

### Phase 5: Component Creation (Next)

#### A. New Components to Create

1. **MissingNumbersList.jsx**
   - Display runners not yet checked in at checkpoint
   - Filter by checkpoint
   - Print/Export functionality
   - Real-time updates

2. **OutList.jsx**
   - Show withdrawn/vetted out/DNF runners
   - Comments and timestamps
   - Reason codes
   - Print/Export functionality

3. **WithdrawalDialog.jsx**
   - Enter runner number + checkpoint/time
   - Withdrawal reason dropdown
   - Comments field
   - Reversal support (enter number + *)
   - Confirmation dialog

4. **VetOutDialog.jsx**
   - Similar to WithdrawalDialog
   - Vet-specific reason codes
   - Medical notes field

5. **StrapperCallsPanel.jsx**
   - Pending resource calls list
   - Add/Clear/View calls
   - Priority indicators
   - Status tracking

6. **LogOperationsPanel.jsx**
   - Update entry
   - Delete entry
   - View deleted entries
   - View duplicates
   - Sort options (CP/Time, Number, Default)

7. **DuplicateEntriesDialog.jsx**
   - Show duplicate runner entries
   - Resolution options
   - Merge or keep separate
   - Audit trail

8. **DeletedEntriesView.jsx**
   - Show all deleted entries
   - Deletion timestamp
   - Restore functionality
   - Audit trail

9. **ReportsPanel.jsx**
   - Report type selection
   - Filter options
   - Preview
   - Print/Export (CSV, Excel, HTML)

10. **BackupRestoreDialog.jsx**
    - Backup to external storage
    - Date-stamped backups
    - Restore from backup
    - Backup history

11. **HotkeysProvider.jsx**
    - Global hotkey handler
    - Context-aware shortcuts
    - Help overlay (Alt+H)

12. **HelpDialog.jsx**
    - Keyboard shortcuts reference
    - Feature documentation
    - Quick start guide

13. **AboutDialog.jsx**
    - Version information
    - Credits
    - License

---

## Implementation Steps

### Step 1: Core Infrastructure ✅
- [x] Add audit trail schema to database
- [x] Enhance BaseOperationsRepository.js with new methods

### Step 2: Store Enhancement ✅
- [x] Enhance baseOperationsStore.js with new state/actions
- [x] Create HotkeysProvider.jsx

### Step 3: Dialogs & Modals ✅
- [x] Create WithdrawalDialog.jsx
- [x] Create VetOutDialog.jsx
- [x] Create HelpDialog.jsx
- [x] Create AboutDialog.jsx
- [x] Create BackupRestoreDialog.jsx

### Step 4: List Components ✅
- [x] Create MissingNumbersList.jsx
- [x] Create OutList.jsx
- [x] Create DeletedEntriesView.jsx
- [x] Create DuplicateEntriesDialog.jsx

### Step 5: Operations Panels ✅
- [x] Create LogOperationsPanel.jsx
- [x] Create StrapperCallsPanel.jsx
- [x] Create ReportsPanel.jsx

### Step 6: Integration ✅
- [x] Restructure BaseStationView.jsx with new tabs
- [x] Integrate all new components
- [x] Wire up all hotkeys
- [x] Add validation and error handling
- [x] Test complete workflow

### Step 7: Testing & Polish (NEXT)
- [ ] Run application and test all workflows
- [ ] Test all hotkeys functionality
- [ ] Test data integrity and audit trail
- [ ] Test backup/restore operations
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Fix any bugs found during testing

### Step 8: Documentation
- [ ] Update README.md
- [ ] Create HOTKEYS.md
- [ ] Create BASE_STATION_GUIDE.md
- [ ] Add inline help text

---

## Progress Summary

### Completed ✅
1. **Planning Phase** - Comprehensive documentation created
2. **Database Schema** - Version 6 with 5 new tables
3. **Repository Layer** - 20+ new methods for all operations
4. **Store Enhancement** - 25+ new actions and state management

### In Progress 🔄
5. **Component Creation** - Ready to start building UI components

### Upcoming 📋
5. **Component Creation** - 13 new components
6. **Integration** - Wire everything together
7. **Testing** - Comprehensive testing
8. **Documentation** - User guides and references

---

## Timeline Estimate

- **Phase 1**: 1 day ✅ Complete
- **Phase 2**: 1 day ✅ Complete
- **Phase 3**: 1 day ✅ Complete
- **Phase 4**: 1 day (In Progress)
- **Phase 5**: 3-4 days (Component Creation)
- **Phase 6**: 2-3 days (Integration & Testing)
- **Phase 7**: 1 day (Documentation)

**Total**: 10-14 days
**Completed**: 4 days
**Remaining**: 6-10 days

---

## Next Immediate Steps

1. ✅ Database schema updated
2. ✅ Repository methods implemented
3. ✅ Enhanced baseOperationsStore.js
4. 🔄 Create HotkeysProvider.jsx (CURRENT)
5. 📋 Start building dialog components
6. 📋 Create list components
7. 📋 Create operations panels
8. 📋 Integrate everything into BaseStationView
