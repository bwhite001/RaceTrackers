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

## Checkpoint: official message

Official messages are written on the paper message pad, not in the app.

1. Write the message on the pad: sender, recipient, message number, date / time and the message. The originator signs it.
2. Call base: "VK4WIP this is VK4[CALLSIGN] Official Message", wait for base to ready the log pad, then read the number, date / time, originator and message.

## Base: receiving a call

1. Listen for "VK4WIP this is VK4…, Scores Checkpoint?" and tap that checkpoint under **Who's calling?** (gold **Due** = no call for 8+ minutes with runners expected).
2. Acknowledge: "[CALLSIGN], VK4WIP — go ahead with scores."
3. The time row opens on that checkpoint's **next** block (base is often 45–60 min behind). Tap a different block if they give another time, or type an exact time.
4. Type each number as it's read (keyboard or keypad) and **Add**. Say "copied, go ahead" between overs.
5. They move to the next time: tap **Next →**. The numbers box clears; earlier blocks stay in the call ("Also in this call: 07:40 · 5").
6. Missed a number? Ask "say again after [last number]".
7. Tap **Complete**, then confirm on air: "Copied [N] competitors. VK4WIP."
8. **Clear [time]** wipes the current block; **Cancel call** (tap twice) drops the whole call. Both have Undo.
9. A gold **Ask about 106** on a checkpoint's button and board row is a reminder you set in **Reports › Needs attention** ("Ask CP2"). Ask them on this call, then tap **Asked** (Undo if you tapped it by mistake).

## Number checks at base

- Blue: fine to record.
- Blue with dark border: not seen at the previous checkpoint (possible missed runner) — still recorded.
- Gold: already logged at this checkpoint, or said twice — skipped.
- Red, struck through: not in the race, or DNF/DNS — skipped.

## Corrections

Sent as a separate call, one runner at a time, never mixed into a Scores call:
"Checkpoint [n] correction, runner [bib], time is now [HH:MM]." Give the new common time (5-minute block) unless an exact time was recorded.

- Checkpoint: corrections appear in their own card on the Callout sheet ("101 · now 10:55 · was 11:00"). Tap **Base copied — correction sent** once base has it.
- Base: tap the checkpoint, tap **Correction**, type the bib, check what base had, pick the new time and tap **Apply correction**. Undo is available.
- A time edit inside the same 5-minute block is not a correction and nothing needs to be sent.
- A runner called in by mistake who never passed: "Checkpoint [n] correction, runner [bib], not passed." The checkpoint's card shows "142 · not passed · was 11:00"; base taps **Not passed** before **Apply correction**.
- In a normal Scores call, a number base already has shows gold **Had HH:MM** and is skipped. Without the word "correction" it's treated as a mistake, not a new time.

## Missed runners

A checkpoint can't know it missed someone. Base finds out when the runner is called in at a later checkpoint. Base then shows a gold note on that checkpoint, e.g. "Missed: 213 (seen CP2)".

- Base: next time that checkpoint calls (or call them), ask about each number. Tap **They have it** and enter the time they give, or **Not seen there** (the times table then shows "missed" for that checkpoint). Both have Undo. If the checkpoint calls the number in normally, the note clears by itself.
- Before a checkpoint stands down, base opens **Stand-down check** for it. It lists runners "Seen further on" (missed there) and runners "Not seen past here". Read back any "Not seen past here" numbers, and stand the checkpoint down only when they're accounted for. **Stand down** (tap twice) marks it Closed; Undo reopens it. Runners still unaccounted for stay on Overdue / Still on course.
- Checkpoint: if base tells you a runner came through, open them in **Overview** and use **Missed — passed earlier**. Step the time back to the time base gives (or your best estimate) and save; it goes on the Corrections card as "213 · missed · now 08:35" to confirm with base.
- **Wording to be confirmed by Brandon** for base asking a checkpoint about a missed runner.

## A number that isn't in the setup

Bib ranges can change on the day, and some races only know bibs at registration. A runner whose number isn't in the setup is still recorded, never lost.

- Checkpoint: type the number in quick entry as usual. It's marked and its tile gets a small gold corner ("not in setup"). A number longer than any bib in the race (or over 9999) asks "Mark 51212? It isn't in the setup" first, in case it's a typo. Read it to base like any other number.
- Base: in a call, the number shows gold **Not in setup — tap to record**. Tap it if the checkpoint confirms the number; it's recorded as a **Late entry** and joins the field. Leave it untapped to skip it; it then appears in **Reports › Needs attention › Unknown bibs**, where **Add to field** records it later.
- DNF / DNS: a number outside the field shows **Not in setup — tap to add**.
- Race setup: tick **Bibs assigned on the day** for a race with no bib list yet. Counts that need the field show "—" until bibs are known.

## Fixing mistakes

Checkpoint:
- Tap a marked runner on **Mark off** to change its time (−5/−1/+1/+5) or unmark it. Unmarking shows Undo.
- An unmarked runner keeps "was HH:MM"; tapping it restores the original time or uses now.
- **Overview**: tap any runner to change time, undo call-in, reset to not passed, or mark DNS/DNF. Every change has Undo.
- Changing a time base already has into another 5-minute block puts it on the Corrections card (see Corrections).

Base:
- **DNF / DNS** tab: bulk add by typing or pasting numbers, choose where and why, apply; Clear any entry to put a runner back in the race.
- **Reports › Needs attention**: duplicates, out-of-order times, skipped checkpoints, sightings after DNF/DNS, unknown bibs, impossible pace — resolve each in place.

## Base: fixing recorded numbers (Records)

Records is base's own list of every number it holds for one checkpoint. On Receive, tap the checkpoint, then **Records** (a gold count shows how many need checking). Every checkpoint row on the board also has a small **Records** button. **Back to call** returns to the call you were taking, with nothing lost.

- View the numbers **By block**, **By number** or **By call**. **Find number** narrows the list to bibs starting with the digits typed. The filter pills show duplicates, missed runners, wrong numbers and other checks.
- Tap a number to change its **Time**, fix a mistyped **Number**, move it to the right **Checkpoint**, or **Remove** it (tap twice). For a duplicate, **Keep this one** removes the others. For a wrong number heard on a call, use **Change number** or **Record as late entry**.
- Every change asks **Why**: *Checkpoint correction*, *Base typing error* or *Other*. A checkpoint correction is logged as a correction call, so it shows in the call log, the same as Correction mode.
- **Select** fixes several numbers at once: tap them, or use **Select block** / **Select call**. Every bib is listed on its own line before you save.
- Nothing is deleted. **Show history** shows what each change replaced, and **Undo** reverses the last change exactly. An edit can lower a checkpoint's "up to"; the status line says so when it does.
- Records only changes base's own records. It never changes what a checkpoint holds, so ask the checkpoint for a correction if their sheet is wrong too.

## Crew & vehicle log

For insurance, base logs which car went to each checkpoint, who was in it, and when it left home and arrived. Use the **Crews** tab, or the **Crew** button on a checkpoint on Receive while you're taking its calls.

- **+ Vehicle** adds a car: rego, driver, anyone else in the car, and the times. Times are exact (not 5-minute blocks), can be before the race start, and are never in the future. More than one car can go to a checkpoint.
- When an operator radios that they've arrived, tap **Arrived now** on their car. Every save, arrival and removal has Undo.
- **Return trip (left site, home safe)** is optional.
- **Reports › Crew & vehicle log** prints or exports the log. It stays on the base device and is never included in the race setup or any shared file.
- **Wording to be supplied by Brandon (WICEN)** for an operator reporting that they have left home, and that they have arrived at their checkpoint.
