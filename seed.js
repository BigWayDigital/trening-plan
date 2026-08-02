const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");

const DATA_DIR = process.env.DATA_DIR || "/data";
const ASSET_DIR = path.join(DATA_DIR, "assets");
const SEED_DIR = path.join(__dirname, "assets");

const MANIFEST = {
  name: "Maratón pod 4:00",
  short_name: "3:55",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#0e1116",
  theme_color: "#0e1116",
  orientation: "portrait",
  icons: [
    { src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "maskable" }
  ]
};

function joinParts(prefix) {
  let files;
  try {
    files = fs.readdirSync(SEED_DIR);
  } catch (e) {
    return null;
  }
  const parts = files.filter(f => f.startsWith(prefix + ".")).sort();
  if (!parts.length) return null;
  return parts.map(f => fs.readFileSync(path.join(SEED_DIR, f), "utf8").trim()).join("");
}

function md5(buf) {
  return crypto.createHash("md5").update(buf).digest("hex");
}

function seed(name, buf) {
  const target = path.join(ASSET_DIR, name);
  const marker = path.join(ASSET_DIR, "." + name + ".seed");
  const hash = md5(buf);
  let previous = null;
  try {
    previous = fs.readFileSync(marker, "utf8").trim();
  } catch (e) {}
  if (fs.existsSync(target) && previous === hash) {
    console.log("seed: " + name + " je aktuálny, preskakujem");
    return;
  }
  fs.writeFileSync(target + ".tmp", buf);
  fs.renameSync(target + ".tmp", target);
  fs.writeFileSync(marker, hash);
  console.log("seed: " + name + " zapísaný (" + buf.length + " B)");
}

try {
  fs.mkdirSync(ASSET_DIR, { recursive: true });

  const b64 = joinParts("index.html.br.b64");
  if (b64) {
    seed("index.html", zlib.brotliDecompressSync(Buffer.from(b64, "base64")));
  } else {
    console.log("seed: chýbajú časti index.html, preskakujem");
  }

  const iconB64 = joinParts("icon.png.b64");
  if (iconB64) seed("icon.png", Buffer.from(iconB64, "base64"));

  seed("manifest.json", Buffer.from(JSON.stringify(MANIFEST, null, 2), "utf8"));
} catch (e) {
  console.error("seed zlyhal:", e.message);
}
