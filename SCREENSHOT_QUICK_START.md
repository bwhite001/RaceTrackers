# Screenshot Capture - Quick Start

Quick reference for capturing screenshots in Race Tracker Pro.

## TL;DR

```bash
# 1. Start the dev server
npm run dev

# 2. In a new terminal, capture Base Station screenshots
npm run screenshots:base-station

# 3. Screenshots saved to: screenshots/base-station-guide/
```

## Commands

| Command | Purpose | Output Location |
|---------|---------|-----------------|
| `npm run screenshots:base-station` | Capture 18 Base Station screenshots | `screenshots/base-station-guide/` |
| `npm run screenshots:all` | Capture 10 general app screenshots | `screenshots/` |

## Prerequisites Checklist

- [ ] Development server running (`npm run dev`)
- [ ] Application accessible at `http://localhost:3001`
- [ ] Race created with runner data
- [ ] Base Station mode accessible

## What Gets Captured (Base Station)

1. ✓ Homepage
2. ✓ Runner Grid Tab
3. ✓ Data Entry Tab
4. ✓ Withdrawal Dialog
5. ✓ Vet-Out Dialog
6. ✓ Log Operations Tab
7. ✓ Duplicates Dialog
8. ✓ Deleted Entries View
9. ✓ Lists & Reports Tab
10. ✓ Missing Numbers List
11. ✓ Out List
12. ✓ Reports Panel
13. ✓ Housekeeping Tab
14. ✓ Strapper Calls Panel
15. ✓ Backup Dialog
16. ✓ Help Dialog
17. ✓ About Dialog
18. ✓ Overview Tab

## Troubleshooting

| Error | Solution |
|-------|----------|
| Connection refused | Start dev server: `npm run dev` |
| Element not found | Ensure test data exists |
| Permission denied | Check directory permissions |

## Output Files

After successful capture:
- `screenshots/base-station-guide/*.png` - 18 PNG screenshots
- `screenshots/base-station-guide/CAPTURE_SUMMARY.md` - Capture report

## Next Steps

1. Review screenshots in `screenshots/base-station-guide/`
2. Check `CAPTURE_SUMMARY.md` for any failures
3. Re-run if needed for failed screenshots
4. Use screenshots in documentation

## Full Documentation

For detailed information, see: [SCREENSHOT_CAPTURE_GUIDE.md](./SCREENSHOT_CAPTURE_GUIDE.md)
