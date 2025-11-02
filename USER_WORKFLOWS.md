# Race Tracker Pro - User Workflows Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [User Roles](#user-roles)
3. [Complete Workflow Overview](#complete-workflow-overview)
4. [Detailed Workflows](#detailed-workflows)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

---

## Introduction

Race Tracker Pro is an offline-capable race tracking application designed for managing runners during endurance races. This document provides comprehensive documentation of all user workflows, from initial race setup through completion.

### Application Architecture

The application consists of three main modules:

1. **Race Maintenance Module** - Race setup and configuration
2. **Checkpoint Operations Module** - Runner tracking at checkpoints
3. **Base Station Operations Module** - Finish line and race control operations

### Key Features

- **Offline-First Design** - Works without internet connection
- **Module Isolation** - Prevents data conflicts between operations
- **Real-Time Updates** - Immediate feedback on all actions
- **Comprehensive Audit Trail** - Complete history of all operations
- **Flexible Data Entry** - Multiple input formats supported
- **Keyboard Shortcuts** - Efficient operation for power users

---

## User Roles

### Race Director
**Responsibilities:**
- Create and configure races
- Set up runner ranges and checkpoints
- Monitor overall race progress
- Generate reports
- Manage race completion

**Primary Module:** Race Maintenance

### Checkpoint Volunteer
**Responsibilities:**
- Mark runners as they pass through checkpoint
- Organize runners into time segments
- Call in runner groups to race control
- Monitor checkpoint progress

**Primary Module:** Checkpoint Operations

### Base Station Operator
**Responsibilities:**
- Record finish times
- Manage runner statuses (withdrawals, DNFs, etc.)
- Track missing runners
- Generate reports
- Coordinate with checkpoints
- Manage race data

**Primary Module:** Base Station Operations

---

## Complete Workflow Overview

### Race Day Timeline

```
Pre-Race (Days/Weeks Before)
├── 1. Create Race Configuration
├── 2. Set Up Runner Ranges
├── 3. Configure Checkpoints
└── 4. Share Configuration with Team

Race Day Setup (Hours Before)
├── 5. Verify Race Configuration
├── 6. Initialize Checkpoint Stations
├── 7. Initialize Base Station
└── 8. Test Communication

During Race
├── 9. Checkpoint: Mark Runners
├── 10. Checkpoint: Call In Segments
├── 11. Base Station: Record Finish Times
├── 12. Base Station: Manage Status Changes
└── 13. Monitor Progress

Post-Race
├── 14. Verify All Data
├── 15. Generate Final Reports
├── 16. Export Results
└── 17. Archive Race Data
```

---

## Detailed Workflows

### Workflow 1: Race Setup (Race Director)

**Objective:** Create a new race with runner ranges and checkpoints

**Prerequisites:**
- Application installed and running
- Race details prepared (name, date, start time)
- Runner number ranges determined
- Checkpoint locations identified

**Steps:**

#### 1.1 Access Race Maintenance
1. Open Race Tracker Pro application
2. On the homepage, click **"Race Maintenance"** card
3. You will be navigated to the Race Setup page

#### 1.2 Enter Race Details (Step 1 of 2)
1. **Race Name:** Enter descriptive name (e.g., "Mountain Trail 100K")
2. **Race Date:** Select date using date picker
3. **Start Time:** Enter race start time (24-hour format: HH:MM)
4. **Add Checkpoints:**
   - Click **"Add Checkpoint"** button
   - Enter checkpoint name (e.g., "Mile 10", "Aid Station 1")
   - Repeat for each checkpoint
   - Use **"Remove"** button to delete checkpoints if needed
5. Click **"Next"** to proceed to runner setup

#### 1.3 Configure Runner Ranges (Step 2 of 2)
1. **Add Runner Range:**
   - Enter start number (e.g., 100)
   - Enter end number (e.g., 150)
   - Click **"Add Range"**
   - System displays: "51 runners (100-150)"
2. **Add Additional Ranges:**
   - Repeat for each range
   - Example: 200-225 (26 runners), 300-310 (11 runners)
3. **Review Summary:**
   - Total runners displayed at bottom
   - All ranges listed with counts
4. **Create Race:**
   - Click **"Create Race"** button
   - System generates all runner records
   - Navigates to Race Overview

#### 1.4 Verify Race Creation
1. Review race details on overview page
2. Verify runner count matches expected
3. Verify all checkpoints listed
4. Note the Race ID for reference

**Expected Outcome:**
- Race created in database
- All runner records generated
- Checkpoints configured
- Ready for operations

**Tips:**
- Use logical runner number ranges (avoid gaps)
- Name checkpoints clearly for easy identification
- Double-check runner counts before creating
- Save Race ID for future reference

---

### Workflow 2: Share Race Configuration (Race Director)

**Objective:** Distribute race configuration to checkpoint volunteers and base station operators

**Prerequisites:**
- Race created and verified
- Team members identified
- Communication method determined (QR code, email, or file)

**Steps:**

#### 2.1 Generate QR Code
1. From Race Overview, click **"Share Configuration"**
2. Select **"Generate QR Code"**
3. QR code displays with race configuration
4. Team members can scan with their devices
5. Configuration automatically imports

#### 2.2 Export Configuration File
1. Click **"Export Configuration"**
2. Select **"Download JSON"**
3. Save file to secure location
4. Share file via email or file sharing service
5. Recipients import using **"Import Configuration"**

#### 2.3 Email Configuration
1. Click **"Share via Email"**
2. Enter recipient email addresses
3. Add message (optional)
4. Click **"Send"**
5. Recipients receive email with import link

**Expected Outcome:**
- All team members have race configuration
- Consistent data across all stations
- Ready to begin operations

---

### Workflow 3: Checkpoint Operations - Runner Tracking (Checkpoint Volunteer)

**Objective:** Mark runners as they pass through checkpoint and organize into time segments

**Prerequisites:**
- Race configuration loaded
- Checkpoint number assigned
- Device positioned for easy runner viewing

**Steps:**

#### 3.1 Access Checkpoint Module
1. From homepage, click **"Checkpoint Operations"**
2. System loads assigned checkpoint (or select from list)
3. Runner grid displays all race participants

#### 3.2 Mark Runners Passing Through

**Grid View (Default):**
1. Runners displayed as numbered buttons
2. Click runner number as they pass
3. Button changes color (marked)
4. Timestamp automatically recorded
5. Continue marking runners

**Search for Specific Runner:**
1. Enter runner number in search box
2. Runner highlighted or filtered
3. Click to mark
4. Clear search to return to full grid

**List View:**
1. Click **"List View"** toggle
2. Runners displayed in list format
3. Click runner row to mark
4. Timestamp shown in list
5. Toggle back to grid view if preferred

#### 3.3 Use Grouping and Pagination
1. **Change Group Size:**
   - Click group size dropdown (10, 25, 50, 100)
   - Select preferred size
   - Grid reorganizes
2. **Navigate Pages:**
   - Use pagination controls at bottom
   - Click page numbers or arrows
   - Marked runners persist across pages

#### 3.4 View Callout Sheet
1. Click **"View Callout Sheet"** button
2. Modal opens showing time segments
3. Runners grouped by 5-minute intervals
4. Each segment shows:
   - Time range (e.g., "06:15 - 06:20")
   - Runner numbers in segment
   - "Called In" checkbox
   - Runner count

#### 3.5 Call In Segments to Race Control
1. When ready to report segment:
   - Check **"Called In"** checkbox
   - Segment marked as reported
   - Visual feedback (strikethrough or color)
2. Continue with next segments
3. Most recent segments appear at bottom

#### 3.6 Monitor Progress
1. View checkpoint statistics:
   - Total runners
   - Marked runners
   - Percentage complete
   - Missing runners
2. Use overview tab for detailed status

**Expected Outcome:**
- All passing runners marked with accurate timestamps
- Runners organized into 5-minute segments
- Segments called in to race control
- Complete checkpoint record

**Tips:**
- Position device for clear view of runners
- Mark runners immediately as they pass
- Use search for quick lookups
- Call in segments regularly (every 15-30 minutes)
- Keep device charged

**Keyboard Shortcuts:**
- `Alt+1` - Runner Grid tab
- `Alt+2` - Callout Sheet
- `Alt+3` - Overview
- `Alt+H` - Help
- `Alt+Q` - Exit Checkpoint

---

### Workflow 4: Base Station Operations - Data Entry (Base Station Operator)

**Objective:** Record finish times for runners as they complete the race

**Prerequisites:**
- Race configuration loaded
- Base station module initialized
- Timing system ready (stopwatch, clock, or automated)

**Steps:**

#### 4.1 Access Base Station Module
1. From homepage, click **"Base Station Operations"**
2. System loads base station interface
3. Navigate to **"Data Entry"** tab (Alt+2)

#### 4.2 Single Runner Entry
1. **Enter Runner Number:** Type number in field (e.g., "100")
2. **Enter Finish Time:** 
   - Format: HH:MM:SS (e.g., "08:30:45")
   - Or use time picker
3. **Add Notes (Optional):** Enter any relevant notes
4. **Submit:** Click **"Submit"** or press Enter
5. **Verify:** Success message confirms entry

#### 4.3 Bulk Entry - Multiple Runners Same Time

**Comma-Separated Format:**
```
Runner Numbers: 101, 102, 105
Finish Time: 08:32:15
```
- Enter multiple numbers separated by commas
- All runners assigned same time
- Click **"Submit"**

**Range Format:**
```
Runner Numbers: 110-115
Finish Time: 08:35:00
```
- Enter range with hyphen
- Includes all numbers in range (110, 111, 112, 113, 114, 115)
- Click **"Submit"**

**Mixed Format:**
```
Runner Numbers: 120, 122-125, 130
Finish Time: 08:40:30
```
- Combine individual numbers and ranges
- System processes all formats
- Click **"Submit"**

#### 4.4 Validation and Error Handling

**Invalid Runner Number:**
- System displays: "Runner 999 not found"
- Verify number and re-enter
- Check race configuration if persistent

**Invalid Time Format:**
- System displays: "Invalid time format"
- Use HH:MM:SS format
- Ensure time is logical (not future time)

**Duplicate Entry:**
- System warns: "Runner already has finish time"
- Options:
  - Overwrite existing time
  - Cancel and verify
  - View existing time

#### 4.5 Quick Actions
1. **Withdraw Runner:** Click button or press Alt+W
2. **Vet Out Runner:** Click button or press Alt+V
3. **View Duplicates:** Check for duplicate entries
4. **View Missing:** See runners not yet finished

**Expected Outcome:**
- All finish times recorded accurately
- Bulk entries processed efficiently
- Errors caught and corrected
- Complete finish record

**Tips:**
- Use bulk entry for groups finishing together
- Double-check runner numbers before submitting
- Add notes for unusual circumstances
- Regularly save/backup data
- Monitor missing runners list

---

### Workflow 5: Base Station Operations - Status Management (Base Station Operator)

**Objective:** Manage runner statuses including withdrawals, vet outs, DNFs, and non-starters

**Prerequisites:**
- Base station module active
- Runner information available
- Authority to make status changes

**Steps:**

#### 5.1 Withdraw a Runner

**When to Use:**
- Runner voluntarily withdraws from race
- Personal reasons, injury, or other circumstances
- Runner stops at checkpoint and doesn't continue

**Process:**
1. Click **"Withdraw Runner"** button (or Alt+W)
2. **Withdrawal Dialog Opens:**
   - **Runner Number:** Enter number (e.g., "200")
   - **Checkpoint:** Select where withdrawal occurred
   - **Reason:** Choose from dropdown:
     - Personal reasons
     - Injury
     - Illness
     - Time cutoff
     - Equipment failure
     - Other
   - **Comments:** Add detailed notes
   - **Time:** Auto-populated (can adjust if needed)
3. Click **"Submit"**
4. **Confirmation:**
   - Success message displayed
   - Runner status updated to "Withdrawn"
   - Withdrawal recorded in audit log

#### 5.2 Reverse a Withdrawal

**When to Use:**
- Withdrawal entered in error
- Runner decides to continue
- Administrative correction needed

**Process:**
1. Click **"Withdraw Runner"** button
2. Enter runner number with asterisk: **"200*"**
3. System recognizes reversal request
4. Dialog shows: "Reversing withdrawal for runner 200"
5. Click **"Confirm"**
6. **Result:**
   - Withdrawal marked as reversed
   - Runner status restored to previous state
   - Reversal logged in audit trail

#### 5.3 Vet Out a Runner

**When to Use:**
- Medical professional determines runner cannot continue
- Safety concerns
- Health issues requiring intervention

**Process:**
1. Click **"Vet Out Runner"** button (or Alt+V)
2. **Vet Out Dialog Opens:**
   - **Runner Number:** Enter number
   - **Checkpoint:** Select location
   - **Medical Reason:** Choose from dropdown:
     - Dehydration
     - Hypothermia
     - Hyperthermia
     - Injury
     - Exhaustion
     - Other medical
   - **Vet Name:** Enter medical professional's name
   - **Notes:** Detailed medical notes
   - **Time:** Auto-populated
3. Click **"Submit"**
4. **Confirmation:**
   - Runner status updated to "Vet Out"
   - Medical record created
   - Cannot be reversed (permanent medical decision)

#### 5.4 Mark as DNF (Did Not Finish)

**When to Use:**
- Runner started but didn't finish
- Stopped without formal withdrawal
- Missing at finish line after cutoff

**Process:**
1. Navigate to **"Overview"** tab (Alt+6)
2. Find runner in grid or list
3. Click runner's status dropdown
4. Select **"DNF"**
5. **Confirmation Dialog:**
   - "Mark runner 202 as DNF?"
   - Optional: Add reason/notes
6. Click **"Confirm"**
7. Status updated immediately

#### 5.5 Mark as Non-Starter

**When to Use:**
- Runner registered but didn't start race
- No-show at start line
- Withdrew before race began

**Process:**
1. Navigate to **"Overview"** tab
2. Find runner in grid or list
3. Click runner's status dropdown
4. Select **"Non-Starter"**
5. **Confirmation Dialog:**
   - "Mark runner 203 as Non-Starter?"
   - Optional: Add reason
6. Click **"Confirm"**
7. Status updated, runner excluded from race statistics

#### 5.6 View Status Summary
1. Navigate to **"Lists & Reports"** tab (Alt+4)
2. Select **"Status Summary"** report
3. View breakdown:
   - **Finished:** Runners with finish times
   - **In Progress:** Currently on course
   - **Withdrawn:** Voluntary withdrawals
   - **Vet Out:** Medical withdrawals
   - **DNF:** Did not finish
   - **Non-Starter:** Never started
4. Export or print as needed

**Expected Outcome:**
- All status changes accurately recorded
- Complete audit trail maintained
- Medical records properly documented
- Race statistics accurate

**Important Notes:**
- **Withdrawals** can be reversed
- **Vet Outs** are permanent (medical decision)
- **DNF** vs **Withdrawn**: DNF is passive, Withdrawn is active decision
- **Non-Starters** excluded from race statistics
- All changes logged with timestamp and user

---

### Workflow 6: Base Station Operations - Lists and Reports (Base Station Operator)

**Objective:** Monitor race progress, identify missing runners, and generate reports

**Prerequisites:**
- Base station module active
- Race in progress or completed
- Data entry current

**Steps:**

#### 6.1 View Missing Numbers List

**Purpose:** Identify runners not yet recorded at finish

**Process:**
1. Navigate to **"Lists & Reports"** tab (Alt+4)
2. **Missing Numbers** section displays automatically
3. **Information Shown:**
   - Runner numbers not yet finished
   - Grouped by checkpoint (if applicable)
   - Total count
   - Last updated timestamp
4. **Filter Options:**
   - By checkpoint
   - By runner range
   - By time on course
5. **Actions:**
   - **Export CSV:** Download list for external use
   - **Print:** Generate printable format
   - **Refresh:** Update with latest data

**Use Cases:**
- Identify runners still on course
- Coordinate search and rescue if needed
- Verify all runners accounted for
- Generate sweep reports

#### 6.2 View Out List

**Purpose:** Track all runners who didn't finish normally

**Process:**
1. Scroll to **"Out List"** section
2. **Categories Displayed:**
   - **Withdrawn:** Voluntary withdrawals
   - **Vet Out:** Medical withdrawals
   - **DNF:** Did not finish
   - **Non-Starter:** Never started
3. **Information for Each Entry:**
   - Runner number
   - Status type
   - Checkpoint location
   - Time of status change
   - Reason/notes
   - Who recorded it
4. **Sorting:**
   - By runner number
   - By time
   - By checkpoint
   - By status type
5. **Actions:**
   - **Export:** Download complete out list
   - **Print:** Generate report
   - **Filter:** Show specific status types

**Use Cases:**
- Medical team reference
- Race director briefing
- Post-race analysis
- Insurance/liability documentation

#### 6.3 Generate Checkpoint Summary Report

**Purpose:** Analyze runner progress through checkpoints

**Process:**
1. In **"Reports"** section, select **"Checkpoint Summary"**
2. **Configuration:**
   - Select checkpoint: "All" or specific checkpoint
   - Date range: Race day or custom
   - Include: Marked runners, missing, percentages
3. Click **"Generate"**
4. **Report Shows:**
   - Total runners per checkpoint
   - Marked runners count
   - Missing runners count
   - Percentage complete
   - Average time between checkpoints
   - Fastest/slowest times
5. **Actions:**
   - **Export PDF:** Professional format
   - **Export CSV:** Data analysis
   - **Print:** Hard copy
   - **Email:** Send to stakeholders

#### 6.4 Generate Status Summary Report

**Purpose:** Overall race completion statistics

**Process:**
1. Select **"Status Summary"** report type
2. Click **"Generate"**
3. **Report Displays:**
   ```
   Race: Mountain Trail 100K
   Date: 2024-12-20
   Total Registered: 88 runners
   
   Status Breakdown:
   ├── Finished: 65 (73.9%)
   ├── In Progress: 10 (11.4%)
   ├── Withdrawn: 8 (9.1%)
   ├── Vet Out: 3 (3.4%)
   ├── DNF: 1 (1.1%)
   └── Non-Starter: 1 (1.1%)
   
   Checkpoint Progress:
   ├── Mile 10: 85/88 (96.6%)
   ├── Mile 25: 78/88 (88.6%)
   └── Mile 40: 68/88 (77.3%)
   ```
4. **Export Options:**
   - PDF for presentation
   - CSV for analysis
   - JSON for data integration

#### 6.5 Generate Custom Reports

**Purpose:** Specific analysis needs

**Available Reports:**
- **Time Analysis:** Finish time distribution
- **Checkpoint Efficiency:** Processing times
- **DNF Analysis:** Where runners stopped
- **Age Group Results:** By category
- **Gender Results:** Male/Female breakdown
- **Pace Analysis:** Speed throughout race

**Process:**
1. Select **"Custom Report"**
2. Choose report type
3. Configure parameters
4. Generate and export

**Expected Outcome:**
- Complete visibility into race progress
- Missing runners identified quickly
- Comprehensive reports for stakeholders
- Data ready for post-race analysis

**Tips:**
- Refresh missing numbers list regularly
- Export out list for medical team
- Generate interim reports during race
- Keep printed copies as backup
- Share reports with race director

---

### Workflow 7: Base Station Operations - Log Operations and Audit Trail (Base Station Operator)

**Objective:** Monitor all operations, view audit trail, and manage deleted entries

**Prerequisites:**
- Base station module active
- Operations have been performed
- Appropriate permissions for viewing logs

**Steps:**

#### 7.1 View Operation Log

**Purpose:** Complete audit trail of all actions

**Process:**
1. Navigate to **"Log Operations"** tab (Alt+3)
2. **Log Table Displays:**
   - **Timestamp:** When action occurred
   - **Action Type:** What was done
   - **Runner Number:** Who was affected
   - **Details:** Specific information
   - **User:** Who performed action
   - **Result:** Success/failure
3. **Default View:** Most recent first (descending)

#### 7.2 Filter Log Entries

**By Action Type:**
1. Click **"Action"** filter dropdown
2. Select type:
   - All actions
   - Data entry
   - Withdrawal
   - Vet out
   - Status change
   - Deletion
   - Restoration
3. Log updates to show only selected type

**By Date/Time:**
1. Click **"Date Range"** filter
2. Select:
   - Today
   - Last hour
   - Last 4 hours
   - Custom range
3. Enter custom dates if needed
4. Apply filter

**By Runner Number:**
1. Enter runner number in search
2. View all actions for that runner
3. See complete history

**By User:**
1. Filter by operator name
2. View all actions by specific user
3. Useful for training and accountability

#### 7.3 View Deleted Entries

**Purpose:** Review and potentially restore deleted data

**Process:**
1. Click **"View Deleted Entries"** button (or Alt+L)
2. **Deleted Entries Dialog Opens:**
   - **Deleted Timestamp:** When deleted
   - **Entry Type:** What was deleted
   - **Runner Number:** Affected runner
   - **Original Data:** Complete record
   - **Deleted By:** Who deleted it
   - **Restorable:** Yes/No status
3. **Sort Options:**
   - By deletion time
   - By entry type
   - By runner number

#### 7.4 Restore Deleted Entry

**When to Use:**
- Accidental deletion
- Data entry error
- Administrative correction

**Process:**
1. In Deleted Entries dialog, find entry
2. Verify **"Restorable: Yes"** status
3. Click **"Restore"** button
4. **Confirmation Dialog:**
   - "Restore entry for runner 150?"
   - Shows original data
   - Warning about conflicts
5. Click **"Confirm"**
6. **Result:**
   - Entry restored to database
   - Restoration logged in audit trail
   - Success message displayed
7. Close dialog
8. Verify restored data in main view

**Non-Restorable Entries:**
- Overwritten by newer data
- Conflicts with current state
- System displays reason
- Manual re-entry may be needed

#### 7.5 View Duplicate Entries

**Purpose:** Identify and resolve data conflicts

**Process:**
1. Click **"View Duplicates"** button
2. **Duplicates Dialog Opens:**
   - Groups of conflicting entries
   - Each group shows:
     - Runner number
     - Multiple timestamps
     - Different values
     - Source of each entry
3. **Resolution Options:**
   - Keep earliest entry
   - Keep latest entry
   - Keep specific entry
   - Merge data
   - Manual resolution

#### 7.6 Resolve Duplicates

**Process:**
1. Select duplicate group
2. Review all entries in group
3. Choose resolution strategy:
   - **Auto-resolve:** System picks best entry
   - **Manual:** Select which to keep
4. Click **"Resolve"**
5. **Confirmation:**
   - Shows which entry will be kept
   - Shows which will be deleted
6. Click **"Confirm"**
7. **Result:**
   - Duplicate resolved
   - Kept entry remains
   - Deleted entries moved to deleted log
   - Resolution logged

#### 7.7 Export Audit Log

**Purpose:** External analysis or archival

**Process:**
1. Configure filters (if needed)
2. Click **"Export Log"**
3. **Export Options:**
   - **CSV:** Spreadsheet format
   - **JSON:** Data integration
   - **PDF:** Human-readable report
4. Select format and download
5. File includes:
   - All filtered entries
   - Complete details
   - Timestamp information
   - User attribution

**Expected Outcome:**
- Complete visibility into all operations
- Ability to track down any issue
- Deleted data recoverable
- Duplicates identified and resolved
- Full accountability maintained

**Tips:**
- Review log regularly for anomalies
- Export log daily for backup
- Investigate unexpected deletions immediately
- Resolve duplicates promptly
- Use log for training and quality control

---

### Workflow 8: Base Station Operations - Housekeeping (Base Station Operator)

**Objective:** Manage strapper calls, create backups, and maintain system health

**Prerequisites:**
- Base station module active
- Appropriate permissions
- Storage space available for backups

**Steps:**

#### 8.1 Manage Strapper Calls

**Purpose:** Coordinate requests for additional support

**What is a Strapper Call?**
- Request for additional volunteer
- Need for supplies or equipment
- Medical assistance needed
- Any checkpoint support requirement

**Create Strapper Call:**
1. Navigate to **"Housekeeping"** tab (Alt+5)
2. In **"Strapper Calls"** section, click **"Add Call"**
3. **Call Dialog Opens:**
   - **Checkpoint:** Select location
   - **Priority:** Choose level:
     - Low: Non-urgent
     - Medium: Needed soon
     - High: Urgent
     - Critical: Emergency
   - **Type:** Select category:
     - Medical supplies
     - Food/water
     - Equipment
     - Personnel
     - Other
   - **Notes:** Detailed description
4. Click **"Submit"**
5. **Result:**
   - Call added to list
   - Status: "Pending"
   - Timestamp recorded
   - Visible to all operators

**Manage Existing Calls:**
1. View list of all calls
2. **For Each Call:**
   - Priority indicator (color-coded)
   - Checkpoint location
   - Time requested
   - Current status
   - Assigned to (if applicable)
3. **Actions:**
   - **Assign:** Assign to specific person
   - **Update:** Add progress notes
   - **Complete:** Mark as fulfilled
   - **Cancel:** If no longer needed

**Mark Call Complete:**
1. Find call in list
2. Click **"Mark Complete"**
3. **Completion Dialog:**
   - Add completion notes
   - Confirm resolution
4. Click **"Confirm"**
5. **Result:**
   - Status: "Complete"
   - Completion time recorded
   - Moved to completed section

#### 8.2 Create Backup

**Purpose:** Protect race data from loss

**When to Backup:**
- Before race starts
- Every 2-4 hours during race
- After major data entry sessions
- Before any system changes
- At race completion

**Process:**
1. In **"Backup & Restore"** section
2. Click **"Backup Now"** button (or Alt+K)
3. **Backup Dialog Opens:**
   - **Backup Name:** Enter descriptive name
     - Example: "Pre-race-backup-2024-12-20"
     - Example: "Mid-race-checkpoint-3-complete"
   - **Notes:** Add context
     - What's included
     - Why created
     - Any special circumstances
   - **Include:**
     - ☑ Race configuration
     - ☑ Runner data
     - ☑ Checkpoint records
     - ☑ Base station records
     - ☑ Audit logs
     - ☑ Settings
4. Click **"Create Backup"**
5. **Progress:**
   - System collects data
   - Compresses files
   - Saves to storage
6. **Completion:**
   - Success message
   - Backup listed with:
     - Name
     - Timestamp
     - Size
     - Notes
   - Download link available

**Backup Storage:**
- **Local:** Browser storage (IndexedDB)
- **Download:** Save to device
- **External:** USB drive, cloud storage

#### 8.3 Restore from Backup

**Purpose:** Recover data after loss or corruption

**⚠️ WARNING:** Restoring overwrites current data!

**Process:**
1. Click **"Restore from Backup"** button
2. **Backup List Displays:**
   - All available backups
   - Sorted by date (newest first)
   - Each shows:
     - Name
     - Date/time
     - Size
     - Notes
3. **Select Backup:**
   - Click on backup to select
   - Review details carefully
4. **Preview Backup:**
   - Click **"Preview"** button
   - View backup contents:
     - Race configuration
     - Runner count
     - Data timestamp
     - What will be restored
5. **Restore:**
   - Click **"Restore"** button
   - **⚠️ Warning Dialog:**
     - "This will overwrite all current data"
     - "Current data will be lost"
     - "This cannot be undone"
     - Checkbox: "I understand the risks"
6. **Confirm:**
   - Check understanding box
   - Click **"Confirm Restore"**
7. **Process:**
   - System clears current data
   - Loads backup data
   - Rebuilds database
   - Verifies integrity
8. **Completion:**
   - Success message
   - Application reloads
   - Restored data active

**Best Practices:**
- Create backup before restoring
- Verify backup contents before restoring
- Test restore process before race day
- Keep multiple backup copies
- Store backups in multiple locations

#### 8.4 View System Information

**Purpose:** Monitor system health and usage

**Process:**
1. In **"System Information"** section
2. Click **"About"** button (or Alt+O)
3. **About Dialog Displays:**
   - **Application Info:**
     - Name: Race Tracker Pro
     - Version: 1.0.0
     - Build date
   - **Database Info:**
     - Schema version
     - Total records
     - Database size
   - **Storage Info:**
     - Used space
     - Available space
     - Quota limit
   - **System Info:**
     - Browser
     - Operating system
     - Screen resolution
   - **Race Info:**
     - Current race
     - Active module
     - Last backup
     - Uptime

#### 8.5 Manage Storage

**Purpose:** Prevent storage quota issues

**Monitor Storage:**
1. View storage usage in About dialog
2. **Warning Levels:**
   - Green: < 50% used
   - Yellow: 50-80% used
   - Red: > 80% used

**Clean Up Storage:**
1. Click **"Manage Storage"**
2. **Options:**
   - **Clear Cache:** Remove temporary files
   - **Archive Old Races:** Move to external storage
   - **Delete Old Backups:** Remove outdated backups
   - **Optimize Database:** Compact and rebuild
3. Select actions
4. Click **"Clean Up"**
5. Verify space freed

**Expected Outcome:**
- Strapper calls coordinated efficiently
- Regular backups protect data
- System health monitored
- Storage managed proactively
- Quick recovery from issues

**Tips:**
- Backup before and after race
- Test restore process regularly
- Monitor storage during long races
- Keep backup schedule
- Document backup locations

---

### Workflow 9: Keyboard Shortcuts and Power User Features (All Users)

**Objective:** Maximize efficiency using keyboard shortcuts and advanced features

**Prerequisites:**
- Familiarity with basic operations
- Keyboard available
- Shortcuts enabled (default)

**Steps:**

#### 9.1
