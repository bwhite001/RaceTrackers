# RaceTracker user guide — radio procedure notes

For the user guide. Radio wording is deliberately **not** shown in the app screens; it belongs here. Source: WICEN Mt Glorious Mountain Trails exercise brief (8 Nov 2026).

## Call types (WICEN brief)

- **Unofficial message:** "VK4WIP this is VK4[CALLSIGN]" — general contact, no log entry.
- **Scores Checkpoint:** "VK4WIP this is VK4[CALLSIGN] Scores Checkpoint?" — base acknowledges, then the checkpoint sends common time + competitor numbers.
- **Official written message:** "VK4WIP this is VK4[CALLSIGN] Official Message" — base readies the log pad. Must include sender, recipient, message number, date/time and the originator's signature.
- **Stand down:** call base for permission once the sweep vehicle has passed.

## Reporting rules

- Send grouped times every 5 to 10 competitors, no more than ~5 minutes delay.
- Times are approximate — grouped into 5-minute blocks (common times).
- Read every bib number individually. Never read ranges ("144 to 148").

## Checkpoint: sending a Scores Checkpoint call

1. The Callout sheet shows a gold **Call due** banner when the 5–10 competitor / ~5 minute rule is reached.
2. Call base: "VK4WIP this is VK4[CALLSIGN], Scores Checkpoint?" and wait for base to acknowledge.
3. For each block, give the common time, then the numbers.
4. Busy block: tap **Read out**. Numbers are split into overs of up to 5. Tick each number as you read it; **Base copied — next** unlocks when all are ticked. End each over with "more to follow, over" and the last with "that completes [time], over". **Reset** clears the ticks on the current over if base needs it again.
5. When base has copied everything, tap **Base copied — mark sent**.

## Base: receiving a call

1. Listen for "VK4WIP this is VK4…, Scores Checkpoint?" and tap that checkpoint under **Who's calling?** (gold **Due** = no call for 8+ minutes with runners expected).
2. Acknowledge: "[CALLSIGN], VK4WIP — go ahead with scores."
3. The time row opens on that checkpoint's **next** block (base is often 45–60 min behind). Tap a different block if they give another time, or type an exact time.
4. Type each number as it's read (keyboard or keypad) and **Add**. Say "copied, go ahead" between overs.
5. They move to the next time: tap **Next →**. The numbers box clears; earlier blocks stay in the call ("Also in this call: 07:40 · 5").
6. Missed a number? Ask "say again after [last number]".
7. Tap **Complete**, then confirm on air: "Copied [N] competitors. VK4WIP."
8. **Clear [time]** wipes the current block; **Cancel call** (tap twice) drops the whole call. Both have Undo.

## Number checks at base

- Blue: fine to record.
- Blue with dark border: not seen at the previous checkpoint (possible missed runner) — still recorded.
- Gold: already logged at this checkpoint, or said twice — skipped.
- Red, struck through: not in the race, or DNF/DNS — skipped.

## Fixing mistakes

Checkpoint:
- Tap a marked runner on **Mark off** to change its time (−5/−1/+1/+5) or unmark it. Unmarking shows Undo.
- An unmarked runner keeps "was HH:MM"; tapping it restores the original time or uses now.
- **Overview**: tap any runner to change time, undo call-in, reset to not passed, or mark DNS/DNF. Every change has Undo.
- Changing a time base already has sends it back to the callout sheet as a correction.

Base:
- **DNF / DNS** tab: bulk add by typing or pasting numbers, choose where and why, apply; Clear any entry to put a runner back in the race.
- **Reports › Needs attention**: duplicates, out-of-order times, skipped checkpoints, sightings after DNF/DNS, unknown bibs, impossible pace — resolve each in place.
