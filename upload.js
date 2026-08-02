const PAGE = `<!doctype html>
<html lang="sk"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nahratie obsahu</title>
<style>
body{margin:0;background:#0e1116;color:#e6edf3;font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:24px}
.w{max-width:520px;margin:0 auto}
h1{font-size:20px;margin:0 0 4px;letter-spacing:-.02em}
p.l{color:#93a1b0;font-size:13px;margin:0 0 20px}
label{display:block;font-size:12px;color:#93a1b0;margin:14px 0 6px;text-transform:uppercase;letter-spacing:.06em}
input{width:100%;background:#161b22;border:1px solid #323d4d;color:#e6edf3;border-radius:10px;padding:11px 12px;font:inherit}
button{margin-top:18px;width:100%;background:#4da3ff;border:0;color:#04101f;padding:13px;border-radius:10px;font-weight:700;font-size:15px;cursor:pointer}
button:disabled{opacity:.5}
#o{margin-top:16px;font-size:13px;white-space:pre-wrap;color:#4ade80}
#o.err{color:#f87171}
a{color:#4da3ff}
</style></head>
<body><div class="w">
<h1>Nahratie obsahu</h1>
<p class="l">Nahraj index.html, prípadne icon.png alebo manifest.json. Prepíše sa iba to, čo vyberieš.</p>
<label>Upload token</label>
<input id="t" type="password" placeholder="UPLOAD_TOKEN" autocomplete="off">
<label>index.html</label>
<input id="f1" type="file" accept=".html,text/html">
<label>icon.png</label>
<input id="f2" type="file" accept="image/png">
<label>manifest.json</label>
<input id="f3" type="file" accept=".json,application/json">
<button id="b">Nahrať</button>
<div id="o"></div>
<p class="l" style="margin-top:20px"><a href="/">← späť na plán</a></p>
</div>
<script>
const $=i=>document.getElementById(i);
const MAP=[["f1","index.html","text/html"],["f2","icon.png","image/png"],["f3","manifest.json","application/manifest+json"]];
$("b").onclick=async()=>{
  const tok=$("t").value.trim();
  const out=$("o"); out.className=""; out.textContent="";
  if(!tok){ out.className="err"; out.textContent="Chýba token."; return; }
  const jobs=MAP.filter(m=>$(m[0]).files[0]);
  if(!jobs.length){ out.className="err"; out.textContent="Nevybral si žiadny súbor."; return; }
  $("b").disabled=true;
  const lines=[];
  for(const [id,name,type] of jobs){
    const file=$(id).files[0];
    try{
      const buf=await file.arrayBuffer();
      const r=await fetch("/api/asset/"+name,{method:"PUT",headers:{"x-upload-token":tok,"Content-Type":type},body:buf});
      const d=await r.json();
      lines.push(r.ok?(name+" ✓ "+d.bytes+" B"):(name+" ✗ "+(d.error||r.status)));
    }catch(e){ lines.push(name+" ✗ "+e.message); }
  }
  out.className=lines.some(l=>l.includes("✗"))?"err":"";
  out.textContent=lines.join("\\n");
  $("b").disabled=false;
};
</script></body></html>`;

module.exports = PAGE;
