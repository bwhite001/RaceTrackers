# RaceTracker Pro - Base Station Operations User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Stories & Workflows](#user-stories--workflows)
4. [Keyboard Shortcuts Reference](#keyboard-shortcuts-reference)
5. [Troubleshooting](#troubleshooting)

---

## Introduction

Welcome to the RaceTracker Pro Base Station Operations module. This guide covers all user stories and workflows for managing race operations from the base station, including runner tracking, status management, reporting, and data integrity operations.

### What is Base Station Operations?

The Base Station is the central hub for monitoring and managing race progress. Operators use this module to:
- Track runner progress through checkpoints
- Manage runner status (withdrawn, vet-out, DNF, etc.)
- Generate reports and lists
- Maintain data integrity
- Coordinate with checkpoint operators
- Manage strapper (support) calls

---

## Getting Started

### Prerequisites
1. A race must be created and configured
2. Runner numbers must be assigned
3. Checkpoints must be defined

### Accessing Base Station Operations

**Screenshot Reference**: `screenshots/01-initial-application-launch.png`

1. Launch RaceTracker Pro
2. From the homepage, click **"Base Station Operations"**
3. The system will load the current active race
4. You'll see the Base Station interface with 6 tabs

---

## User Stories & Workflows

### User Story 1: Recording Runner Times at Checkpoints

**As a checkpoint operator, I want to record each entrant's number and time as they pass so that their progress is accurately tracked through the event.**

#### Workflow Steps:

1. **Navigate to Data Entry Tab**
   - Click the "Data Entry" tab or press **Alt+2**
   - Screenshot: `screenshots/06-base-station-data-entry.png`

2. **Enter Runner Data**
   ```
   Method 1: Individual Entry
   - Enter runner number in the "Runner Number" field
   - Enter checkpoint number (or use default)
   - Time is auto-populated (current time)
   - Click "Add Entry" or press Enter
   
   Method 2: Bulk Entry
   - Enter range (e.g., "100-105")
   - Select common checkpoint
   - Assign common time
   - Click "Bulk Add"
   ```

3. **Validation**
   - System validates runner number exists
   - Checks for duplicates
   - Confirms checkpoint is valid
   - Shows success/error message

4. **View Results**
   - Entry appears in Runner Grid
   - Status updates automatically
   - Timestamp recorded
   - Marked as "sent" to base

#### Expected Outcomes:
- ✅ Runner time recorded accurately
- ✅ Duplicate detection if number already logged
- ✅ Invalid numbers flagged for review
- ✅ Audit trail created

#### Keyboard Shortcuts:
- **Alt+2**: Open Data Entry tab
- **Enter**: Submit entry
- **Esc**: Cancel/Clear form

---

### User Story 2: Withdrawing Runners

**As an operator, I need to mark entrants as withdrawn or vetted out, and reverse these states if needed, to maintain correct event status.**

#### Workflow Steps:

1. **Open Withdrawal Dialog**
   - Press **Alt+W** or
   - Go to Data Entry tab → Click "Withdraw Runner" button

2. **Enter Withdrawal Details**
   ```
   Required Fields:
   - Runner Number: Enter the runner's bib number
   - Checkpoint: Where withdrawal occurred
   - Time: When withdrawal occurred (auto-populated)
   
   Optional Fields:
   - Reason: Why runner withdrew
   - Comments: Additional notes
   ```

3. **Confirm Withdrawal**
   - Click "Withdraw Runner"
   - System marks runner as withdrawn
   - Entry added to Out List
   - Audit trail created

4. **Reversing a Withdrawal** (if done in error)
   ```
   Method 1: Using * Symbol
   - Enter runner number followed by *
   - Example: "58*"
   - System reverses withdrawal
   
   Method 2: From Out List
   - Go to Lists & Reports tab
   - Find runner in Out List
   - Click "Restore" button
   ```

#### Expected Outcomes:
- ✅ Runner marked as withdrawn
- ✅ Appears in Out List
- ✅ Removed from active runners
- ✅ Can be reversed if needed
- ✅ Audit trail maintained

#### Keyboard Shortcuts:
- **Alt+W**: Open Withdrawal Dialog
- **Enter**: Confirm withdrawal
- **Esc**: Cancel

---

### User Story 3: Viewing Missing Runners

**As event control, I want to view and print lists of missing entrants at given checkpoints to investigate delays or safety risks.**

#### Workflow Steps:

1. **Navigate to Lists & Reports**
   - Click "Lists & Reports" tab or press **Alt+4**

2. **View Missing Numbers**
   - The Missing Numbers List shows automatically
   - Select checkpoint from dropdown
   - System calculates missing runners in real-time

3. **Analyze Missing Runners**
   ```
   Information Displayed:
   - Runner Number
   - Runner Name (if available)
   - Last Known Checkpoint
   - Last Known Time
   - Time Since Last Seen
   - Expected Status
   ```

4. **Take Action**
   ```
   Options:
   - Print List: Click "Print" button
   - Export List: Click "Export" → Choose format (CSV/Excel/PDF)
   - Refresh: Auto-refreshes every 30 seconds
   - Filter: By checkpoint, time range, or status
   ```

#### Expected Outcomes:
- ✅ Real-time missing runners list
- ✅ Checkpoint-specific filtering
- ✅ Printable format
- ✅ Export capability
- ✅ Total count displayed

#### Keyboard Shortcuts:
- **Alt+4**: Open Lists & Reports
- **Ctrl+P**: Print list
- **Alt+R**: Generate report

---

### User Story 4: Managing Strapper Calls

**As a logistics coordinator, I want to track pending support or resource calls at checkpoints.**

#### Workflow Steps:

1. **Navigate to Housekeeping Tab**
   - Click "Housekeeping" tab or press **Alt+5**

2. **View Strapper Calls Panel**
   - See all pending calls
   - Calls organized by priority and checkpoint

3. **Add New Strapper Call**
   ```
   Steps:
   - Click "Add Call" button
   - Enter checkpoint number
   - Enter runner number (if applicable)
   - Select resource type:
     * Medical assistance
     * Water/food
     * Equipment
     * Transport
     * Other
   - Set priority (Low/Medium/High/Urgent)
   - Add notes
   - Click "Submit Call"
   ```

4. **Manage Existing Calls**
   ```
   Actions:
   - Mark as Complete: Click checkmark icon
   - Update Status: Click edit icon
   - Add Notes: Click notes icon
   - Clear Call: Click X icon
   - View History: Click history icon
   ```

5. **Clear Completed Calls**
   - Click "Clear Completed" button
   - Confirms before clearing
   - Moves to history (not deleted)

#### Expected Outcomes:
- ✅ Pending calls tracked
- ✅ Priority-based organization
- ✅ Status updates in real-time
- ✅ History maintained
- ✅ Resource allocation visible

#### Keyboard Shortcuts:
- **Alt+5**: Open Housekeeping tab
- **Alt+C**: Add new call
- **Alt+X**: Clear completed

---

### User Story 5: Viewing Out List (Withdrawn/Vet-Out)

**As event admin, I want instant reporting of all entrants now out of the event, with comments and reason codes.**

#### Workflow Steps:

1. **Navigate to Lists & Reports**
   - Press **Alt+4** or click "Lists & Reports" tab

2. **Access Out List**
   - Click "Out List" sub-tab
   - System displays all withdrawn/vetted out runners

3. **Review Out List**
   ```
   Information Displayed:
   - Runner Number
   - Runner Name
   - Status (Withdrawn/Vet Out/DNF/DNS)
   - Checkpoint
   - Time
   - Reason
   - Comments
   - Operator Who Marked
   ```

4. **Filter and Sort**
   ```
   Filter Options:
   - By Status: Withdrawn, Vet Out, DNF, DNS
   - By Checkpoint
   - By Time Range
   - By Reason
   
   Sort Options:
   - By Number
   - By Time
   - By Checkpoint
   - By Status
   ```

5. **Export/Print**
   - Click "Print" for printable format
   - Click "Export" for CSV/Excel
   - Includes all filters applied

#### Expected Outcomes:
- ✅ Complete out list visible
- ✅ Timestamps and comments included
- ✅ Filterable and sortable
- ✅ Printable/exportable
- ✅ Total counts by status

#### Keyboard Shortcuts:
- **Alt+4**: Lists & Reports tab
- **Alt+S**: Out List sub-tab
- **Ctrl+P**: Print
- **Alt+E**: Export

---

### User Story 6: Managing Log Entries (CRUD Operations)

**As a data manager, I need to update, delete, view deleted, and sort log entries.**

#### Workflow Steps:

1. **Navigate to Log Operations**
   - Press **Alt+3** or click "Log Operations" tab

2. **View All Log Entries**
   ```
   Columns Displayed:
   - Entry ID
   - Runner Number
   - Checkpoint
   - Time
   - Status (Sent/Not Sent)
   - Duplicate Flag
   - Created By
   - Created At
   ```

3. **Update an Entry**
   ```
   Steps:
   - Click edit icon on entry row
   - Modify fields:
     * Runner number
     * Checkpoint
     * Time
     * Status
   - Click "Save Changes"
   - System validates and updates
   - Audit trail created
   ```

4. **Delete an Entry** (Soft Delete)
   ```
   Steps:
   - Click delete icon on entry row
   - Confirm deletion
   - Entry moved to deleted_entries table
   - Still visible in "View Deleted"
   - Can be restored later
   ```

5. **View Deleted Entries**
   - Press **Alt+L** or click "View Deleted" button
   - See all deleted entries with:
     * Original data
     * Deletion timestamp
     * Deleted by (operator)
     * Reason for deletion
   - Option to restore any entry

6. **View Duplicate Entries**
   - Click "View Duplicates" button
   - System shows all duplicate detections
   - Side-by-side comparison
   - Resolution options:
     * Keep first entry
     * Keep second entry
     * Keep both (if legitimate)
     * Merge entries

7. **Sort Log Entries**
   ```
   Sort Options:
   - Default Order: Entry creation time
   - CP/Time: By checkpoint, then time
   - Number: By runner number
   - Status: By sent/not sent status
   ```

#### Expected Outcomes:
- ✅ Full CRUD operations available
- ✅ Soft delete (no data loss)
- ✅ Audit trail for all changes
- ✅ Duplicate detection automatic
- ✅ Multiple sort options
- ✅ Restore capability

#### Keyboard Shortcuts:
- **Alt+3**: Log Operations tab
- **Alt+U**: Update entry
- **Alt+E**: Delete entry
- **Alt+L**: View deleted
- **Alt+D**: View duplicates
- **Alt+M**: Sort by CP/Time
- **Alt+S**: Sort by Number

---

### User Story 7: Backup and Restore Data

**As an operator, I want the ability to back up and restore data seamlessly during the event.**

#### Workflow Steps:

1. **Open Backup Dialog**
   - Press **Alt+K** or
   - Go to Housekeeping tab → Click "Backup Now"

2. **Create Backup**
   ```
   Steps:
   - Dialog shows current race information
   - Click "Create Backup"
   - System generates backup file:
     * Format: JSON
     * Filename: race-backup-YYYY-MM-DD-HHmmss.json
     * Includes: All race data, runners, entries, audit trail
   - Browser downloads file automatically
   ```

3. **Restore from Backup**
   ```
   Steps:
   - Click "Restore from Backup" button
   - Select backup file from computer
   - System validates backup:
     * Checks format
     * Verifies data integrity
     * Shows preview of data
   - Confirm restoration
   - System restores data
   - Creates audit entry
   ```

4. **Backup Best Practices**
   ```
   Recommendations:
   - Backup before major operations
   - Backup every hour during event
   - Keep backups on external drive
   - Test restore process before event
   - Name backups descriptively
   ```

#### Expected Outcomes:
- ✅ One-click backup creation
- ✅ Date-stamped filenames
- ✅ Complete data preservation
- ✅ Validation before restore
- ✅ Audit trail maintained

#### Keyboard Shortcuts:
- **Alt+K**: Open Backup Dialog
- **Alt+B**: Create backup
- **Alt+R**: Restore from backup

---

### User Story 8: Generating and Printing Reports

**As operations, I want to generate, preview, and print reports filtered by event type or other selection formulae.**

#### Workflow Steps:

1. **Navigate to Reports Panel**
   - Go to Lists & Reports tab (Alt+4)
   - Scroll to Reports section

2. **Select Report Type**
   ```
   Available Reports:
   1. Missing Numbers Report
      - Shows runners not yet at checkpoint
      - Filterable by checkpoint
      - Includes last known location
   
   2. Out List Report
      - All withdrawn/vetted out runners
      - Includes reasons and comments
      - Filterable by status type
   
   3. Checkpoint Log Report
      - All entries for specific checkpoint
      - Time-ordered
      - Includes all runner details
   
   4. Custom Report
      - Build your own filters
      - Select fields to include
      - Custom sort order
   ```

3. **Apply Filters**
   ```
   Filter Options:
   - Checkpoint: Select specific checkpoint(s)
   - Time Range: From/To timestamps
   - Status: Active, Withdrawn, Vet Out, etc.
   - Runner Range: Specific number ranges
   - Event Type: If multiple events
   ```

4. **Generate Report**
   - Click "Generate Report" button
   - System processes data
   - Preview appears on screen

5. **Export/Print**
   ```
   Export Formats:
   - CSV: For Excel/spreadsheet analysis
   - Excel: Native .xlsx format
   - HTML: For web viewing/printing
   - PDF: For distribution
   - JSON: For data exchange
   
   Print Options:
   - Print Preview
   - Page Setup
   - Print to PDF
   - Print to Printer
   ```

#### Expected Outcomes:
- ✅ Dynamic report generation
- ✅ Multiple export formats
- ✅ Filterable and sortable
- ✅ Print-friendly formatting
- ✅ Real-time data

#### Keyboard Shortcuts:
- **Alt+4**: Lists & Reports tab
- **Alt+R**: Generate report
- **Ctrl+P**: Print
- **Alt+E**: Export

---

### User Story 9: Handling Duplicate Entries

**As a data manager, I need to detect and resolve duplicate entries to maintain data integrity.**

#### Workflow Steps:

1. **Automatic Detection**
   - System automatically detects duplicates when:
     * Same runner number
     * Same checkpoint
     * Within 5-minute window (configurable)

2. **View Duplicates**
   - Press **Alt+D** or
   - Go to Log Operations → Click "View Duplicates"

3. **Review Duplicate Entries**
   ```
   Information Shown:
   - Entry 1 Details:
     * Runner number
     * Checkpoint
     * Time
     * Operator
     * Created at
   
   - Entry 2 Details:
     * Same fields for comparison
   
   - Difference Highlights:
     * Time difference
     * Operator difference
     * Any field variations
   ```

4. **Resolve Duplicates**
   ```
   Resolution Options:
   
   Option 1: Keep First Entry
   - Deletes second entry
   - Marks as resolved
   - Audit trail created
   
   Option 2: Keep Second Entry
   - Deletes first entry
   - Marks as resolved
   - Audit trail created
   
   Option 3: Keep Both
   - If legitimate (e.g., two runners same number)
   - Add distinguishing notes
   - Mark as reviewed
   
   Option 4: Merge Entries
   - Combines data from both
   - Keeps most accurate time
   - Preserves all comments
   ```

5. **Verify Resolution**
   - Duplicate removed from list
   - Audit entry created
   - Can view in audit log

#### Expected Outcomes:
- ✅ Automatic duplicate detection
- ✅ Side-by-side comparison
- ✅ Multiple resolution options
- ✅ Audit trail maintained
- ✅ No data loss

#### Keyboard Shortcuts:
- **Alt+D**: View duplicates
- **1**: Keep first entry
- **2**: Keep second entry
- **B**: Keep both
- **M**: Merge entries

---

### User Story 10: Viewing Deleted Entries (Audit Trail)

**As a data manager, I need to view all deleted entries for audit purposes and potentially restore them.**

#### Workflow Steps:

1. **Open Deleted Entries View**
   - Press **Alt+L** or
   - Go to Log Operations → Click "View Deleted"

2. **Review Deleted Entries**
   ```
   Information Displayed:
   - Original Entry Data:
     * Runner number
     * Checkpoint
     * Time
     * All original fields
   
   - Deletion Metadata:
     * Deleted at (timestamp)
     * Deleted by (operator)
     * Reason for deletion
     * Related entries (if any)
   ```

3. **Search and Filter**
   ```
   Filter Options:
   - By Runner Number
   - By Checkpoint
   - By Deletion Date
   - By Operator
   - By Reason
   ```

4. **Restore an Entry**
   ```
   Steps:
   - Find entry to restore
   - Click "Restore" button
   - Confirm restoration
   - System:
     * Moves entry back to active
     * Creates audit entry
     * Updates all related data
     * Notifies operator
   ```

5. **Export Audit Trail**
   - Click "Export Audit Trail"
   - Choose format (CSV/Excel/PDF)
   - Includes all deletion history
   - For compliance/reporting

#### Expected Outcomes:
- ✅ Complete deletion history
- ✅ No data permanently lost
- ✅ Restoration capability
- ✅ Audit compliance
- ✅ Searchable and filterable

#### Keyboard Shortcuts:
- **Alt+L**: View deleted entries
- **Alt+R**: Restore selected
- **Alt+E**: Export audit trail

---

### User Story 11: Vet-Out Operations

**As an operator, I need to mark runners as vetted out when they fail veterinary checks, with reversal capability.**

#### Workflow Steps:

1. **Open Vet-Out Dialog**
   - Press **Alt+V** or
   - Go to Data Entry → Click "Vet Out Runner"

2. **Enter Vet-Out Details**
   ```
   Required Fields:
   - Runner Number
   - Checkpoint (where vet check occurred)
   - Time (auto-populated)
   
   Optional Fields:
   - Vet Check Type:
     * Pre-race
     * Mid-race
     * Post-checkpoint
   - Failure Reason:
     * Lameness
     * Metabolic
     * Injury
     * Other
   - Veterinarian Name
   - Comments/Notes
   ```

3. **Confirm Vet-Out**
   - Click "Vet Out Runner"
   - System:
     * Marks runner as vetted out
     * Adds to Out List
     * Removes from active runners
     * Creates audit entry
     * Notifies relevant parties

4. **Reversing Vet-Out** (if runner passes re-check)
   ```
   Method 1: Using * Symbol
   - Enter runner number followed by *
   - System reverses vet-out
   
   Method 2: From Out List
   - Find runner in Out List
   - Click "Restore" button
   - Add re-check notes
   - Confirm restoration
   ```

#### Expected Outcomes:
- ✅ Runner marked as vet-out
- ✅ Appears in Out List with reason
- ✅ Removed from active tracking
- ✅ Reversal capability
- ✅ Vet check history maintained

#### Keyboard Shortcuts:
- **Alt+V**: Open Vet-Out Dialog
- **Enter**: Confirm vet-out
- **Esc**: Cancel

---

### User Story 12: Sorting and Organizing Data

**As an operator, I need to sort log entries by different criteria to find information quickly.**

#### Workflow Steps:

1. **Navigate to Log Operations**
   - Press **Alt+3**

2. **Choose Sort Method**
   ```
   Sort Options:
   
   1. Default Order (Alt+M)
      - Sorted by entry creation time
      - Most recent first
      - Original entry sequence
   
   2. CP/Time Sort (Alt+M)
      - Grouped by checkpoint
      - Then sorted by time within checkpoint
      - Useful for checkpoint analysis
   
   3. Number Sort (Alt+S)
      - Sorted by runner number
      - Numerical order (not string)
      - Handles leading zeros correctly
   
   4. Status Sort
      - Grouped by status
      - Then by time
      - Useful for identifying issues
   ```

3. **Apply Sort**
   - Click sort button or use hotkey
   - Grid re-orders immediately
   - Sort preference saved

4. **Combined Sorting**
   - Primary sort: Choose main criterion
   - Secondary sort: Choose tie-breaker
   - Example: Sort by checkpoint, then by time

#### Expected Outcomes:
- ✅ Multiple sort options
- ✅ Instant re-ordering
- ✅ Correct numerical sorting
- ✅ Preference persistence
- ✅ Visual sort indicator

#### Keyboard Shortcuts:
- **Alt+M**: Sort by CP/Time
- **Alt+S**: Sort by Number
- **Alt+K**: Sort by Status
- **Alt+I**: Default order

---

### User Story 13: Using Keyboard Shortcuts

**As a power user, I want to use keyboard shortcuts for all common operations to work efficiently.**

#### Workflow Steps:

1. **View Keyboard Shortcuts**
   - Press **Alt+H** to open Help Dialog
   - Navigate to "Keyboard Shortcuts" section
   - See all available shortcuts organized by category

2. **Global Shortcuts** (Work Anywhere)
   ```
   - Alt+H: Open Help
   - Alt+O: Open About
   - Alt+Q: Exit Base Station
   - Esc: Close dialog/Cancel operation
   ```

3. **Tab Navigation Shortcuts**
   ```
   - Alt+1: Runner Grid
   - Alt+2: Data Entry
   - Alt+3: Log Operations
   - Alt+4: Lists & Reports
   - Alt+5: Housekeeping
   - Alt+6: Overview
   ```

4. **Operation Shortcuts**
   ```
   - Alt+W: Withdraw Runner
   - Alt+V: Vet Out Runner
   - Alt+K: Backup Data
   - Alt+L: View Deleted
   - Alt+D: View Duplicates
   - Alt+R: Generate Report
   - Alt+E: Export Data
   ```

5. **Sort Shortcuts**
   ```
   - Alt+M: Sort by CP/Time
   - Alt+S: Sort by Number
   - Alt+I: Default order
   - Alt+K: Sort by Status
   ```

6. **Form Shortcuts**
   ```
   - Enter: Submit/Confirm
   - Esc: Cancel/Close
   - Tab: Next field
   - Shift+Tab: Previous field
   ```

#### Tips for Efficiency:
- Learn 5-10 most common shortcuts first
- Use Help (Alt+H) as reference
- Shortcuts work even in input fields (when appropriate)
- Visual feedback shows when shortcut activates

#### Expected Outcomes:
- ✅ Faster operations
- ✅ Reduced mouse usage
- ✅ Improved efficiency
- ✅ Better accessibility
- ✅ Consistent across app

---

### User Story 14: Accessing Help and Documentation

**As a new user, I want comprehensive help and documentation to learn the system quickly.**

#### Workflow Steps:

1. **Open Help Dialog**
   - Press **Alt+H** anywhere in the application
   - Help dialog opens with sidebar navigation

2. **Navigate Help Sections**
   ```
   Sections Available:
   
   1. Quick Start
      - Getting started guide
      - First-time setup
      - Basic workflows
      - Common tasks
   
   2. Data Entry
      - How to record times
      - Bulk entry
      - Validation rules
      - Error handling
   
   3. Runner Status
      - Status types explained
      - Withdrawal process
      - Vet-out process
      - Status changes
   
   4. Reports
      - Report types
      - Filtering options
      - Export formats
      - Printing tips
   
   5. Backup & Restore
      - Backup process
      - Restore process
      - Best practices
      - Troubleshooting
   
   6. Keyboard Shortcuts
      - Complete shortcut list
      - Organized by category
      - With descriptions
   
   7. Troubleshooting
      - Common issues
      - Solutions
      - Error messages
      - Contact information
   ```

3. **Search Help Content**
   - Use search box at top of help dialog
   - Type keywords
   - Results highlight matching sections
   - Click to jump to section

4. **Context-Sensitive Help**
   - Some screens have "?" icon
   - Click for help specific to that screen
   - Opens help dialog to relevant section

#### Expected Outcomes:
- ✅ Comprehensive documentation
- ✅ Easy navigation
- ✅ Searchable content
- ✅ Context-sensitive
- ✅ Always accessible

#### Keyboard Shortcuts:
- **Alt+H**: Open Help
- **Esc**: Close Help
- **/**: Focus search box

---

## Keyboard Shortcuts Reference

### Complete Shortcut List

#### Global Shortcuts
| Shortcut | Action | Context |
|----------|--------|---------|
| Alt+H | Open Help Dialog | Anywhere |
| Alt+O | Open About Dialog | Anywhere |
| Alt+Q | Exit Base Station | Anywhere |
| Esc | Close Dialog/Cancel | Dialogs/Forms |

#### Tab Navigation
| Shortcut | Action | Context |
|----------|--------|---------|
| Alt+1 | Runner Grid Tab | Base Station |
| Alt+2 | Data Entry Tab | Base Station |
| Alt+3 | Log Operations Tab | Base Station |
| Alt+4 | Lists & Reports Tab | Base Station |
| Alt+5 | Housekeeping Tab | Base Station |
| Alt+6 | Overview Tab | Base Station |

#### Runner Operations
| Shortcut | Action | Context |
|----------|--------|---------|
| Alt+W | Withdraw Runner | Data Entry |
| Alt+V | Vet Out Runner | Data Entry |
| Alt+B | Add Runner | Data Entry |
| Alt+D | View Duplicates | Log Operations |

#### Log Operations
| Shortcut | Action | Context |
|----------|--------|---------|
| Alt+U | Update Entry | Log Operations |
| Alt+E | Delete Entry | Log Operations |
| Alt+L | View Deleted | Log Operations |
| Alt+M | Sort by CP/Time | Log Operations |
| Alt+S | Sort by Number | Log Operations |
| Alt+I | Default Sort | Log Operations |

#### Reports & Lists
| Shortcut | Action | Context |
|----------|--------|---------|
| Alt+R | Generate Report | Lists & Reports |
| Alt+P | Print Report | Lists & Reports |
| Alt+E | Export Data | Lists & Reports |
| Ctrl+P | Print (Browser) | Any Report |

#### Housekeeping
| Shortcut | Action | Context |
|----------|--------|---------|
| Alt+K | Backup Data | Housekeeping |
| Alt+X | Export All | Housekeeping |
| Alt+C | Add Strapper Call | Housekeeping |

#### Form Navigation
| Shortcut | Action | Context |
|----------|--------|---------|
| Enter | Submit/Confirm | Forms |
| Esc | Cancel/Close | Forms |
| Tab | Next Field | Forms |
| Shift+Tab | Previous Field | Forms |

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "No active race found"
**Problem**: Trying to access Base Station without a configured race

**Solution**:
1. Exit Base Station
2. Go to Race Maintenance
3. Create or select a race
4. Return to Base Station Operations

#### Issue 2: "Runner number not found"
**Problem**: Entering a runner number that doesn't exist

**Solution**:
1. Verify runner number is correct
2. Check if runner was added to race
3. Go to Race Maintenance → Runner Setup
4. Add missing runner numbers
5. Return to Base Station

#### Issue 3: Duplicate entry detected
**Problem**: System flags duplicate when entering runner time

**Solution**:
1. Review both entries carefully
2. Determine if legitimate duplicate (two runners, same number)
3. If error: Keep correct entry, delete wrong one
4. If legitimate: Keep both, add distinguishing notes
5. Use View Duplicates (Alt+D) to resolve

#### Issue 4: Cannot restore deleted entry
**Problem**: Restore button not working

**Solution**:
1. Check if entry is truly deleted (in deleted_entries view)
2. Verify you have permission to restore
3. Check for conflicts (e.g., runner already has entry at that checkpoint)
4. Try refreshing the view
5. Check browser console for errors

#### Issue 5: Backup file won't restore
**Problem**: Backup restoration fails

**Solution**:
1. Verify backup file is valid JSON
2. Check file wasn't corrupted
3. Ensure backup is from compatible version
4. Try opening file in text editor to verify format
5. Contact support if issue persists

#### Issue 6: Hotkeys not working
**Problem**: Keyboard shortcuts don't respond

**Solution**:
1. Check if you're in an input field (some shortcuts disabled)
2. Verify correct key combination (Alt+Key, not Ctrl+Key)
3. Check if another dialog is open
4. Try clicking outside input field first
5. Refresh page if issue persists

#### Issue 7: Missing runners list is empty
**Problem**: No missing runners showing when expected

**Solution**:
1. Verify checkpoint selection is correct
2. Check if all runners have checked in
3. Verify runner data was loaded correctly
4. Try refreshing the list
5. Check filters aren't hiding results

---

## Best Practices

### Data Entry
1. **Double-check runner numbers** before submitting
2. **Use bulk entry** for groups arriving together
3. **Verify time** is correct (especially if manual entry)
4. **Add comments** for unusual situations
5. **Review duplicates** immediately when flagged

### Status Management
1. **Confirm withdrawals** before marking
2. **Add detailed reasons** for vet-outs
3. **Use reversal carefully** (creates audit entries)
4. **Document all status changes** with comments
5. **Verify runner identity** before status change

### Reporting
1. **Backup before generating large reports**
2. **Use filters** to reduce data volume
3. **Test print preview** before printing
4. **Export to CSV** for further analysis
5. **Save reports** with descriptive names

### Data Integrity
1. **Backup hourly** during active events
2. **Review audit trail** regularly
3. **Resolve duplicates** promptly
4. **Don't permanently delete** (use soft delete)
5. **Document all corrections** with comments

### Efficiency
1. **Learn keyboard shortcuts** for common tasks
2. **Use quick range input** for bulk operations
3. **Set up filters** for repeated queries
4. **Keep Help dialog** (Alt+H) handy
5. **Customize views** for your workflow

---

## Quick Reference Card

### Most Common Operations

```
┌─────────────────────────────────────────────────────
