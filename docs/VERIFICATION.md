# Verification report

Date: 27 October 2026. Local Windows environment, Node.js 20.17.0. Production Dockerfile selects Node.js 24.

## Passed

- Five automated integration/domain tests, all passing.
- Full mission through all five votes and safe rescue ending.
- Vote replacement, anonymous projection, absence of private answers before reveal.
- Wrong password, wrong Origin, unauthorized control, stale run/control stage and invalid choices rejected.
- Idempotent commands, pause/resume, repeated restart preserving paused time, archive/reset.
- 100 concurrent participants, refusal of participant 101, exact 50/50 tally and deterministic tie.
- 102 simultaneously open local SSE streams during 100 vote submissions; submissions completed in approximately 464 ms on this development machine. This is a local batch measurement, not end-user latency or a Mikrus benchmark.
- Server deadline enforcement and all 162 final decision combinations.
- JavaScript syntax checks and `docker compose --profile tunnel config --quiet`.
- Browser inspection: landing page, host login, start/advance, visual ledger, opening a poll and realtime display in another tab. Text contrast for read-only choices was adjusted after visual inspection.

## Still to verify on deployment

- Container build/start and Nginx runtime: local Docker Engine is not running, so only Compose configuration was validated.
- Node 24 container execution: local automated tests used the installed Node 20 runtime.
- Actual Mikrus memory/CPU limits, storage durability under host power loss, 25-minute sustained load and target p95 latency.
- Public DNS, TLS, Cloudflare Tunnel, corporate Wi-Fi and mobile data reachability.
- Full rehearsal at presentation resolution; physical iOS/Android devices and assistive technologies.

No production secrets, SSH credentials, DNS changes or public deployment were created. Use `README.md` and `MIKRUS-DEPLOYMENT.md` to complete deployment and rehearsal.
