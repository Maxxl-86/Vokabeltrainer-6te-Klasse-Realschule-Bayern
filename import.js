import { Utils } from './utils.js';

const fileInp = document.getElementById('fileInp');
const mergeBtn = document.getElementById('mergeBtn');
const log = document.getElementById('log');
let incoming = null;

fileInp.addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if(!f) return;
  const text = await f.text();
  if(f.name.endsWith('.json')){
    try { incoming = JSON.parse(text); log.textContent = 'JSON geladen: ' + f.name; }
    catch(err){ log.textContent = 'Fehler beim JSON‑Parsing: ' + err.message; incoming = null; }
  } else {
    incoming = Utils.parseCSV(text);
    log.textContent = 'CSV geladen: ' + f.name + ` (Einträge: ${incoming.length})`;
  }
  mergeBtn.disabled = !incoming;
});

mergeBtn.addEventListener('click', async () => {
  const resp = await fetch('vocab/vocab.json');
  const base = await resp.json();
  const units = base.units;
  const added = [];
  const byKey = new Set();
  for(const [uid, list] of Object.entries(units)){
    list.forEach(w => byKey.add((w.en||'').toLowerCase()));
  }
  const arr = Array.isArray(incoming) ? incoming : (incoming.units ? Object.values(incoming.units).flat() : []);
  arr.forEach(item => {
    const key = (item.en||'').toLowerCase();
    if(!key || byKey.has(key)) return;
    const unit = item.unit || 'uX';
    if(!units[unit]) units[unit] = [];
    units[unit].push({de:item.de, en:item.en});
    byKey.add(key); added.push(item);
  });
  base.version = new Date().toISOString().slice(0,10) + '-merge-01';
  Utils.downloadJSON(base, 'vocab.merged.json');
  log.textContent = `Fertig. Neue Einträge: ${added.length}. Datei 'vocab.merged.json' wurde heruntergeladen. Bitte diese Datei als 'vocab/vocab.json' auf dem Server ersetzen und Hard Reload durchführen.`;
});
