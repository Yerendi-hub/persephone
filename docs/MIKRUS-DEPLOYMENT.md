# Wdrożenie na Mikrusa — halloween.konradkowalczyk.com

Ten sam wzorzec co `sprawozdania.konradkowalczyk.com`: domena przypisana w panelu Mikrusa do portu,
proxy Mikrusa daje HTTPS, bez Cloudflare Tunnel i bez własnego Caddy.

```
telefon / ekran / prowadzący
  → https://halloween.konradkowalczyk.com  (proxy Mikrusa, HTTPS)
  → port 8081 na Mikrusie  → kontener nginx:80  → kontener app:3000  → wolumen mission-data
```

- Wejście (`/`, `/join`) jest otwarte — kto ma link `/join`, dołącza automatycznie, także w trakcie gry. Limit 200 przeglądarek (zmienna `MAX_PARTICIPANTS`).
- Na dole strony głównej jest link **HOST LOGIN** → `/control`, tam hasło `HOST_PASSWORD`.
- `/screen` (prezentacja z linkiem do dołączenia) też wymaga zalogowania prowadzącego — otwierasz ją w tej samej przeglądarce co `/control`.
- **Port 8080 jest zajęty przez sprawozdania UJ** — Halloween używa 8081 (lub innego wolnego).

## 0. Na Windowsie — spakuj i wyślij projekt

```powershell
$MikrusHost = 'srvXX.mikr.us'     # z panelu Mikrusa (to samo co przy UJ)
$MikrusPort = 10XXX               # port SSH z panelu
Set-Location 'H:\Projekty\Space Opera Praca'
tar -czf "$env:TEMP\persephone.tar.gz" --exclude=.env --exclude=data --exclude=backups --exclude=_przed-audytem --exclude=_wersja-notatki --exclude=_wersja-tropy --exclude=node_modules .
scp -P $MikrusPort "$env:TEMP\persephone.tar.gz" "root@${MikrusHost}:/tmp/persephone.tar.gz"
ssh -p $MikrusPort "root@$MikrusHost"
```

## 1. Na serwerze — sprawdzenie

```bash
docker compose version          # musi działać (działa już dla UJ)
free -h                         # ok. 300 MB wolnego RAM wystarczy
ss -tlnp | grep ':8081 '        # pusty wynik = port wolny; inaczej wybierz inny
```

## 2. Rozpakowanie i `.env`

```bash
mkdir -p ~/persephone && tar -xzf /tmp/persephone.tar.gz -C ~/persephone && cd ~/persephone
cp .env.example .env && chmod 600 .env
openssl rand -hex 12     # → HOST_PASSWORD (hasło prowadzącego, zapisz w menedżerze haseł)
openssl rand -hex 48     # → COOKIE_SECRET
nano .env
```

| Zmienna | Wartość na Mikrusie |
| --- | --- |
| `PUBLIC_URL` | `https://halloween.konradkowalczyk.com` (dokładnie tak, bez `/` na końcu) |
| `HOST_PASSWORD` | wynik pierwszego `openssl` (min. 12 znaków) |
| `COOKIE_SECRET` | wynik drugiego `openssl` |
| `HTTP_PUBLISH` | `8081` (sam numer portu, bez `127.0.0.1:` — jak `APP_PUBLISH` w UJ) |

## 3. Uruchomienie

```bash
docker compose up -d --build
docker compose ps                              # app: healthy, nginx: Up, 0.0.0.0:8081->80
curl -s http://localhost:8081/healthz          # {"ok":true}
```

## 4. Domena

W panelu Mikrusa przypisz `halloween.konradkowalczyk.com` do portu `8081` i ustaw rekord DNS, który pokaże panel
(tak samo jak dla `sprawozdania`). Potem:

```bash
curl -s https://halloween.konradkowalczyk.com/healthz
curl -N --max-time 20 https://halloween.konradkowalczyk.com/api/events
```

Drugie polecenie powinno **od razu** wypisać linię `data: {...}`. Jeśli pojawia się dopiero po ~20 s, proxy Mikrusa
buforuje SSE — aplikacja nadal działa (co 5 s odpytuje serwer), ale timer i wyniki będą się odświeżać z opóźnieniem do 5 s.

Test w przeglądarce: `https://halloween.konradkowalczyk.com` → link **HOST LOGIN** na dole → hasło → **Presentation ↗**
otwiera ekran prezentacji. Na telefonie (przez dane komórkowe) wejdź na `/join` — od razu jesteś w grze.

## Obsługa

| Co | Polecenie (w `~/persephone`) |
| --- | --- |
| Aktualizacja kodu | wyślij nowy tar jak w kroku 0, `tar -xzf /tmp/persephone.tar.gz -C ~/persephone`, potem `docker compose up -d --build` |
| Logi | `docker compose logs -f --tail=200 app` |
| Zmiana hasła prowadzącego | edytuj `.env`, potem `docker compose up -d --force-recreate app` |
| Nowa misja po próbie | w `/control`: **New mission / reset** → wpisz `RESET` (stara misja jest archiwizowana) |
| Kopia stanu | `docker compose stop app && docker compose cp app:/app/data/. ~/persephone-backup-$(date +%F)/ && docker compose start app` |
| Wyłączenie po Halloween | `docker compose down` (stan zostaje w wolumenie; `down -v` usuwa go na zawsze) |
| Miejsce po buildach | `docker image prune -f && docker builder prune -f` |

Kontenery mają `restart: unless-stopped`. Po restarcie aplikacja wstaje z **zapauzowaną** misją — prowadzący klika **Resume**.

## Gdy coś nie działa

| Objaw | Co sprawdzić |
| --- | --- |
| 502 przez domenę | `docker compose ps`; `ss -tlnp \| grep 8081` musi pokazać `0.0.0.0`/`*`, nie `127.0.0.1` → popraw `HTTP_PUBLISH=8081`, `docker compose up -d` |
| „Origin mismatch” przy logowaniu/głosie | `PUBLIC_URL` musi być identyczny z adresem w pasku przeglądarki; po zmianie `docker compose up -d --force-recreate app` |
| Poprawne hasło, a wraca ekran logowania | wchodzisz po `http://` — ciasteczko jest `Secure`, używaj `https://` |
| Aplikacja nie startuje: „Set HOST_PASSWORD…” | hasło < 12 znaków lub `COOKIE_SECRET` < 32 znaków |
| 201. osoba nie może dołączyć | limit 200 przeglądarek na misję (liczą się też te z próby) — przed eventem zrób reset |

## Dzień wydarzenia

- **Ważne:** host i uczestnik w tej samej przeglądarce się wykluczają — głosowanie testuj w oknie prywatnym lub na telefonie.
- Pełna próba wcześniej (pauza, restart, jedno zakończenie), potem **reset** (czyści uczestników z próby).
- Udostępniaj tylko okno `/screen`, nigdy `/control`.
- Nie aktualizuj ani nie restartuj serwera w trakcie głosowania.
