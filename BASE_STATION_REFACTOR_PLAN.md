# Base Station UI Refactoring - Detailed Plan

## Executive Summary

This document outlines the comprehensive refactoring plan for the Base Station Reporting UI to align with the legacy WICEN application while leveraging modern architecture and UX best practices.

---

## 1. Current State Analysis

### Existing Architecture
```
src/
├── views/
│   └── BaseStationView.jsx (3 tabs)
├── components/BaseStation/
│   ├── DataEntry.jsx
│   ├── BaseStationCallInPage.jsx
│   └── IsolatedBaseStationRunnerGrid.jsx
├── modules/base-operations/
│   ├── store/baseOperationsStore.js
│   └── services/BaseOperationsRepository.js
└── store/
    └── useRaceStore.js
```

### Current Features
- ✅ Runner grid with status tracking
- ✅ Bulk data entry with range parsing
- ✅ Call-in page with time segments
- ✅ Search and filtering
- ✅ Dark mode support

### Missing Legacy Features
- ❌ Missing Numbers List
- ❌ Out List (Withdrawn/Vet-Out)
- ❌ Strapper Calls Management
- ❌ Log Operations (Update/Delete/View Deleted/Duplicates)
- ❌ Withdrawal/Vet-Out Dialogs
- ❌ Reports Generation
- ❌ Backup/Restore UI
- ❌ Hotkey Support
- ❌ Help/About Dialogs
- ❌ Audit Trail

---

## 2. Proposed Architecture

### New Component Structure
```
src/
├── views/
│   └── BaseStationView.jsx (6 tabs + modals)
├── components/BaseStation/
│   ├── DataEntry.jsx (enhanced)
│   ├── BaseStationCallInPage.jsx
│   ├── IsolatedBaseStationRunnerGrid.jsx
│   ├── LogOperationsPanel.jsx (NEW)
│   ├── ListsReportsPanel.jsx (NEW)
│   ├── HousekeepingPanel.jsx (NEW)
│   ├── MissingNumbersList.jsx (NEW)
│   ├── OutList.jsx (NEW)
│   ├── StrapperCallsPanel.jsx (NEW)
│   ├── ReportsPanel.jsx (NEW)
│   └── dialogs/
│       ├── WithdrawalDialog.jsx (NEW)
│       ├── VetOutDialog.jsx (NEW)
│       ├── DuplicateEntriesDialog.jsx (NEW)
│       ├── DeletedEntriesView.jsx (NEW)
│       ├── BackupRestoreDialog.jsx (NEW)
│       ├── HelpDialog.jsx (NEW)
│       └── AboutDialog.jsx (NEW)
├── shared/components/
│   └── HotkeysProvider.jsx (NEW)
└── modules/base-operations/
    ├── store/baseOperationsStore.js (enhanced)
    └── services/BaseOperationsRepository.js (enhanced)
```

---

## 3. UI Layout Design

### Main View - Tab Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Base Station Operations                    [Exit Base]     │
├─────────────────────────────────────────────────────────────┤
│  [Runner Grid] [Data Entry] [Log Ops] [Lists] [House] [Overview] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                    TAB CONTENT AREA                          │
│                                                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Tab 1: Runner Grid (Existing - Enhanced)
```
┌─────────────────────────────────────────────────────────────┐
│  Search: [_____________]  View: [Grid|List]  Group: [50▼]   │
├─────────────────────────────────────────────────────────────┤
│  Runners 100-149                              ✓ 25/50       │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐      │
│  │100 │101 │102 │103 │104 │105 │106 │107 │108 │109 │      │
│  │✓   │✓   │    │✓   │    │    │✓   │    │    │✓   │      │
│  │9:15│9:16│    │9:17│    │    │9:18│    │    │9:19│      │
│  └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘      │
│  ... (more runners)                                          │
├─────────────────────────────────────────────────────────────┤
│  Instructions:                                               │
│  • Click to mark passed • Double-click to unmark            │
│  • Click time to edit   • Alt+B to focus input              │
└─────────────────────────────────────────────────────────────┘
```

### Tab 2: Data Entry (Enhanced)
```
┌─────────────────────────────────────────────────────────────┐
│  [Master View] [Bulk Entry]                                  │
├─────────────────────────────────────────────────────────────┤
│  Status Summary:                                             │
│  Not Started: 45  Called In: 12  Finished: 38  DNF: 2       │
├─────────────────────────────────────────────────────────────┤
│  Common Time: [2024-01-15 14:30] [Now] [Race Start]        │
│  Checkpoint:  [Checkpoint 1 ▼]                              │
│  Runner Numbers:                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 101, 102, 105-110, 115                              │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│  Preview: 101, 102, 105, 106, 107, 108, 109, 110, 115      │
│                                                              │
│  [Assign Time to 9 Runners]                                 │
├─────────────────────────────────────────────────────────────┤
│  Quick Actions:                                              │
│  [Withdraw Runner] [Vet Out] [View Duplicates]              │
├─────────────────────────────────────────────────────────────┤
│  Recent Entries (Last 10):                                   │
│  Runner 115 - 14:28  Runner 114 - 14:27  Runner 113 - 14:26│
└─────────────────────────────────────────────────────────────┘
```

### Tab 3: Log Operations (NEW)
```
┌─────────────────────────────────────────────────────────────┐
│  Entry Log                                                   │
│  Sort: [CP/Time ▼] [Number] [Default]  [Refresh]           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────┬────────┬────────────┬──────────┬────────────┐    │
│  │ No.  │ CP     │ Time       │ Status   │ Actions    │    │
│  ├──────┼────────┼────────────┼──────────┼────────────┤    │
│  │ 101  │ 1      │ 14:28:15   │ Passed   │ [Edit][Del]│    │
│  │ 102  │ 1      │ 14:28:20   │ Passed   │ [Edit][Del]│    │
│  │ 103  │ 1      │ 14:28:25   │ Passed   │ [Edit][Del]│    │
│  │ 104  │ 1      │ 14:28:30   │ Passed   │ [Edit][Del]│    │
│  │ ...  │ ...    │ ...        │ ...      │ ...        │    │
│  └──────┴────────┴────────────┴──────────┴────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  [Update Entry] [Delete Entry] [View Deleted] [View Dupes]  │
├─────────────────────────────────────────────────────────────┤
│  Showing 150 entries | Page 1 of 3                          │
└─────────────────────────────────────────────────────────────┘
```

### Tab 4: Lists & Reports (NEW)
```
┌─────────────────────────────────────────────────────────────┐
│  [Missing Numbers] [Out List] [Reports]                     │
├─────────────────────────────────────────────────────────────┤
│  Missing Numbers at Checkpoint 1:                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 103, 105, 107, 112, 115, 118, 120-125, 130         │   │
│  │                                                       │   │
│  │ Total Missing: 15 runners                            │   │
│  └─────────────────────────────────────────────────────┘   │
│  [Print] [Export CSV] [Export Excel]                        │
├─────────────────────────────────────────────────────────────┤
│  Out List (Withdrawn/DNF/Vet-Out):                          │
│  ┌──────┬──────────┬────────────┬─────────────────────┐    │
│  │ No.  │ Status   │ Time       │ Reason/Comments     │    │
│  ├──────┼──────────┼────────────┼─────────────────────┤    │
│  │ 108  │ Withdrawn│ 14:15      │ Personal emergency  │    │
│  │ 112  │ Vet Out  │ 14:30      │ Failed vet check    │    │
│  │ 125  │ DNF      │ 15:00      │ Injury at CP2       │    │
│  └──────┴──────────┴────────────┴─────────────────────┘    │
│  [Print] [Export]                                           │
└─────────────────────────────────────────────────────────────┘
```

### Tab 5: Housekeeping (NEW)
```
┌─────────────────────────────────────────────────────────────┐
│  Strapper Calls (Pending Resource Requests):                │
│  ┌──────┬──────────┬────────────┬─────────────────────┐    │
│  │ CP   │ Priority │ Time       │ Description         │    │
│  ├──────┼──────────┼────────────┼─────────────────────┤    │
│  │ 2    │ 🔴 High  │ 14:25      │ Medical assistance  │    │
│  │ 3    │ 🟡 Med   │ 14:30      │ Water resupply      │    │
│  │ 1    │ 🟢 Low   │ 14:35      │ Equipment check     │    │
│  └──────┴──────────┴────────────┴─────────────────────┘    │
│  [Add Call] [Clear Completed]                               │
├─────────────────────────────────────────────────────────────┤
│  Backup & Restore:                                          │
│  Last Backup: 2024-01-15 14:00                              │
│  [Backup Now] [Restore from Backup] [View History]          │
├─────────────────────────────────────────────────────────────┤
│  Data Management:                                            │
│  [Clear Old Data] [Export All] [Settings]                   │
└─────────────────────────────────────────────────────────────┘
```

### Tab 6: Overview (Existing)
```
┌─────────────────────────────────────────────────────────────┐
│  Race Statistics:                                            │
│  ┌────────────┬────────────┬────────────┬────────────┐     │
│  │ Not Started│ In Progress│ Finished   │ DNF/Out    │     │
│  │     45     │     12     │     38     │     5      │     │
│  └────────────┴────────────┴────────────┴────────────┘     │
├─────────────────────────────────────────────────────────────┤
│  Runner Status Grid:                                         │
│  (Same as Tab 1 but with status management)                 │
│  [Mark as Non-Starter] [Mark as DNF] [Withdraw] [Vet Out]  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Dialog Designs

### Withdrawal Dialog
```
┌─────────────────────────────────────────────┐
│  Withdraw Runner                      [×]   │
├─────────────────────────────────────────────┤
│  Runner Number: [___]                       │
│  Checkpoint:    [Checkpoint 1 ▼]            │
│  Time:          [14:30] [Now]               │
│  Reason:        [Personal Emergency ▼]      │
│  Comments:      [___________________]       │
│                 [___________________]       │
│                                             │
│  ℹ️ To reverse: Enter number + *            │
│                                             │
│  [Cancel]              [Withdraw Runner]    │
└─────────────────────────────────────────────┘
```

### Vet Out Dialog
```
┌─────────────────────────────────────────────┐
│  Vet Out Runner                       [×]   │
├─────────────────────────────────────────────┤
│  Runner Number: [___]                       │
│  Checkpoint:    [Checkpoint 2 ▼]            │
│  Time:          [14:45] [Now]               │
│  Reason:        [Failed Vet Check ▼]        │
│  Medical Notes: [___________________]       │
│                 [___________________]       │
│                 [___________________]       │
│                                             │
│  [Cancel]              [Vet Out Runner]     │
└─────────────────────────────────────────────┘
```

### Duplicate Entries Dialog
```
┌─────────────────────────────────────────────┐
│  Duplicate Entries Found              [×]   │
├─────────────────────────────────────────────┤
│  Runner 105 has multiple entries:           │
│                                             │
│  Entry 1: CP1 at 14:28:15 (Passed)         │
│  Entry 2: CP1 at 14:28:20 (Passed)         │
│                                             │
│  ⚠️ This may indicate:                      │
│  • Data entry error                         │
│  • Legitimate multiple passes               │
│  • Different bib colors (105G, 105R)        │
│                                             │
│  Resolution:                                │
│  ○ Keep both entries                        │
│  ○ Keep Entry 1, delete Entry 2             │
│  ○ Keep Entry 2, delete Entry 1             │
│  ○ Merge entries (use latest time)          │
│                                             │
│  [Cancel]              [Resolve]            │
└─────────────────────────────────────────────┘
```

### Deleted Entries View
```
┌─────────────────────────────────────────────────────────────┐
│  Deleted Entries (Audit Trail)                        [×]   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────┬────┬────────────┬──────────┬─────────────────┐   │
│  │ No.  │ CP │ Time       │ Deleted  │ Reason          │   │
│  ├──────┼────┼────────────┼──────────┼─────────────────┤   │
│  │ 108  │ 1  │ 14:15:30   │ 14:20    │ Duplicate entry │   │
│  │ 112  │ 2  │ 14:30:15   │ 14:35    │ Wrong number    │   │
│  │ 115  │ 1  │ 14:45:00   │ 14:50    │ Data error      │   │
│  └──────┴────┴────────────┴──────────┴─────────────────┘   │
│                                                             │
│  [Restore Selected] [Export Audit Log] [Close]             │
└─────────────────────────────────────────────────────────────┘
```

### Help Dialog (Hotkeys Reference)
```
┌─────────────────────────────────────────────────────────────┐
│  Keyboard Shortcuts                                   [×]   │
├─────────────────────────────────────────────────────────────┤
│  Navigation:                                                │
│  Alt+1-6        Switch between tabs                         │
│  Tab            Move to next field                          │
│  Shift+Tab      Move to previous field                      │
│                                                             │
│  Data Entry:                                                │
│  Alt+B          Focus runner input                          │
│  Alt+D          Focus runner input (alternate)              │
│  Alt+N          Next field / Commit                         │
│  Alt+X          Commit changes                              │
│                                                             │
│  Operations:                                                │
│  Alt+V          Vet Out runner                              │
│  Alt+W          Withdraw runner                             │
│  Alt+E          Delete entry                                │
│  Alt+L          View deleted entries                        │
│                                                             │
│  Lists & Reports:                                           │
│  Alt+S          Show Out List                               │
│  Alt+R          Open Reports                                │
│                                                             │
│  Sorting:                                                   │
│  Alt+M          Sort by default order                       │
│  Alt+I          Sort by number                              │
│  Alt+P          Sort by CP/Time                             │
│                                                             │
│  Housekeeping:                                              │
│  Alt+K          Backup data                                 │
│  Alt+H          Show this help                              │
│  Alt+O          About                                       │
│  Alt+Q          Exit Base Station                           │
│                                                             │
│  General:                                                   │
│  Esc            Cancel current action                       │
│  Enter          Confirm action                              │
│                                                             │
│  [Print Reference] [Close]                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Data Flow Architecture

### State Management Flow
```
User Action
    ↓
HotkeysProvider / UI Component
    ↓
baseOperationsStore (Zustand)
    ↓
BaseOperationsRepository
    ↓
IndexedDB (Dexie)
    ↓
State Update
    ↓
UI Re-render
```

### Audit Trail Flow
```
User Action (Delete/Update)
    ↓
Store Action
    ↓
Repository Method
    ↓
Save to deleted_entries table
    ↓
Save to audit_log table
    ↓
Update main table
    ↓
Return success
```

---

## 6. Database Schema Extensions

### New Tables

```javascript
// deleted_entries
{
  id: number (auto-increment),
  raceId: number,
  entryType: string, // 'runner', 'checkpoint', 'base_station'
  originalEntry: object, // Full entry data
  deletedAt: string (ISO timestamp),
  deletedBy: string,
  deletionReason: string,
  restorable: boolean
}

// strapper_calls
{
  id: number (auto-increment),
  raceId: number,
  checkpoint: number,
  priority: string, // 'low', 'medium', 'high', 'urgent'
  description: string,
  status: string, // 'pending', 'in-progress', 'completed', 'cancelled'
  createdAt: string (ISO timestamp),
  createdBy: string,
  completedAt: string (ISO timestamp),
  completedBy: string,
  notes: string
}

// audit_log
{
  id: number (auto-increment),
  raceId: number,
  action: string, // 'create', 'update', 'delete', 'restore'
  entityType: string, // 'runner', 'checkpoint', 'base_station', 'strapper_call'
  entityId: number,
  changes: object, // { field: { old: value, new: value } }
  performedBy: string,
  performedAt: string (ISO timestamp),
  ipAddress: string (optional),
  userAgent: string (optional)
}

// withdrawal_records
{
  id: number (auto-increment),
  raceId: number,
  runnerNumber: number,
  checkpoint: number,
  withdrawalTime: string (ISO timestamp),
  reason: string,
  comments: string,
  reversedAt: string (ISO timestamp, nullable),
  reversedBy: string (nullable)
}

// vet_out_records
{
  id: number (auto-increment),
  raceId: number,
  runnerNumber: number,
  checkpoint: number,
  vetOutTime: string (ISO timestamp),
  reason: string,
  medicalNotes: string,
  vetName: string (optional)
}
```

---

## 7. Implementation Checklist

### Phase 1: Infrastructure ✅
- [x] Analyze current codebase
- [x] Create detailed plan
- [x] Document architecture
- [ ] Get stakeholder approval

### Phase 2: Database & Store (Days 1-2)
- [ ] Update database schema
- [ ] Add new tables to Dexie
- [ ] Enhance baseOperationsStore
- [ ] Add new actions and state
- [ ] Enhance BaseOperationsRepository
- [ ] Add new repository methods
- [ ] Write unit tests for store
- [ ] Write unit tests for repository

### Phase 3: Core Components (Days 3-5)
- [ ] Create HotkeysProvider.jsx
- [ ] Create WithdrawalDialog.jsx
- [ ] Create VetOutDialog.jsx
- [ ] Create MissingNumbersList.jsx
- [ ] Create OutList.jsx
- [ ] Create StrapperCallsPanel.jsx
- [ ] Create LogOperationsPanel.jsx
- [ ] Create DeletedEntriesView.jsx
- [ ] Create DuplicateEntriesDialog.jsx
- [ ] Create ReportsPanel.jsx
- [ ] Create BackupRestoreDialog.jsx
- [ ] Create HelpDialog.jsx
- [ ] Create AboutDialog.jsx

### Phase 4: Integration (Days 6-7)
- [ ] Restructure BaseStationView.jsx
- [ ] Add new tabs
- [ ] Wire up all dialogs
- [ ] Enhance DataEntry.jsx
- [ ] Add withdrawal/vet-out buttons
- [ ] Add duplicate detection
- [ ] Integrate hotkeys
- [ ] Add keyboard navigation
- [ ] Add focus management

### Phase 5: Testing (Days 8-9)
- [ ] Unit tests for all components
- [ ] Integration tests for workflows
- [ ] Test hotkeys thoroughly
- [ ] Test data integrity
- [ ] Test audit trail
- [ ] Test backup/restore
- [ ] Accessibility testing
- [ ] Performance testing
- [ ] Mobile responsiveness testing

### Phase 6: Polish & Documentation (Day 10)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success notifications
- [ ] Optimize performance
- [ ] Update README.md
- [ ] Create HOTKEYS.md
- [ ] Create BASE_STATION_GUIDE.md
- [ ] Add inline help text
- [ ] Create user guide

---

## 8. UX Improvements Over Legacy

### Modern Enhancements

1. **Visual Feedback**
   - Toast notifications for all actions
   - Loading spinners for async operations
   - Success/error animations
   - Progress bars for batch operations

2. **Smart Interactions**
   - Auto-complete for runner numbers
   - Intelligent suggestions based on history
   - Keyboard shortcuts with visual hints
   - Undo/Redo support

3. **Responsive Design**
   - Mobile-optimized layouts
   - Touch-friendly buttons (44px minimum)
   - Swipe gestures for mobile
   - Adaptive grid/list views

4. **Data Visualization**
   - Status charts and graphs
   - Timeline views for entries
   - Heat maps for busy periods
   - Color-coded status indicators

5. **Accessibility**
   - WCAG 2.1 AA compliance
   - Screen reader support
   - High contrast mode
   - Keyboard-only navigation
   - Focus indicators

6. **Performance**
   - Virtual scrolling for large lists
   - Debounced search
   - Lazy loading
   - Optimistic UI updates
   - Background sync

---

## 9. Migration Strategy

### For Existing Users

1. **Data Migration**
   - Automatic schema upgrade
   - Preserve all existing data
   - Create backup before migration
   - Rollback capability

2. **Feature Introduction**
   - Progressive disclosure
   - Onboarding tour
   - Contextual help
   - Video tutorials

3. **Training Materials**
   - Quick start guide
   - Keyboard shortcuts reference
   - Video walkthroughs
   - FAQ document

---

## 10. Success Metrics

### Functional Metrics
- ✅ All legacy features implemented
- ✅ Zero data loss during operations
- ✅ Audit trail complete and accurate
- ✅ All hotkeys functional
- ✅ Reports generating correctly

### Performance Metrics
- ⚡ Page load < 2 seconds
- ⚡ Action response < 100ms
- ⚡ Search results < 200ms
- ⚡ Report generation < 5 seconds

### UX Metrics
- 😊 User satisfaction > 4.5/5
- 📱 Mobile usability score > 90%
- ♿ Accessibility score > 95%
- 🎯 Task completion rate > 95%

---

## 11. Risk Mitigation

### Potential Risks

1. **Data Loss**
   - Mitigation: Comprehensive backup system
   - Mitigation: Audit trail for all changes
   - Mitigation: Undo/Redo functionality

2. **Performance Issues**
   - Mitigation: Virtual scrolling
   - Mitigation: Debounced operations
   - Mitigation: Indexed database queries

3. **User Adoption**
   - Mitigation: Familiar UI patterns
   - Mitigation: Comprehensive training
   - Mitigation: Gradual feature rollout

4. **Browser Compatibility**
   - Mitigation: Progressive enhancement
   - Mitigation: Polyfills for older browsers
   - Mitigation: Graceful degradation

---

## 12. Future Enhancements

### Post-Launch Features

1. **Advanced Analytics**
   - Runner performance trends
   - Checkpoint efficiency metrics
   - Predictive arrival times

2. **Collaboration Features**
   - Multi-user support
   - Real-time sync
   - Chat/messaging

3. **Mobile App**
   - Native iOS/Android apps
   - Offline-first architecture
   - Push notifications

4. **Integration**
   - GPS tracking integration
   - RFID chip reading
   - Radio packet integration

---

## Conclusion

This refactoring plan comprehensively addresses all legacy features while introducing modern UX improvements. The phased approach ensures minimal disruption and allows for iterative feedback and refinement.

**Next Step**: Obtain stakeholder approval and begin Phase 2 implementation.
