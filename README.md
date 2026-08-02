# Tréningový plán — Maratón pod 4:00

Express server, ktorý servíruje tréningový plán (PWA) a ukladá odškrtnuté tréningy na server, takže sa stav synchronizuje medzi mobilom a počítačom.

Obsah stránky (`index.html`, `icon.png`, `manifest.json`) nie je v repe — leží na persistent volume Railway v `/data/assets` a nahráva sa cez chránený endpoint. Kód a obsah sa tak dajú meniť nezávisle.

## API

| Endpoint | Popis |
|---|---|
| `GET /api/state` | `{ rev, state, updatedAt }` — odškrtnuté tréningy |
| `POST /api/state` | telo `{ state: { "<id>": true } }` → uloží a vráti nový `rev` |
| `GET /api/health` | stav servera + zoznam nahraných assetov |
| `PUT /api/asset/:name` | nahratie obsahu, hlavička `x-upload-token`; povolené: `index.html`, `icon.png`, `manifest.json` |

## Env premenné

- `PORT` — port (Railway nastaví sám)
- `DATA_DIR` — kde sa ukladajú dáta, default `/data`
- `UPLOAD_TOKEN` — token pre `PUT /api/asset/:name`

## Nahratie obsahu

```
curl -X PUT https://<domena>/api/asset/index.html \
  -H "x-upload-token: $UPLOAD_TOKEN" \
  -H "Content-Type: text/html" \
  --data-binary @index.html
```

## Lokálne

```
npm install
DATA_DIR=./.localdata UPLOAD_TOKEN=dev npm start
```
