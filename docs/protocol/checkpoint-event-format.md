# Checkpoint Event Format (CEF)

**Version:** 0.1 — draft for discussion
**Status:** Not adopted. Circulated to Brisbane WICEN for comment.
**Editor:** Brandon White
**Date:** 2026-08-03

## 1. Purpose

Endurance and trail events are covered by radio operators using incompatible
software over incompatible links. An operator log captured at a checkpoint today
can travel by APRS, by voice relay, by animated QR code carried back to base, or
by HTTP once the operator reaches a network — and none of those paths can feed
another group's base station, even though every one of them is moving the same
handful of facts.

This document defines those facts once, as a **record**, and defines separately
how that record is **encoded** for a given link. Agreeing the record means mesh,
DMR, APRS, LoRa and sneakernet all become interchangeable options behind the same
checkpoint software and the same base station.

It deliberately says nothing about radio, modulation, or the link layer.

## 2. Conformance

The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY are to be interpreted as
described in RFC 2119.

A conformant implementation MUST support at least one encoding profile from
§6 and MUST document which. There is no requirement to support all of them.

## 3. Non-goals

Named so that the scope of v1 is unambiguous:

- **Corrections and retractions.** See §5.3.
- **Competitor metadata** — names, divisions, ride distances, categories. The
  receiver already holds these; transmitting them spends scarce characters
  re-sending what base can look up.
- **Disqualification.** See §4.2.
- **Free-text operator notes.** On a 67-character link a note consumes the entire
  budget, and it invites unparseable prose into a machine format.
- **Queries and event metadata.** Interrogating a base station for event
  configuration is a separate problem with different constraints.
- **The link layer.** Framing, addressing, retries and acknowledgement are the
  transport's business.

## 4. The record

### 4.1 Fields

| Field | Required | Type | Description |
|---|---|---|---|
| `site` | yes | site reference | Where the event occurred. See §5.1. |
| `competitor` | yes | string | Competitor number. Alphanumeric. |
| `event` | yes | event type | See §4.2. |
| `time` | yes | instant | When the event occurred. See §5.2. |
| `reason` | no | reason code | Stop events only. See §4.3. |
| `source` | no | string | Originating operator or station identifier. |
| `relays` | no | list of string | Stations that forwarded this record. |
| `msgId` | no | integer | Sender-local message number, for operator diagnostics. |

`source`, `relays` and `msgId` are provenance: useful for troubleshooting a link
and for audit, never required to interpret the record. `msgId` is explicitly
**not** an identity for deduplication purposes — see §5.3.

### 4.2 Event types

| Type | Meaning |
|---|---|
| `SEEN` | The competitor was observed at this site. |
| `WITHDRAWN` | The competitor has retired from the event. Rider option. |
| `VET_OUT` | The competitor has been eliminated at a veterinary inspection. |
| `DNF` | The competitor did not finish. A base-station determination. |
| `NON_STARTER` | The competitor never started. |

`SEEN` is the overwhelming bulk of traffic and the encodings are optimised for it.
The remaining four are *stop events*: rare, individually more urgent than a
sighting, and the information base most needs.

`VET_OUT` is distinct from `WITHDRAWN` because the distinction is operationally
real — one is an involuntary clinical elimination, the other is the rider's
choice — and because the two require different follow-up at base.

**Local device state is not a protocol event.** Implementations typically track
states describing what an *operator's device* has done: entry pending, called in,
marked off, not yet started. These describe the progress of a record through an
operator's workflow, not anything a competitor did, and they MUST NOT be
transmitted as event types. Only the five types above describe competitors.

**Disqualification is excluded from v1.** A disqualification is a ruling issued by
event organisers, usually after the fact and away from a checkpoint. It is not a
checkpoint observation and does not travel the operator-log path. Marked as an
open question in §8.

### 4.3 Reason codes

A stop event MAY carry a reason code: a short uppercase token, no whitespace.
The vocabulary is an open question (§8); the encodings support the field so that
agreeing the vocabulary later requires no format change.

## 5. Semantics

### 5.1 Site reference

A site reference names either a **checkpoint** or a **location**, and the sender
declares which namespace it is using.

A *checkpoint* is a numbered point on the course. A *location* is a physical site
that may host more than one checkpoint — a single trackhead might serve
checkpoints 3, 8, 14 and 27 as the course passes it four times.

An RFID mat, and often a human operator, genuinely cannot know which checkpoint a
competitor is at: they observe an arrival at a site with no indication of
direction of travel or leg number. Requiring the sender to resolve this pushes
the problem to the party least able to solve it.

Receivers SHOULD resolve a location reference to a checkpoint using the
competitor's history: select the earliest checkpoint hosted at that location which
the competitor has not yet been recorded at and which is not earlier than their
last recorded checkpoint. A competitor last seen at checkpoint 24, arriving at a
location hosting 3, 8, 14 and 27, resolves to 27 — bypassed checkpoints do not
retroactively reopen.

Resolution is a SHOULD, not a MUST, so that a simple base station can conform.
A receiver that does not implement resolution MUST reject location-referenced
records rather than guess.

### 5.2 Time

All times refer to the moment of the event, not the moment of transmission.

Implementations SHOULD transmit UTC or Unix epoch. Local time is supported for
compatibility with existing field software that has no timezone concept, but is
ambiguous wherever daylight saving ends — an hour that occurs twice, during what
in New South Wales is peak endurance season.

A further hazard, observed in practice: a mobile device near a state border may
acquire network time from a tower in the adjacent state and silently shift by an
hour. Senders SHOULD therefore include their UTC offset in whatever
station-registration or configuration exchange the transport provides, so that a
receiver can detect a drifted device rather than accept hour-shifted records.
This is out of band and outside the record.

### 5.3 Identity and merge

Records may arrive more than once — relayed by a second station, transmitted by
radio and then carried back again in an operator's data dump, or hand-keyed at
base off a voice relay.

**A record is uniquely identified by the tuple (resolved checkpoint, competitor,
event type).**

This natural key costs nothing to transmit, requires no coordinated identifier
allocation between stations, and works for a record hand-keyed by an operator who
has no identifier to quote.

**On conflict, the earliest time wins.**

This is deliberately the *opposite* of the last-write-wins rule appropriate to
synchronising two copies of one device's database, and the two MUST NOT be
conflated. Database synchronisation merges edits, where the most recent edit is
the intended truth. CEF merge reconciles independent *observations* of one
physical event, where the earliest report is the one closest to the actual
arrival — a relay or a re-key can only add latency.

**Amendment and retraction are not supported in v1.** The natural key delivers
idempotency, not editability. An operator who transmits a wrong time cannot
correct it through the protocol; a human at base must fix the record. Supporting
amendment requires a sender-allocated record identifier, which costs characters
on the most constrained link for a case that is rare and already has a manual
remedy. This is a known limitation, stated rather than concealed.

## 6. Encoding profiles

A profile is a projection of the record in §4. Profiles are independent: an
implementation supporting only one is conformant.

### 6.1 APRS text

A single-line, human-readable, hand-keyable form for character-constrained links.
It extends the operator-log format devised by Stuart Longland (VK4MSL) and John
Edwards for Brisbane WICEN in 2020.

```
<site><number> T <time> <verb> <items>
```

| Element | Form |
|---|---|
| site | `CP` for checkpoint, `LC` for location. One optional space before the number. |
| number | Decimal digits. |
| time | Per §6.1.1, introduced by `T`. |
| verb | One letter per §6.1.2. |
| items | Space-separated competitor numbers; a stop event carries one number and an optional reason code. |

The encoded line MUST NOT exceed 67 characters and MUST NOT contain `{` or `}`.

#### 6.1.1 Time forms

| Form | Example | Precision |
|---|---|---|
| `@` + 6 base64 characters | `@am0qWA` | 1 second. **Canonical.** |
| `HHMM` + zone letter | `2306Z` | 1 minute |
| `HHMMSS` + zone letter | `230600Z` | 1 second |
| `HH.MM.SS` + zone letter | `23.06.00Z` | 1 second |

The `@` form is a Unix timestamp as a big-endian unsigned 32-bit integer,
base64-encoded with the standard alphabet, trailing `=` padding stripped. Six
characters, unambiguous, valid until 2106. Senders with access to a system clock
SHOULD use it.

The clock-time forms carry no date. A receiver MUST resolve them to the most
recent instant matching that clock time which is not in the future, and MUST
reject a record resolving to more than 12 hours before receipt rather than assume
a date. Senders SHOULD use the `@` form for anything that may be transmitted
significantly after the event, such as a batch carried back to base.

Zone letters are military time zones. `Z` is UTC; `J` denotes local time at the
sending station; an explicit letter such as `K` (UTC+10) is preferred over `J`
where the offset is known. Zone letters cannot express half-hour offsets, so
they are unusable in South Australia, the Northern Territory, Broken Hill and
Eucla — a further reason to prefer the `@` form.

#### 6.1.2 Verbs

| Verb | Event type |
|---|---|
| `N` | `SEEN` |
| `W` | `WITHDRAWN` |
| `V` | `VET_OUT` |
| `F` | `DNF` |
| `S` | `NON_STARTER` |

`N` retains its meaning and position from the 2020 format, so a `SEEN`
transmission is byte-identical to existing practice and costs nothing to adopt.

This choice fails safe against deployed software. The 2020 parser requires a
literal `N`, so a stop-event line does not match its grammar and is ignored
rather than silently recorded as an ordinary sighting. A parser that does not
understand `W` MUST discard the line; it MUST NOT interpret it as `SEEN`.

A `SEEN` transmission MAY carry many competitor numbers. A stop event carries
exactly one, because it may carry a reason code and because stop events are rare
enough that batching saves nothing worth the ambiguity.

#### 6.1.3 Examples

```
CP3T@am0qWAN123 234 345 456     seen at CP3, 2026-07-31T23:06:00Z
CP 3T2306ZN123 234              seen at CP3, 23:06 UTC, minute precision
LC2T@am0qWAN123 234             seen at location 2; receiver resolves checkpoint
CP3T0906KN123                   seen at CP3, 09:06 UTC+10
CP3T@am0qWAW123                 competitor 123 withdrew at CP3
CP3T@am0qggV234 LAME            competitor 234 vetted out at CP3, with reason
CP3T@am0qWAF345                 competitor 345 did not finish
CP1T@am0qWAS456                 competitor 456 never started
```

#### 6.1.4 Reference grammar

```
^(CP|LC) ?(\d+)T(\d\d\.?\d\d(?:\.?\d\d)?[A-Z]|@[0-9a-zA-Z+/]{6})([NWVFS])([ \w]+)$
```

### 6.2 JSON

Full field names, for links with headroom: HTTP, QR codes, files, local storage.
A payload is one object, or an array of objects.

```json
{
  "site": { "checkpoint": 3 },
  "competitor": "123",
  "event": "SEEN",
  "time": "2026-07-31T23:06:00Z",
  "source": "VK4BWI-14",
  "relays": ["VK4RWI-3"]
}
```

A location reference uses `{ "location": 2 }` in place of `{ "checkpoint": 3 }`.
Exactly one of the two keys MUST be present.

Times are ISO 8601 with an explicit offset. `Z` is preferred.

### 6.3 CBOR

Structurally identical to §6.2 with integer keys, for byte-constrained links that
do not share APRS's character restrictions.

| Key | Field | | Key | Field |
|---|---|---|---|---|
| 1 | `site` | | 5 | `reason` |
| 2 | `competitor` | | 6 | `source` |
| 3 | `event` | | 7 | `relays` |
| 4 | `time` | | 8 | `msgId` |

Within `site`, key `1` is checkpoint and key `2` is location. Event types are
encoded as integers 1–5 in the order listed in §4.2. Times are Unix epoch
integers.

## 7. Transport adaptations

An adaptation makes a profile carriable over a link. It is orthogonal to the
profile: any adaptation may wrap any profile whose output it can carry. This
separation is the point of the document — it is what allows a record to change
links without changing meaning.

### 7.1 Quoted-printable escaping for APRS

APRS text messages permit roughly 67 characters and forbid `{` and `}`, which
rules out raw JSON and both base64 variants of a binary payload. Stuart
Longland's approach, which works for carrying §6.2 or §6.3 payloads:

1. Encode the payload with quoted-printable.
2. Replace `{`, `}`, CR and TAB with their `=XX` hexadecimal escapes.
3. Strip quoted-printable soft line wrapping (`=\n`).

The result decodes with any standard quoted-printable library.

Note that §6.1 needs no adaptation — it is designed to be transmitted directly.

### 7.2 Compressed fountain-coded QR

For handing a checkpoint's records to a base station with no network, by carrying
a device to base and displaying codes to a camera:

1. Serialise as §6.2.
2. Compress with gzip.
3. Base64url-encode. Payloads below roughly 2 KB fit a single static QR code.
4. Above that, fountain-code into fixed-size blocks displayed as an animated
   sequence. Fountain coding means the receiver need not capture blocks in order
   or in a single pass.

RaceTracker Pro implements this with 800-byte blocks. A 500-competitor dump
compresses to roughly 8–10 KB, around a dozen blocks, captured in a few seconds.
Incremental transfers carrying only changes since the last handoff usually fall
under the single-code threshold.

## 8. Open questions

1. **Reason code vocabulary.** `LAME`, `METABOLIC`, `RIDER_OPTION`, `OVERTIME`?
   Needs input from people who have run vet checks, not from a software author.
2. **`VET_OUT` versus `WITHDRAWN`.** Does this distinction, and this naming,
   match AERA usage? The model should follow the sport's vocabulary.
3. **Disqualification.** Excluded per §4.2 on the grounds that it is an
   organiser's ruling rather than a checkpoint observation. Should it be a sixth
   event type?
4. **Start events.** A competitor starting is arguably a `SEEN` at checkpoint 0,
   or arguably its own event type. Existing practice varies.
5. **Zero as a checkpoint number.** Some implementations use checkpoint 0 to mean
   base or finish. Should the format reserve it?

## 9. Test vectors

For checking an implementation against another. All times UTC.

| Encoded | Site | Competitors | Event | Time |
|---|---|---|---|---|
| `CP3T@am0qWAN123 234 345 456` | checkpoint 3 | 123, 234, 345, 456 | `SEEN` | 2026-07-31T23:06:00Z |
| `CP 3T2306ZN123` | checkpoint 3 | 123 | `SEEN` | 23:06:00Z, date from context |
| `LC2T@am0qWAN123` | location 2 | 123 | `SEEN` | 2026-07-31T23:06:00Z |
| `CP3T@am0qggV234 LAME` | checkpoint 3 | 234 | `VET_OUT`, reason `LAME` | 2026-07-31T23:06:42Z |
| `CP3T0906KN123` | checkpoint 3 | 123 | `SEEN` | 23:06:00Z (09:06 UTC+10) |

Epoch conversions, for checking a base64 time implementation:

| ISO 8601 | Unix epoch | `@` form |
|---|---|---|
| 2026-07-31T23:06:00Z | 1785539160 | `@am0qWA` |
| 2026-07-31T23:06:42Z | 1785539202 | `@am0qgg` |

## 10. Acknowledgements

The APRS operator-log format in §6.1 and the quoted-printable adaptation in §7.1
are Stuart Longland's (VK4MSL) work, with John Edwards; the multi-checkpoint
location resolution in §5.1 derives from Stuart's server implementation and
Peter's (VK4YPB) database work for Brisbane WICEN. This document generalises
them rather than replacing them.
