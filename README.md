# Silence on the Persephone

A self-hosted, English-language, 20-minute interactive science-fiction detective horror for up to 200 participants. The room guides a robot through the silent ship by voting on every step, while the ship's AI explains away every clue. Only the final vote changes the ending (three endings).

## Start here

- [Full specification and acceptance criteria](docs/SPECIFICATION.md)
- [English host script and 20-minute running order](docs/HOST-SCRIPT.md)
- [Mikrus deployment, HTTPS and halloween.konradkowalczyk.com](docs/MIKRUS-DEPLOYMENT.md) — operational instructions in Polish.
- [Verification report](docs/VERIFICATION.md)

## Local development (PowerShell)

Install a supported Node.js LTS (production container uses Node 24). No npm packages need installing. From this directory:

```powershell
$env:HOST_PASSWORD = Read-Host 'Choose a host password of at least 12 characters'
$bytes = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$env:COOKIE_SECRET = [Convert]::ToBase64String($bytes)  # works in Windows PowerShell 5.1 and PowerShell 7
$env:PUBLIC_URL = 'http://localhost:3000'
node server.mjs
```

Open http://localhost:3000. Use `/control` for the host, `/screen` for the shared presentation (host login required), and `/join` in another browser or private window for a participant. The host and participant roles use the same cookie name, so keep them in separate browser profiles. On phones, use the deployed HTTPS URL; `localhost` refers to the phone itself. Local HTTP on an arbitrary LAN IP is not the supported production setup.

```powershell
node --test test/app.test.mjs
```

For local Compose, copy `.env.example` to `.env`, fill the two secrets, and set `PUBLIC_URL=http://localhost:8080`. Run `docker compose up -d --build`; open http://localhost:8080. For public hosting, follow the deployment guide instead.

The application does not read `.env` directly. Docker Compose reads it; direct Node runs use environment variables (or Node's `--env-file=.env` option). Never use a production password over public HTTP.

## Operator quick start

1. On the home page use **HOST LOGIN** at the bottom (or go to `/control`) and sign in. Open `/screen` in a separate window of the same browser (it also requires the host login) and share only that window.
2. Show the join URL (on `/screen`). Anyone opening `/join` joins automatically — no code, also mid-game. Limit: 200 browsers (`MAX_PARTICIPANTS`).
3. Press **Start mission**, narrate, then **Next scene**.
4. For each decision, discuss the evidence, choose a duration, and **Open vote**. Results reveal when the deadline expires or you press **Close vote now**.
5. Read the explanation and move on. **Pause mission** freezes an open vote; **Resume** continues it.
6. After vote 5, press **Next scene** to reveal the ending. To rehearse again, open **New mission / reset**, type `RESET`, and reset. The old state is archived.

## Technical shape

Browser → Mikrus domain proxy (HTTPS) → Nginx → one Node process → durable JSON state.

Realtime uses server-sent events (SSE) and HTTP POST commands, with a five-second snapshot fallback. No database service, CDN assets, accounts, cloud AI, paid voting service, or runtime package dependencies are required. Run exactly one app replica against the data volume. This is a casual company event, not an identity-verified election: clearing browser cookies or using another browser can create another participant.

The implementation and newly authored story are complete locally. It does not imply that the VPS or DNS has been configured. The older conversation exposed user requirements but not the previous assistant's full story; this story is an original proposed reconstruction.
