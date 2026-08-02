const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || "/data";
const UPLOAD_TOKEN = process.env.UPLOAD_TOKEN || "";

const STATE_FILE = path.join(DATA_DIR, "state.json");
const ASSET_DIR = path.join(DATA_DIR, "assets");

const ASSETS = {
  "index.html": { type: "text/html; charset=utf-8", cache: "no-cache" },
  "manifest.json": { type: "application/manifest+json; charset=utf-8", cache: "public, max-age=86400" },
  "icon.png": { type: "image/png", cache: "public, max-age=604800" }
};

let store = { rev: 0, state: {}, updatedAt: null };

function ensureDirs() {
  try {
    fs.mkdirSync(ASSET_DIR, { recursive: true });
  } catch (e) {
    console.error("mkdir failed:", e.message);
  }
}

function loadState() {
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    if (parsed && typeof parsed === "object") {
      store = {
        rev: Number(parsed.rev) || 0,
        state: parsed.state && typeof parsed.state === "object" ? parsed.state : {},
        updatedAt: parsed.updatedAt || null
      };
    }
  } catch (e) {}
}

function persistState() {
  try {
    ensureDirs();
    const tmp = STATE_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(store));
    fs.renameSync(tmp, STATE_FILE);
  } catch (e) {
    console.error("persist failed:", e.message);
  }
}

function assetPath(name) {
  return path.join(ASSET_DIR, name);
}

function hasAsset(name) {
  try {
    return fs.statSync(assetPath(name)).size > 0;
  } catch (e) {
    return false;
  }
}

ensureDirs();
loadState();

app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(express.text({ limit: "5mb", type: ["text/*", "application/manifest+json"] }));
app.use(express.raw({ limit: "5mb", type: ["image/*", "application/octet-stream"] }));

app.get("/api/state", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ rev: store.rev, state: store.state, updatedAt: store.updatedAt });
});

app.post("/api/state", (req, res) => {
  const incoming = req.body && req.body.state;
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return res.status(400).json({ error: "invalid state" });
  }
  const clean = {};
  for (const k of Object.keys(incoming)) {
    if (k.length > 120) continue;
    if (incoming[k]) clean[k] = true;
  }
  store.rev += 1;
  store.state = clean;
  store.updatedAt = new Date().toISOString();
  persistState();
  res.json({ ok: true, rev: store.rev, count: Object.keys(clean).length });
});

app.get("/api/health", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({
    ok: true,
    rev: store.rev,
    done: Object.keys(store.state).length,
    assets: Object.keys(ASSETS).filter(hasAsset)
  });
});

app.put("/api/asset/:name", (req, res) => {
  const name = req.params.name;
  if (!UPLOAD_TOKEN || req.get("x-upload-token") !== UPLOAD_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!Object.prototype.hasOwnProperty.call(ASSETS, name)) {
    return res.status(400).json({ error: "unknown asset" });
  }
  const body = req.body;
  const buf = Buffer.isBuffer(body) ? body : typeof body === "string" ? Buffer.from(body, "utf8") : null;
  if (!buf || !buf.length) return res.status(400).json({ error: "empty body" });
  try {
    ensureDirs();
    const target = assetPath(name);
    fs.writeFileSync(target + ".tmp", buf);
    fs.renameSync(target + ".tmp", target);
    res.json({ ok: true, name, bytes: buf.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function serveAsset(name, res, next) {
  const meta = ASSETS[name];
  if (!hasAsset(name)) return next();
  res.set("Content-Type", meta.type);
  res.set("Cache-Control", meta.cache);
  fs.createReadStream(assetPath(name)).pipe(res);
}

app.get("/manifest.json", (req, res, next) => serveAsset("manifest.json", res, next));
app.get("/icon.png", (req, res, next) => serveAsset("icon.png", res, next));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  serveAsset("index.html", res, () => {
    res.set("Cache-Control", "no-store");
    res
      .status(503)
      .type("html")
      .send(
        '<!doctype html><html lang="sk"><head><meta charset="utf-8">' +
          '<meta name="viewport" content="width=device-width,initial-scale=1">' +
          "<title>Tréningový plán</title></head>" +
          '<body style="margin:0;background:#0e1116;color:#e6edf3;font:16px/1.5 system-ui,sans-serif;' +
          'display:flex;align-items:center;justify-content:center;height:100vh;text-align:center">' +
          "<div><h1 style=\"font-size:19px;margin:0 0 8px\">Plán sa ešte nenahral</h1>" +
          '<p style="color:#93a1b0;font-size:14px;margin:0">Obsah nie je na disku. Nahraj ho cez /api/asset/index.html</p>' +
          "</div></body></html>"
      );
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("trening beží na porte " + PORT + ", data: " + DATA_DIR);
});
