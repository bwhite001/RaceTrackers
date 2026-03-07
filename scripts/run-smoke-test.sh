#!/usr/bin/env bash
# Run the Playwright smoke test in the background and stream output to a timestamped log.
#
# Usage:
#   ./scripts/run-smoke-test.sh           # background (default)
#   ./scripts/run-smoke-test.sh --fg      # foreground (blocking)
#   ./scripts/run-smoke-test.sh --headed  # headed browser, foreground

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="$REPO_ROOT/test-results/smoke"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$OUTPUT_DIR/smoke-${TIMESTAMP}.log"
SPEC="test/e2e/playwright/15-smoke-test.journey.spec.js"

FOREGROUND=false
HEADED=false

for arg in "$@"; do
  case $arg in
    --fg)      FOREGROUND=true ;;
    --headed)  HEADED=true; FOREGROUND=true ;;
  esac
done

mkdir -p "$OUTPUT_DIR"

# Verify port 3000 is up — playwright config uses reuseExistingServer
if ! curl -sf -o /dev/null http://localhost:3000/; then
  echo "⚠️  Nothing serving on http://localhost:3000"
  echo "   Run 'make preview' or 'make dev' first, then re-run this script."
  exit 1
fi

PLAYWRIGHT_ARGS=(
  "$SPEC"
  --config playwright.config.js
  --reporter=list
  --output="$OUTPUT_DIR"
)

if $HEADED; then
  PLAYWRIGHT_ARGS+=(--headed)
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RaceTracker Smoke Test"
echo "  Spec : $SPEC"
echo "  Log  : $LOG_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$REPO_ROOT"

if $FOREGROUND; then
  npx playwright test "${PLAYWRIGHT_ARGS[@]}" 2>&1 | tee "$LOG_FILE"
  EXIT_CODE=${PIPESTATUS[0]}
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  if [ "$EXIT_CODE" -eq 0 ]; then
    echo "  ✅  All smoke tests passed"
  else
    echo "  ❌  Some tests failed — see $LOG_FILE"
  fi
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit $EXIT_CODE
else
  nohup npx playwright test "${PLAYWRIGHT_ARGS[@]}" > "$LOG_FILE" 2>&1 &
  PID=$!
  echo "  Running in background (PID: $PID)"
  echo ""
  echo "  Follow live:  tail -f $LOG_FILE"
  echo "  Check done:   ls -lh $OUTPUT_DIR"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi
