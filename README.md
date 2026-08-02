# Tréningový plán — Maratón pod 4:00

PWA s tréningovým plánom + Express backend, ktorý ukladá odškrtnuté tréningy na server. Stav sa synchronizuje medzi mobilom a počítačom.

Beží na Railway: https://trening-production-c429.up.railway.app

## Ako to funguje

Obsah stránky (`index.html`, `icon.png`) je v repe uložený komprimovane a rozdelený na časti v `assets/` — GitHub API neprenesie veľký súbor v jednom kuse spoľahlivo. Pri štarte `seed.js` časti spojí, rozbalí a zapíše na persistent volume do `/data/assets`. Ak sa obsah v repe nezmenil, seed sa preskočí a neprebíja prípadný upload.

Odškrtnutia sa ukladajú do `/data/state.json`. Klient píše do localStorage okamžite a na server debounce-om po 600 ms; pri načítaní stránky, pri návrate na tab a každých 60 s si stav ťahá zo servera.

## API

| Endpoint | Popis |
|---|---|
| `GET /api/state` | `{ rev, state, updatedAt }` |
| `POST /api/state` | telo `{ state: { "<id>": true } }` |
| `GET /api/health` | stav servera + nahrané assety |
| `PUT /api/asset/:name` | nahratie obsahu, hlavička `x-upload-token` |
| `GET /upload` | formulár na nahratie `index.html`, `icon.png`, `manifest.json` |

## Env premenné

- `PORT` — nastaví Railway
- `DATA_DIR` — default `/data`
- `UPLOAD_TOKEN` — token pre upload obsahu

## Lokálne

```
npm install
DATA_DIR=./.localdata UPLOAD_TOKEN=dev npm start
```
