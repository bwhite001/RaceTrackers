# End-to-End Testing Plan - Race Tracker Pro

## Overview
This document outlines comprehensive end-to-end testing for all user workflows in the Race Tracker Pro application. The testing covers three main modules: Race Maintenance, Checkpoint Operations, and Base Station Operations.

## Test Environment Setup

### Prerequisites
- Node.js 16+ installed
- All dependencies installed (`npm install`)
- Development server running (`npm run dev`)
- Browser: Chrome/Firefox/Edge (latest versions)
- Test data prepared (see Test Data section)

### Test Data Requirements
1. **Race Configuration**
   - Race Name: "Mountain Trail 100K"
   - Date: Current date + 7 days
   - Start Time: 06:00 AM
   - Runner Ranges: 100-150, 200-225, 300-310
   - Total Runners: 86

2. **Checkpoint Configuration**
   - Checkpoint 1: Mile 10
   - Checkpoint 2: Mile 25
   - Checkpoint 3: Mile 40
   - Base Station: Finish Line

## User Workflows

### Workflow 1: Race Setup and Configuration
**User Story**: As a race organizer, I need to create a new race with runner ranges and checkpoints.

#### Test Steps:
1. **Navigate to Application**
   - Open browser to `http://localhost:5173`
   - Verify homepage loads with three module cards
   - Verify no active race message displayed

2. **Access Race Maintenance**
   - Click "Race Maintenance" card
   - Verify navigation to `/race-maintenance/setup`
   - Verify "Race Setup" header displayed
   - Verify progress indicator shows Step 1 active

3. **Enter Race Details (Step 1)**
   - Enter race name: "Mountain Trail 100K"
   - Select date: [Current Date + 7 days]
   - Enter start time: "06:00"
   - Click "Add Checkpoint" button
   - Enter checkpoint name: "Mile 10"
   - Click "Add Checkpoint" again
   - Enter checkpoint name: "Mile 25"
   - Click "Add Checkpoint" again
   - Enter checkpoint name: "Mile 40"
   - Verify 3 checkpoints listed
   - Click "Next" button

4. **Configure Runner Ranges (Step 2)**
   - Verify progress indicator shows Step 2 active
   - Enter range: "100-150"
   - Click "Add Range"
   - Verify range added to list (51 runners)
   - Enter range: "200-225"
   - Click "Add Range"
   - Verify range added (26 runners)
   - Enter range: "300-310"
   - Click "Add Range"
   - Verify range added (11 runners)
   - Verify total: 88 runners displayed
   - Click "Create Race" button

5. **Verify Race Creation**
   - Verify navigation to race overview
   - Verify race details displayed
   - Verify runner count: 88
   - Verify checkpoints listed
   - Verify "Start Operations" options available

**Expected Results**:
- Race created successfully
- All runner numbers generated (100-150, 200-225, 300-310)
- Checkpoints configured
- Navigation to overview successful
- No errors in console

**Test Data Created**:
- Race ID: [Generated]
- 88 runner records in database
- 3 checkpoint records

---

### Workflow 2: Checkpoint Operations - Runner Tracking
**User Story**: As a checkpoint volunteer, I need to mark runners as they pass through my checkpoint.

#### Test Steps:
1. **Navigate to Checkpoint**
   - From homepage, click "Checkpoint Operations"
   - Verify checkpoint selection (default: Checkpoint 1)
   - Verify navigation to `/checkpoint/1`
   - Verify "Checkpoint 1" header displayed

2. **View Runner Grid**
   - Verify runner grid displays all runners
   - Verify runners grouped (default: 25 per page)
   - Verify pagination controls visible
   - Verify search box available
   - Verify grid/list view toggle

3. **Mark Runners Passing Through**
   - Click runner #100
   - Verify runner marked with timestamp
   - Verify visual feedback (color change)
   - Click runner #101
   - Click runner #102
   - Verify all three marked
   - Wait 2 seconds
   - Click runner #105
   - Verify different timestamp

4. **Search Functionality**
   - Enter "110" in search box
   - Verify only runner #110 displayed
   - Click runner #110 to mark
   - Clear search
   - Verify all runners visible again

5. **View Toggle**
   - Click "List View" toggle
   - Verify runners displayed in list format
   - Verify marked runners show timestamp
   - Click "Grid View" toggle
   - Verify back to grid layout

6. **Group Marking**
   - Navigate to page 2 (runners 126-150)
   - Mark runners #130, #131, #132 in quick succession
   - Verify all marked with similar timestamps
   - Navigate back to page 1
   - Verify previously marked runners still marked

**Expected Results**:
- All runner interactions recorded
- Timestamps accurate to the second
- Visual feedback immediate
- Search works correctly
- View modes function properly
- Data persists across navigation

**Test Data Created**:
- 7 checkpoint_runners records with markOffTime
- Timestamps for runners: 100, 101, 102, 105, 110, 130, 131, 132

---

### Workflow 3: Checkpoint Operations - Callout Sheet
**User Story**: As a checkpoint volunteer, I need to organize runners into 5-minute time segments for radio callouts.

#### Test Steps:
1. **Access Callout Sheet**
   - From Checkpoint 1 view, click "View Callout Sheet"
   - Verify modal opens
   - Verify title: "Callout Sheet - Checkpoint 1"

2. **View Time Segments**
   - Verify runners grouped by 5-minute intervals
   - Verify earliest segment at top
   - Verify each segment shows:
     - Time range (e.g., "06:15 - 06:20")
     - Runner numbers in segment
     - "Called In" checkbox
     - Runner count

3. **Mark Segment as Called**
   - Find segment with runners 100, 101, 102
   - Click "Called In" checkbox
   - Verify visual feedback (strikethrough or color change)
   - Verify timestamp recorded

4. **Add More Runners**
   - Close callout sheet
   - Mark runners #140, #141, #142 (current time)
   - Reopen callout sheet
   - Verify new segment created with these runners
   - Verify segment at bottom (most recent)

5. **Export Callout Sheet**
   - Click "Export" or "Print" button
   - Verify print dialog opens
   - Verify formatted for printing
   - Cancel print dialog

**Expected Results**:
- Runners correctly grouped by 5-minute intervals
- Called-in status persists
- New runners added to appropriate segments
- Export/print functionality works
- Chronological ordering maintained

**Test Data Created**:
- callInTime recorded for marked segments
- Additional checkpoint_runners records

---

### Workflow 4: Base Station Operations - Data Entry
**User Story**: As a base station operator, I need to record finish times for groups of runners.

#### Test Steps:
1. **Navigate to Base Station**
   - From homepage, click "Base Station Operations"
   - Verify navigation to `/base-station/operations`
   - Verify "Base Station Operations" header
   - Verify tab navigation visible

2. **Access Data Entry Tab**
   - Click "Data Entry" tab (or Alt+2)
   - Verify data entry form displayed
   - Verify fields:
     - Runner numbers input
     - Common time input
     - Notes field
     - Submit button

3. **Single Runner Entry**
   - Enter runner number: "100"
   - Enter time: "08:30:45"
   - Enter notes: "Strong finish"
   - Click "Submit"
   - Verify success message
   - Verify runner #100 updated

4. **Bulk Entry - Comma Separated**
   - Enter runner numbers: "101, 102, 105"
   - Enter time: "08:32:15"
   - Click "Submit"
   - Verify success message
   - Verify 3 runners updated

5. **Bulk Entry - Range Format**
   - Enter runner numbers: "110-115"
   - Enter time: "08:35:00"
   - Click "Submit"
   - Verify success message
   - Verify 6 runners updated (110, 111, 112, 113, 114, 115)

6. **Mixed Format Entry**
   - Enter runner numbers: "120, 122-125, 130"
   - Enter time: "08:40:30"
   - Click "Submit"
   - Verify success message
   - Verify 7 runners updated

7. **Validation Testing**
   - Enter invalid runner: "999"
   - Click "Submit"
   - Verify error message: "Runner 999 not found"
   - Enter invalid time: "25:00:00"
   - Verify error message: "Invalid time format"

**Expected Results**:
- All entry formats work correctly
- Times recorded accurately
- Validation prevents invalid data
- Success/error messages clear
- Data persists in database

**Test Data Created**:
- base_station_runners records with commonTime
- 17 runners with finish times recorded

---

### Workflow 5: Base Station Operations - Runner Status Management
**User Story**: As a base station operator, I need to manage runner statuses (withdrawals, vet outs, DNFs).

#### Test Steps:
1. **Withdraw a Runner**
   - Click "Data Entry" tab
   - Click "Withdraw Runner" button (or Alt+W)
   - Verify withdrawal dialog opens
   - Enter runner number: "200"
   - Select reason: "Personal reasons"
   - Enter comments: "Family emergency"
   - Select checkpoint: "Mile 25"
   - Verify time auto-populated
   - Click "Submit"
   - Verify success message
   - Verify runner #200 status updated to "Withdrawn"

2. **Reverse a Withdrawal**
   - Click "Withdraw Runner" again
   - Enter runner number: "200*" (with asterisk)
   - Verify reversal mode indicated
   - Click "Submit"
   - Verify runner #200 status restored
   - Verify withdrawal record marked as reversed

3. **Vet Out a Runner**
   - Click "Vet Out Runner" button (or Alt+V)
   - Verify vet out dialog opens
   - Enter runner number: "201"
   - Select reason: "Dehydration"
   - Enter vet name: "Dr. Smith"
   - Enter notes: "Advised to rest"
   - Select checkpoint: "Mile 40"
   - Click "Submit"
   - Verify success message
   - Verify runner #201 status updated to "Vet Out"

4. **Mark as DNF**
   - Navigate to "Overview" tab
   - Find runner #202
   - Click status dropdown
   - Select "DNF"
   - Verify confirmation dialog
   - Click "Confirm"
   - Verify runner #202 status updated

5. **Mark as Non-Starter**
   - Find runner #203
   - Click status dropdown
   - Select "Non-Starter"
   - Verify confirmation dialog
   - Click "Confirm"
   - Verify runner #203 status updated

**Expected Results**:
- All status changes recorded
- Withdrawal reversals work correctly
- Vet out records complete
- Status changes reflected immediately
- Audit trail maintained

**Test Data Created**:
- withdrawal_records for runner 200 (with reversal)
- vet_out_records for runner 201
- Status updates for runners 202, 203

---

### Workflow 6: Base Station Operations - Lists and Reports
**User Story**: As a base station operator, I need to view missing runners, out lists, and generate reports.

#### Test Steps:
1. **View Missing Numbers**
   - Click "Lists & Reports" tab (or Alt+4)
   - Verify "Missing Numbers" section displayed
   - Verify list shows runners not yet recorded
   - Verify grouped by checkpoint
   - Verify count displayed
   - Click "Export" button
   - Verify CSV download initiated

2. **View Out List**
   - Scroll to "Out List" section
   - Verify list shows:
     - Withdrawn runners
     - Vet out runners
     - DNF runners
     - Non-starters
   - Verify each entry shows:
     - Runner number
     - Status
     - Checkpoint
     - Time
     - Reason/notes
   - Click "Print" button
   - Verify print preview

3. **Generate Reports**
   - Scroll to "Reports" section
   - Select report type: "Checkpoint Summary"
   - Select checkpoint: "All"
   - Click "Generate"
   - Verify report displays:
     - Total runners per checkpoint
     - Marked runners count
     - Missing runners count
     - Percentage complete
   - Select report type: "Status Summary"
   - Click "Generate"
   - Verify report shows:
     - Finished: count
     - In Progress: count
     - Withdrawn: count
     - Vet Out: count
     - DNF: count
     - Non-Starter: count

4. **Filter and Search**
   - In Missing Numbers, select checkpoint filter: "Mile 10"
   - Verify only Mile 10 missing runners shown
   - Enter search term: "21"
   - Verify filtered to runners containing "21"
   - Clear filters
   - Verify all missing runners shown

**Expected Results**:
- Lists accurate and up-to-date
- Export functionality works
- Reports generate correctly
- Filters work as expected
- Data reflects all previous operations

---

### Workflow 7: Base Station Operations - Log Operations
**User Story**: As a base station operator, I need to view operation logs and manage deleted entries.

#### Test Steps:
1. **View Operation Log**
   - Click "Log Operations" tab (or Alt+3)
   - Verify log table displayed
   - Verify columns:
     - Timestamp
     - Action
     - Runner Number
     - Details
     - User
   - Verify entries sorted by most recent first

2. **Filter Log Entries**
   - Select action filter: "Withdrawal"
   - Verify only withdrawal actions shown
   - Select date range: Today
   - Verify only today's entries shown
   - Clear filters
   - Verify all entries shown

3. **View Deleted Entries**
   - Click "View Deleted Entries" button (or Alt+L)
   - Verify deleted entries dialog opens
   - Verify list shows:
     - Deleted timestamp
     - Entry type
     - Runner number
     - Original data
     - Restorable status

4. **Restore Deleted Entry**
   - Find a restorable entry
   - Click "Restore" button
   - Verify confirmation dialog
   - Click "Confirm"
   - Verify entry restored
   - Verify success message
   - Close dialog
   - Verify restored data in main view

5. **View Duplicate Entries**
   - Click "View Duplicates" button
   - Verify duplicates dialog opens
   - If duplicates exist:
     - Verify duplicate groups shown
     - Select resolution strategy
     - Click "Resolve"
     - Verify duplicates resolved

**Expected Results**:
- Complete audit trail visible
- Filters work correctly
- Deleted entries can be restored
- Duplicate detection works
- All operations logged

**Test Data Created**:
- audit_log entries for all operations
- deleted_entries records (if any deletions occurred)

---

### Workflow 8: Base Station Operations - Housekeeping
**User Story**: As a base station operator, I need to manage strapper calls, backups, and system information.

#### Test Steps:
1. **Manage Strapper Calls**
   - Click "Housekeeping" tab (or Alt+5)
   - Verify "Strapper Calls" section displayed
   - Click "Add Strapper Call"
   - Enter details:
     - Checkpoint: "Mile 25"
     - Priority: "High"
     - Notes: "Need medical supplies"
   - Click "Submit"
   - Verify call added to list
   - Verify status: "Pending"
   - Click "Mark Complete" on the call
   - Verify status updated to "Complete"

2. **Create Backup**
   - Scroll to "Backup & Restore" section
   - Click "Backup Now" button (or Alt+K)
   - Verify backup dialog opens
   - Enter backup name: "Pre-race-day-backup"
   - Enter notes: "Backup before race day"
   - Click "Create Backup"
   - Verify success message
   - Verify backup listed with:
     - Name
     - Timestamp
     - Size
     - Notes

3. **Restore from Backup**
   - Click "Restore from Backup" button
   - Verify backup list displayed
   - Select a backup
   - Click "Preview"
   - Verify backup contents shown
   - Click "Restore"
   - Verify confirmation dialog with warning
   - Click "Cancel" (don't actually restore in test)

4. **View System Information**
   - Scroll to "System Information" section
   - Click "About" button (or Alt+O)
   - Verify about dialog opens
   - Verify information displayed:
     - Application name
     - Version number
     - Database version
     - Storage usage
     - Last backup date
   - Click "Close"

**Expected Results**:
- Strapper calls managed correctly
- Backups created successfully
- Restore preview works
- System information accurate
- All operations logged

**Test Data Created**:
- strapper_calls records
- Backup file in storage
- System metadata updated

---

### Workflow 9: Hotkeys and Keyboard Navigation
**User Story**: As a power user, I need to use keyboard shortcuts for efficient operation.

#### Test Steps:
1. **View Hotkey Help**
   - Press Alt+H
   - Verify help dialog opens
   - Verify hotkey categories:
     - Navigation
     - Data Entry
     - Operations
     - Dialogs
   - Verify each hotkey listed with description
   - Press Escape
   - Verify dialog closes

2. **Navigation Hotkeys**
   - Press Alt+1
   - Verify "Runner Grid" tab activated
   - Press Alt+2
   - Verify "Data Entry" tab activated
   - Press Alt+3
   - Verify "Log Operations" tab activated
   - Press Alt+4
   - Verify "Lists & Reports" tab activated
   - Press Alt+5
   - Verify "Housekeeping" tab activated
   - Press Alt+6
   - Verify "Overview" tab activated

3. **Operation Hotkeys**
   - Press Alt+W
   - Verify withdrawal dialog opens
   - Press Escape
   - Verify dialog closes
   - Press Alt+V
   - Verify vet out dialog opens
   - Press Escape
   - Press Alt+K
   - Verify backup dialog opens
   - Press Escape

4. **Exit Hotkey**
   - Press Alt+Q
   - Verify exit confirmation dialog
   - Click "Cancel"
   - Verify still in base station view

**Expected Results**:
- All hotkeys work as documented
- Help overlay comprehensive
- Keyboard navigation smooth
- No conflicts with browser shortcuts
- Escape key closes dialogs

---

### Workflow 10: Dark Mode and Settings
**User Story**: As a user, I need to customize the application appearance and behavior.

#### Test Steps:
1. **Access Settings**
   - Click settings icon in header
   - Verify settings modal opens
   - Verify tabs:
     - Appearance
     - Display
     - Data

2. **Toggle Dark Mode**
   - Click "Dark Mode" toggle
   - Verify immediate theme change
   - Verify all components styled correctly
   - Verify contrast sufficient
   - Toggle back to light mode
   - Verify theme reverts

3. **Adjust Font Size**
   - Select font size: "Large"
   - Verify text size increases
   - Verify layout adjusts
   - Select font size: "Medium"
   - Verify text size normal

4. **Customize Status Colors**
   - Click "Status Colors" section
   - Change "Finished" color to green
   - Verify color picker works
   - Apply change
   - Verify runner status colors updated
   - Reset to defaults

5. **Configure Display Options**
   - Set group size: 50
   - Verify runner grid shows 50 per page
   - Set default view: "List"
   - Navigate to new page
   - Verify list view default
   - Reset to grid view

6. **Data Management**
   - Click "Data" tab
   - View storage usage
   - Click "Clear Cache"
   - Verify confirmation dialog
   - Click "Cancel"
   - Click "Export All Data"
   - Verify download initiated

**Expected Results**:
- Settings persist across sessions
- Dark mode fully functional
- Font sizes appropriate
- Color customization works
- Display preferences applied
- Data management safe

---

### Workflow 11: Multi-Module Integration
**User Story**: As a race coordinator, I need to switch between modules while maintaining data consistency.

#### Test Steps:
1. **Start in Race Maintenance**
   - Navigate to homepage
   - Click "Race Maintenance"
   - Verify current race loaded
   - Note runner count and details

2. **Switch to Checkpoint**
   - Click "Exit Setup" or navigate to home
   - Click "Checkpoint Operations"
   - Verify same race data loaded
   - Verify runner count matches
   - Mark some runners

3. **Switch to Base Station**
   - Navigate to home
   - Click "Base Station Operations"
   - Verify same race data loaded
   - Verify checkpoint marks visible
   - Enter finish times

4. **Return to Checkpoint**
   - Navigate to home
   - Click "Checkpoint Operations"
   - Verify finish times NOT visible (isolation)
   - Verify checkpoint marks still present

5. **View in Race Overview**
   - Navigate to Race Maintenance
   - Click "View Overview"
   - Verify all data visible:
     - Checkpoint marks
     - Finish times
     - Status changes
   - Verify data consistency

6. **Test Operation Lock**
   - Start data entry in Base Station
   - Try to navigate to Checkpoint
   - Verify warning dialog
   - Verify navigation blocked
   - Complete operation
   - Verify navigation allowed

**Expected Results**:
- Data consistent across modules
- Module isolation maintained
- Operation locks prevent data loss
- All changes persisted
- No data corruption

---

### Workflow 12: Offline Operation and Data Sync
**User Story**: As a field operator, I need the application to work offline and sync when online.

#### Test Steps:
1. **Verify Offline Capability**
   - Open application online
   - Open browser DevTools
   - Go to Network tab
   - Set to "Offline"
   - Refresh page
   - Verify application loads from cache
   - Verify all features functional

2. **Perform Operations Offline**
   - Mark runners in checkpoint
   - Enter finish times in base station
   - Create withdrawal record
   - Verify all operations work
   - Verify data saved locally

3. **Simulate Connection Loss**
   - During data entry, set offline
   - Complete entry
   - Verify success message
   - Verify data in IndexedDB

4. **Return Online**
   - Set network back to "Online"
   - Verify no data loss
   - Verify all offline operations persisted
   - Verify application continues working

5. **Test PWA Installation**
   - Look for install prompt
   - Click "Install"
   - Verify app installs
   - Launch installed app
   - Verify works offline
   - Verify data synced

**Expected Results**:
- Full offline functionality
- No data loss during offline operation
- Smooth online/offline transitions
- PWA installation works
- Data persistence reliable

---

### Workflow 13: Error Handling and Recovery
**User Story**: As a user, I need clear error messages and recovery options when things go wrong.

#### Test Steps:
1. **Invalid Data Entry**
   - Enter invalid runner number: "ABC"
   - Verify error message clear
   - Verify form not submitted
   - Verify field highlighted
   - Enter valid data
   - Verify error clears

2. **Database Error Simulation**
   - Open DevTools Console
   - Simulate IndexedDB error (if possible)
   - Attempt operation
   - Verify error boundary catches error
   - Verify user-friendly message
   - Verify recovery option offered

3. **Network Error Handling**
   - Set network to slow 3G
   - Perform operations
   - Verify loading indicators
   - Verify timeout handling
   - Verify retry options

4. **Concurrent Edit Conflict**
   - Open app in two tabs
   - Edit same runner in both
   - Submit in first tab
   - Submit in second tab
   - Verify conflict detection
   - Verify resolution options

5. **Storage Quota Exceeded**
   - (If possible) Fill storage
   - Attempt to save data
   - Verify quota error caught
   - Verify cleanup options offered
   - Verify graceful degradation

**Expected Results**:
- All errors caught and handled
- Error messages user-friendly
- Recovery options provided
- No application crashes
- Data integrity maintained

---

### Workflow 14: Accessibility Testing
**User Story**: As a user with accessibility needs, I need the application to be fully accessible.

#### Test Steps:
1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus visible
   - Verify tab order logical
   - Verify all actions keyboard-accessible
   - Test with Enter and Space keys

2. **Screen Reader Testing**
   - Enable screen reader (NVDA/JAWS/VoiceOver)
   - Navigate through application
   - Verify all elements announced
   - Verify ARIA labels present
   - Verify form labels associated
   - Verify error messages announced

3. **Color Contrast**
   - Use contrast checker tool
   - Verify all text meets WCAG AA
   - Test in dark mode
   - Verify status colors distinguishable
   - Test with color blindness simulator

4. **Zoom and Scaling**
   - Zoom to 200%
   - Verify layout doesn't break
   - Verify all content accessible
   - Verify no horizontal scrolling
   - Test at 400% zoom

5. **Focus Management**
   - Open modal dialog
   - Verify focus trapped in modal
   - Verify focus returns on close
   - Test with multiple modals
   - Verify skip links work

**Expected Results**:
- Full keyboard accessibility
- Screen reader compatible
- WCAG 2.1 AA compliant
- Zoom up to 400% supported
- Focus management correct

---

## Test Data Summary

### Race Configuration
```javascript
{
  name: "Mountain Trail 100K",
  date: "2024-12-20",
  startTime: "06:00",
  checkpoints: [
    { id: 1, name: "Mile 10" },
    { id: 2, name: "Mile 25" },
    { id: 3, name: "Mile 40" }
  ],
  runnerRanges: [
    { start: 100, end: 150 },  // 51 runners
    { start: 200, end: 225 },  // 26 runners
    { start: 300, end: 310 }   // 11 runners
  ],
  totalRunners: 88
}
```

### Sample Runner Data
```javascript
// Checkpoint 1 - Marked Runners
[
  { number: 100, markOffTime: "06:15:23" },
  { number: 101, markOffTime: "06:15:25" },
  { number: 102, markOffTime: "06:15:27" },
  { number: 105, markOffTime: "06:15:45" },
  { number: 110, markOffTime: "06:16:30" },
  { number: 130, markOffTime: "06:20:10" },
  { number: 131, markOffTime: "06:20:12" },
  { number: 132, markOffTime: "06:20:14" }
]

// Base Station - Finish Times
[
  { number: 100, commonTime: "08:30:45", notes: "Strong finish" },
  { number: 101, commonTime: "08:32:15" },
  { number: 102, commonTime: "08:32:15" },
  { number: 105, commonTime: "08:32:15" },
  { numbers: [110, 111, 112, 113, 114, 115], commonTime: "08:35:00" },
  { numbers: [120, 122, 123, 124, 125, 130], commonTime: "08:40:30" }
]

// Status Changes
[
  { number: 200, status: "Withdrawn", reason: "Personal reasons", checkpoint: "Mile 25" },
  { number: 201, status: "Vet Out", reason: "Dehydration", checkpoint: "Mile 40" },
  { number: 202, status: "DNF" },
  { number: 203, status: "Non-Starter" }
]
```

## Test Execution Checklist

### Pre-Test Setup
- [ ] Install all dependencies
- [ ] Start development server
- [ ] Clear browser cache and storage
- [ ] Open browser DevTools
- [ ] Prepare test data spreadsheet
- [ ] Set up screen recording (optional)

### During Testing
- [ ] Follow workflows in order
- [ ] Document all issues found
- [ ] Take screenshots of errors
- [ ] Note console errors/warnings
- [ ] Record actual vs expected results
- [ ] Test in multiple browsers

### Post-Test Activities
- [ ] Compile test results
- [ ] Create bug reports
- [ ] Update documentation
- [ ] Share findings with team
- [ ] Plan regression testing

## Success Criteria

### Functional Requirements
- [ ] All workflows complete without errors
- [ ] Data persists correctly
- [ ] Module isolation maintained
- [ ] Operation locks work
- [ ] Offline functionality works

### Performance Requirements
- [ ] Page load < 2 seconds
- [ ] Operation response < 500ms
- [ ] No memory leaks
- [ ] Smooth animations (60fps)
- [ ] Database queries < 100ms

### Usability Requirements
- [ ] Intuitive navigation
- [ ] Clear error messages
- [ ] Consistent UI/UX
- [ ] Responsive design works
- [ ] Hotkeys documented

### Accessibility Requirements
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard accessible
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus management correct

## Bug Severity Levels

### Critical (P0)
- Data loss or corruption
- Application crashes
- Security vulnerabilities
- Complete feature failure

### High (P1)
- Major feature not working
- Incorrect data display
- Performance issues
- Accessibility blockers

### Medium (P2)
- Minor feature issues
- UI inconsistencies
- Usability problems
- Non-critical errors

### Low (P3)
- Cosmetic issues
- Minor UI glitches
- Enhancement requests
- Documentation errors

## Test Report Template

```markdown
# Test Execution Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Browser/OS]
**Build**: [Version]

## Summary
- Total Workflows: 14
- Workflows Passed: X
- Workflows Failed: Y
- Workflows Blocked: Z

## Detailed Results

### Workflow 1: Race Setup and Configuration
- **Status**: Pass/Fail/Blocked
- **Execution Time**: X minutes
- **Issues Found**: [List]
- **Notes**: [Comments]

[Repeat for each workflow]

## Issues Summary

### Critical Issues
1. [Issue description]
   - Steps to reproduce
   - Expected vs Actual
   - Screenshot

### High Priority Issues
[List]

### Medium Priority Issues
[List]

### Low Priority Issues
[List]

## Recommendations
[List of recommendations]

## Next Steps
[Action items]
```

## Automated Test Coverage

While this document focuses on manual E2E testing, the following areas have automated test coverage:

- Unit tests for all components (src/test/)
- Integration tests for module workflows (src/test/integration/)
- Component tests for base operations (src/test/base-operations/)

Run automated tests with:
```bash
npm run test          # Run all tests
npm run test:ui       # Run with UI
npm run test:coverage # Generate coverage report
```

## Continuous Testing

### Regression Testing
- Run full E2E suite before each release
- Test critical paths after each bug fix
- Verify no new issues introduced

### Smoke Testing
- Quick verification of core functionality
- Run after each deployment
- Focus on critical user paths

### Exploratory Testing
- Unscripted testing to find edge cases
- Try unusual user behaviors
- Test boundary conditions

## Conclusion

This
