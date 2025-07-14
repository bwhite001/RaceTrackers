# Race Tracker Pro - How to Use Guide

Race Tracker Pro is an offline-capable race management application designed for tracking runners during races. This guide will walk you through all the essential features and workflows.

## Table of Contents
- [Getting Started](#getting-started)
- [Creating Your First Race](#creating-your-first-race)
- [Checkpoint Mode](#checkpoint-mode)
- [Base Station Mode](#base-station-mode)
- [Settings & Customization](#settings--customization)
- [Common Workflows](#common-workflows)
- [Tips & Best Practices](#tips--best-practices)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Initial Launch
When you first open Race Tracker Pro, you'll see a clean interface with no races configured.

![Initial Application Launch](screenshots/01-initial-application-launch.png)

The main screen shows:
- **Header**: Contains the app logo, current race info (when available), and settings
- **Race Management**: Central area for creating and managing races
- **Create First Race** / **Create New Race**: Buttons to start setting up a race

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No internet connection required after initial load
- Works on desktop and mobile devices

## Creating Your First Race

### Step 1: Start Race Creation
Click either "Create First Race" or "Create New Race" to open the race setup form.

### Step 2: Fill Race Details
The race creation form includes:

**Race Name**: Enter a descriptive name for your race
- Example: "Spring Marathon 2024", "City 10K Run"

**Race Date**: Select the date of your race
- Uses date picker for easy selection
- Defaults to current date

**Start Time**: Set the official race start time
- Uses time picker (24-hour format)
- Defaults to 08:00

**Runner Range**: Define the range of runner numbers
- **Quick Input**: Enter ranges like "100-150" or "500-750"
- **Individual Fields**: Set minimum and maximum runner numbers manually
- **Auto-calculation**: Shows total number of runners automatically

### Step 3: Runner Range Examples
The application supports flexible runner numbering:
- **Simple Range**: `100-200` (creates runners 100 through 200)
- **Large Range**: `1000-1500` (creates runners 1000 through 1500)
- **Small Range**: `1-50` (creates runners 1 through 50)

### Step 4: Create the Race
Click "Create Race" to finalize your race setup. The system will:
- Validate all inputs
- Create the race configuration
- Generate all runner records
- Switch to mode selection

## Operation Modes

After creating a race, you'll choose between two operation modes:

### Mode Selection Screen
- **Checkpoint Mode**: For tracking runners passing through checkpoints
- **Base Station Mode**: For entering finish times and managing race completion data

Both modes can be switched between at any time during the race.

## Checkpoint Mode

Checkpoint Mode is designed for volunteers stationed at checkpoints along the race route.

### Runner Tracking Tab

**Purpose**: Mark runners as they pass through your checkpoint

**Features**:
- **Grid View**: Visual grid of runner numbers for quick tapping
- **Search Function**: Quickly find specific runner numbers
- **Grouping**: Runners organized in groups (default: 50 per group)
- **Real-time Updates**: Instant status updates and timestamps

**How to Use**:
1. Wait for runners to approach your checkpoint
2. Tap the runner's number as they pass
3. The button turns green and shows the timestamp
4. Status counters update automatically

**Visual Indicators**:
- **Gray**: Runner not yet passed
- **Green**: Runner passed (shows timestamp)
- **Status Bar**: Shows "X passed, Y total" at the top

### Callout Sheet Tab

**Purpose**: Organize runners into time segments for radio callouts to race control

**Features**:
- **5-Minute Segments**: Automatic grouping by 5-minute time windows
- **Pending Callouts**: Shows segments ready to be called in
- **Mark Called**: Button to mark segments as reported
- **Time Display**: Shows both clock time and elapsed race time

**How to Use**:
1. Runners are automatically grouped as they pass through
2. Each 5-minute segment appears in "Pending Callouts"
3. Call in the segment to race control via radio
4. Click "Mark Called" to move it to history
5. Continue with next pending segment

**Example Callout**:
"Race Control, Checkpoint 3: Segment 11:55-12:00, Runner 100 passed, elapsed time 3:55:00"

### Overview Tab

**Purpose**: Complete status dashboard for all runners

**Features**:
- **Statistics Cards**: Total, Passed, Not Started, NS+DNF counts
- **Runner Table**: Detailed view of all runners with status
- **Search & Filter**: Find specific runners or filter by status
- **Manual Updates**: Mark runners as Non-Starter (NS) or Did Not Finish (DNF)

**Status Meanings**:
- **Passed**: Runner successfully passed this checkpoint
- **Not Started**: Runner hasn't reached this checkpoint yet
- **NS (Non-Starter)**: Runner didn't start the race
- **DNF (Did Not Finish)**: Runner started but didn't complete

## Base Station Mode

Base Station Mode is designed for the finish line or race headquarters.

### Data Entry Tab

**Purpose**: Enter finish times for groups of runners

**Common Time Section**:
- **Date/Time Picker**: Set the common finish time
- **Now Button**: Use current time
- **Race Start Button**: Use official race start time

**Runner Numbers Section**:
- **Flexible Input**: Enter runner numbers in various formats
- **Supported Formats**:
  - Individual: `101, 102, 103`
  - Ranges: `150-155` (expands to 150, 151, 152, 153, 154, 155)
  - Mixed: `101, 105-107, 110`
  - One per line or comma/space separated

**Batch Processing**:
1. Set the common time for a group of finishers
2. Enter all runner numbers who finished at that time
3. Click "Assign Time to X Runners"
4. Repeat for different finish times

### Race Overview Tab

**Purpose**: Identical to Checkpoint Overview but with finish line perspective

**Additional Features**:
- **Final Results**: Complete race results and timing
- **Status Management**: Handle DNS, DNF, and other race statuses
- **Export Capabilities**: Generate final results (via settings)

## Settings & Customization

Access settings via the gear icon in the top-right corner.

### Appearance Settings

**Dark Mode**:
- Toggle between light and dark themes
- Automatic application across all screens
- Better visibility in low-light conditions

**Font Size**:
- Six size options: Small, Medium, Normal, Large, Extra Large, Huge
- Immediate preview of changes
- Accessibility support for vision needs

### Runner Display Settings

**Default View Mode**:
- **Grid**: Visual button layout (recommended for touch devices)
- **List**: Table format (better for large screens)

**Default Group Size**:
- Choose how many runners per group: 10, 25, 50, 100
- Affects navigation and performance
- Smaller groups for easier scrolling

### Status Colors

Customize colors for different runner statuses:
- **Passed**: Default green
- **Not Started**: Default gray
- **Non-Starter**: Default red
- **DNF**: Default orange

## Common Workflows

### Checkpoint Volunteer Workflow

1. **Setup**:
   - Receive race configuration (QR code or file)
   - Import into Race Tracker Pro
   - Switch to Checkpoint Mode
   - Position at assigned checkpoint

2. **During Race**:
   - Use Runner Tracking tab
   - Tap runners as they pass
   - Monitor Callout Sheet for radio updates
   - Call in 5-minute segments to race control

3. **End of Race**:
   - Review Overview tab for completeness
   - Mark any DNS/DNF runners
   - Export data if required

### Finish Line Workflow

1. **Setup**:
   - Create race or import configuration
   - Switch to Base Station Mode
   - Prepare timing equipment

2. **During Race**:
   - Use Data Entry tab for batch time entry
   - Group finishers by common times
   - Process results in real-time

3. **Post-Race**:
   - Review Race Overview for final results
   - Handle any status corrections
   - Export final results

### Multi-Checkpoint Race

1. **Race Director**:
   - Create master race configuration
   - Generate QR codes for each checkpoint
   - Distribute to checkpoint volunteers

2. **Each Checkpoint**:
   - Import race configuration
   - Use Checkpoint Mode
   - Track runners and manage callouts

3. **Data Collection**:
   - Collect data from each checkpoint
   - Merge results at race headquarters
   - Generate comprehensive race report

## Tips & Best Practices

### For Checkpoint Volunteers

**Preparation**:
- Test the app before race day
- Ensure device is fully charged
- Have backup power source available
- Practice with sample data

**During Race**:
- Keep device screen active to prevent sleep
- Use grid view for faster tapping
- Don't worry about missed runners - focus on accuracy
- Use search function for specific runner queries

**Communication**:
- Follow callout schedule consistently
- Speak clearly when calling in segments
- Confirm receipt of callouts
- Report any issues immediately

### For Race Directors

**Setup**:
- Create race configuration well in advance
- Test with sample data
- Train volunteers on app usage
- Prepare backup procedures

**Distribution**:
- Use QR codes for easy configuration sharing
- Email backup configurations
- Provide written instructions
- Have tech support available

**Data Management**:
- Collect data from all checkpoints
- Verify data completeness
- Handle discrepancies promptly
- Backup all race data

### Performance Optimization

**Large Races (500+ runners)**:
- Use smaller group sizes (25-50 runners)
- Consider splitting into multiple race configurations
- Ensure devices have adequate storage
- Test performance with full data set

**Multiple Checkpoints**:
- Coordinate callout schedules
- Use consistent time references
- Plan data collection procedures
- Have communication backup plans

## Troubleshooting

### Common Issues

**App Won't Load**:
- Check internet connection for initial load
- Clear browser cache and reload
- Try different browser
- Ensure JavaScript is enabled

**Data Not Saving**:
- Check browser storage permissions
- Ensure adequate storage space
- Don't close browser during operations
- Use export function for backups

**Performance Issues**:
- Reduce group size in settings
- Close other browser tabs
- Restart browser if needed
- Consider device memory limitations

**QR Code Won't Scan**:
- Ensure camera permissions granted
- Try manual data entry instead
- Check QR code image quality
- Use copy/paste as alternative

### Error Recovery

**Lost Data**:
- Check browser's local storage
- Look for auto-saved configurations
- Recreate from backup if available
- Contact race director for master copy

**Sync Issues**:
- Export current data immediately
- Compare with other checkpoints
- Identify discrepancies
- Manually reconcile differences

**Device Problems**:
- Have backup device ready
- Keep paper backup system
- Train multiple volunteers per checkpoint
- Maintain communication with race control

### Getting Help

**During Race Day**:
- Contact race director immediately
- Use backup procedures if available
- Document issues for post-race review
- Focus on core functionality

**Technical Support**:
- Check browser console for errors
- Note exact error messages
- Document steps to reproduce
- Provide device and browser information

## Advanced Features

### Data Import/Export

**Export Options**:
- JSON format for technical users
- QR code for easy sharing
- Email integration for distribution

**Import Methods**:
- QR code scanning
- File upload
- Manual data entry
- Copy/paste from email

### Offline Operation

**Capabilities**:
- Complete offline functionality
- Local data storage
- No internet required during race
- Automatic data persistence

**Limitations**:
- Initial load requires internet
- No real-time sync between devices
- Manual data collection required
- Limited to single-device operation

### Browser Compatibility

**Fully Supported**:
- Chrome/Chromium (desktop and mobile)
- Firefox (desktop and mobile)
- Safari (macOS and iOS)
- Edge (desktop and mobile)

**Limited Support**:
- Older browser versions
- Internet Explorer (not recommended)
- Browsers with JavaScript disabled

---

## Quick Reference

### Keyboard Shortcuts
- **Search**: Click search box or start typing runner number
- **Settings**: Click gear icon in header
- **Mode Switch**: Click Checkpoint/Base Station buttons

### Status Colors
- 🟢 **Green**: Passed/Completed
- 🔵 **Blue**: Current/Active
- ⚪ **Gray**: Not Started/Pending
- 🔴 **Red**: Non-Starter
- 🟠 **Orange**: Did Not Finish

### Time Formats
- **Display**: 12-hour format with AM/PM
- **Entry**: 24-hour format (HH:MM)
- **Elapsed**: Hours:Minutes:Seconds from race start

### Runner Number Formats
- **Individual**: `100, 101, 102`
- **Range**: `100-110`
- **Mixed**: `100, 105-107, 110`
- **Flexible**: Commas, spaces, or new lines as separators

---

*Race Tracker Pro - Streamlining race management, one runner at a time.* 🏃‍♀️🏃‍♂️

For technical documentation and installation instructions, see the main [README.md](README.md) file.
