# Base Station Screenshot Capture Guide

This directory contains screenshots for the Base Station Operations User Guide.

## Prerequisites

Before running the screenshot capture script, ensure:

1. **Development Server is Running**
   ```bash
   npm run dev
   ```
   The application should be accessible at `http://localhost:3001`

2. **Test Data is Available**
   - A race should be created with runner data
   - Base Station mode should be accessible
   - Consider using the test seeder if needed

## Running the Screenshot Capture

From the project root directory, execute:

```bash
node capture-base-station-screenshots.js
```

## What Gets Captured

The script captures 18 screenshots covering all Base Station features:

1. **Homepage** - Base Station Operations card
2. **Runner Grid Tab** - Main tracking interface
3. **Data Entry Tab** - Quick actions panel
4. **Withdrawal Dialog** - Runner withdrawal interface
5. **Vet-Out Dialog** - Vet-out interface
6. **Log Operations Tab** - Entry management
7. **Duplicates Dialog** - Side-by-side comparison
8. **Deleted Entries View** - Audit trail
9. **Lists & Reports Tab** - Missing numbers
10. **Missing Numbers List** - Runners not at checkpoint
11. **Out List** - Withdrawn and vetted out runners
12. **Reports Panel** - Generation and export options
13. **Housekeeping Tab** - Strapper calls and backup
14. **Strapper Calls Panel** - Resource management
15. **Backup Dialog** - Backup & restore interface
16. **Help Dialog** - Comprehensive documentation
17. **About Dialog** - System information
18. **Overview Tab** - Status management

## Output

- **Screenshots**: Saved as PNG files in this directory
- **Summary Report**: `CAPTURE_SUMMARY.md` with capture statistics and results

## Screenshot Naming Convention

Screenshots follow the pattern: `base-station-##-description.png`

Example: `base-station-01-homepage.png`

## Troubleshooting

### Server Not Running
```
Error: net::ERR_CONNECTION_REFUSED
```
**Solution**: Start the development server with `npm run dev`

### Missing Elements
```
Error: Waiting for selector failed: timeout
```
**Solution**: 
- Ensure test data exists in the application
- Check that the Base Station interface is fully loaded
- Verify element selectors match the current UI

### Permission Errors
```
Error: EACCES: permission denied
```
**Solution**: Check directory permissions for the screenshots folder

## Manual Verification

After capture, review each screenshot to ensure:
- ✓ All UI elements are visible
- ✓ Dialogs are properly displayed
- ✓ Text is readable
- ✓ No loading spinners or incomplete renders
- ✓ Proper viewport size (900x600)

## Re-running Specific Screenshots

To capture specific screenshots, modify the `screenshots` array in `capture-base-station-screenshots.js` to include only the desired entries.

## Integration with User Guide

These screenshots are referenced in `BASE_STATION_USER_GUIDE.md` to illustrate features and workflows.
