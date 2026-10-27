# Implementation specification · version 4

> v4 (Oct 2026): link-only joining, 200 participants, linear story that feels branching (linked doors, same clues), images per step, one real final decision with three endings. Sections marked v4 supersede the original contract; other v1 text is kept where still accurate.

## Provenance and product contract

Confirmed requirements: title **Silence on the Persephone**, English event, approximately 20 minutes, up to 100 participants, five votes, three visual puzzles, three endings, self-hosted VPS, `/control`, `/screen`, `/join`, realtime updates, Docker Compose and Nginx/HTTPS. The retrieved conversation contains no readable prior assistant scenario. Characters, puzzle content and plot below are newly authored implementation decisions, not recovered quotations.

The host shares a presentation in a meeting and narrates live. Participants vote from phones or laptops. The event clock is advisory: it never advances a scene automatically. The host controls pacing; vote deadlines are authoritative on the server. Joining should happen in a pre-show lobby before the 20-minute story starts.

## Scope and experience

All application copy and story content are English. Documentation for the Polish operator's VPS deployment is Polish. No participant names, email, login, microphone, camera, chat, ranking, gore, flashing lights or surprise sounds. No audio is needed. There is no QR dependency; the join address and mission code are shown as text. A screen at 1920×1080 and a phone viewport of 390×844 are reference layouts. Fullscreen is entered by a user click. Content can scroll on smaller screens.

- `/`: illustrated mission landing page and routes.
- `/control`: password login; private script and correct puzzle answer; current scene, live aggregate counts, participant count, mission code, clock, duration selector (30/45/60/90 seconds), next/open/close/pause/resume/hint/reset, presentation link, sign out.
- `/screen`: public, read-only current scene, visual clue, open choices, timer, submitted-count indicator, join URL/code, revealed result. No future story, correct answer or private notes before reveal.
- `/join`: mission-code admission, current scene and accessible evidence, voting buttons, acknowledgement of current accepted vote, timer, results, reconnect status.

The three visuals are deterministic HTML/SVG. They remain crisp on a projector and have textual equivalents for assistive technology. Meaning is never encoded by color alone. Touch targets are at least 48px high, focus is visible, and forms have labels.

## Story model and scene sequence (v4)

Lobby → Intro → Doors 1 (4 options) → Doors 2 (2 options of the other linked pair) → Canteen (2) → Path (2) → Final (3) → Ending with recap. Linked doors: Medical ↔ Radio, Hangar ↔ Captain; opening one seals the partner. All non-final choices lead to the same four clues with different narration and an ORPHEUS comment. Each step has an image from `public/img/` (served from a whitelist). Content lives in `story.mjs`.

## Branch logic (v4)

Ending = final winner: destroy, quarantine or link. Any tie (or no votes) in the final vote selects quarantine. In other votes a tie selects the first tied option.

## Voting rules

One vote per browser per step, last accepted choice counts, plurality. Options of a step are fixed when the vote opens (Doors 2 depends on Doors 1). Results are public after closure; the host sees live counts. Joining requires only the link, at any time, capped at `MAX_PARTICIPANTS` (default 200). The host browser cannot join as a participant. A state file from an older schema is archived and a fresh mission starts.

## State machine and persistence

Scene index is monotonically forward within a run. A scene with a poll cannot advance until its poll is closed. Poll: `ready → open → closed`. Mission pause overlays the state: no votes, advance, open or close while paused. Resume restores the remaining vote time. Hint reveal is independent. Reset requires typed confirmation and starts a fresh run/code, archives the previous state and requires participants to rejoin.

Every accepted mutation is synchronously serialized by one Node process, written to a temporary file, fsynced and atomically renamed before acknowledgement. State includes run ID, schema version, revision, control stage, scene, timestamps, pause duration, members, polls, votes, outcomes, bounded audit, and recent command IDs. No sensitive environment secrets are stored in state.

Crash recovery loads the last durable state. An active mission resumes paused; an already-paused poll retains its remaining time across repeat restarts. The host must resume. A power loss may reduce an active poll's recoverable remaining time to zero; after resume it closes normally. Corrupt or unsupported state fails startup rather than silently creating a new mission. Single-writer operation is mandatory; no horizontal replicas or NFS data sharing. Backups must be taken with the app stopped.

## API contract

| Route | Method | Access / behavior |
|---|---|---|
| `/healthz` | GET | Process readiness after state initialization |
| `/api/state` | GET | Current projected state; extra notes only for host |
| `/api/events` | GET | SSE full-state snapshots, immediate snapshot, 15-second heartbeat |
| `/api/login` | POST | `{password}` → signed host cookie |
| `/api/logout` | POST | Clears current browser's cookie |
| `/api/join` | POST | `{code}` → signed participant cookie; admits browser |
| `/api/vote` | POST | `{run,pollId,option}` → accepted projected state |
| `/api/control` | POST | `{action,run,stage,commandId,seconds?,confirm?}` → new host state |

Commands use a unique UUID and expected control stage. Repeating a committed command ID returns current state without repeating its effect. Votes do not invalidate a control stage; control transitions do. Stale stages return 409. Client state snapshots have monotonically increasing revisions within a run; clients discard older snapshots. SSE reconnect receives a full snapshot, so replaying event history is unnecessary. An HTTP state refresh runs every five seconds and when a background tab returns. SSE connection ceiling: 250; supports 100 participants plus host/display connections with margin.

Errors: 400 invalid input, 401 missing credentials, 403 wrong Origin, 409 illegal state/cap reached, 413 payload too large, 429 limited attempts, 503 connection ceiling. No raw server errors or secrets in public responses. A fatal storage failure stops the process to avoid continued play against uncommitted state.

## Security and deployment

Host password: at least 12 characters; recommend random 24+ bytes. Cookie HMAC secret: at least 32 characters; recommend random 48 bytes. Cookies: HttpOnly, SameSite=Strict, 12-hour expiry, Secure when PUBLIC_URL is HTTPS. Serve one exact configured origin. Every state-changing request must carry the matching Origin. Secrets stay in environment/.env, never frontend code. Rate limits protect login and join; proxy clients share the upstream network bucket, so limits are sized for the company cohort. Public mission code is admission convenience, not a secret.

Nginx buffers neither SSE nor API responses; app sends no-store. Cloudflare must bypass caching and interactive challenges for this hostname. The tunnel reaches Nginx on the internal Compose network. App port is not published. Nginx is bound to host loopback for diagnosis. Do not deploy publicly without HTTPS. Rotate both host password and cookie secret to invalidate all existing cookies. Signing out clears the current browser; it is not a global token revocation system.

Retain data only as long as needed for rehearsal/event review. Reset archives include anonymous ballot identifiers. Delete old archives after the event. No analytics or external fonts are included. Back up state and deployment secrets separately. No automatic production migration or deployment is performed by the application.

## Acceptance criteria

| ID | Acceptance test |
|---|---|
| AC01 | All three routes load and show English UI; host script is absent from public state. |
| AC02 | 100 browser identities can join; the 101st is refused without displacing anyone. |
| AC03 | 100 concurrent votes produce exactly 100 ballots; changing a vote never increases that count. |
| AC04 | Correct timeline, topology and recorder solutions are Vale, R7 and Track B. |
| AC05 | Exactly five polls are completed before an ending; all 162 result paths resolve. |
| AC06 | Tie and zero-vote resolution consistently choose the first tied listed option. |
| AC07 | Expired, paused, invalid-option, old-run and unauthenticated votes are rejected. |
| AC08 | Pause/resume freezes timers; refresh and restart preserve accepted votes. |
| AC09 | Restart pauses a mission; restarting an already paused vote does not erase remaining time. |
| AC10 | Duplicate commands execute once; stale control pages cannot advance the wrong scene. |
| AC11 | Reconnecting clients receive current state; loss of SSE has a five-second HTTP fallback. |
| AC12 | No future answer or host script appears in a participant payload; host routes reject anonymous commands. |
| AC13 | Docker healthcheck passes, volume survives recreation, Nginx passes SSE without buffering. |
| AC14 | On the actual VPS, 100 participant streams plus host/display remain usable for 25 minutes; 95% of acknowledged vote updates arrive within 1 second on a healthy network. |
| AC15 | Rehearsal fits the 20-minute running order, without rushing visual evidence. |
| AC16 | Production HTTPS certificate is valid for halloween.konradkowalczyk.com; join works over mobile data and company Wi-Fi. |

Automated local checks cover the core state/API rules. Actual VPS load, TLS, DNS, mobile Safari and meeting-screen readability require deployment/rehearsal checks; they are not implied by local tests.
