\
/**
 * Vokabeltrainer – Auto-Repair & Versioning Patch v0.7.3
 *
 * Enthält:
 *  - Auto-Repair der Units (aus Karten ableiten, Defaults setzen, Merge)
 *  - Versions-Badge im UI
 *  - Service-Worker-Registrierung + Update-Toast
 *  - Leichte Migrations-/Versionierungslogik
 *
 * Hinweis: Speichert Daten zunächst in localStorage. Wenn du IndexedDB nutzt,
 * passe die load/save-Methoden unten an deinen DB-Wrapper an.
 */

export const APP_VERSION = '0.7.3';
const STORAGE_KEYS = {
  units: 'vt_units',
  cards: 'vt_cards',
  schedules: 'vt_schedules',
  appVersion: 'vt_app_version'
};

// ---------- Storage-Helfer (localStorage) ----------
function loadJSON(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- UI: Badge & Toast automatisch bereitstellen ----------
function ensureUIElements() {
  if (!document.getElementById('version-badge')) {
    const badge = document.createElement('div');
    badge.id = 'version-badge';
    badge.className = 'vt-version-badge';
    document.body.appendChild(badge);
  }
  if (!document.getElementById('vt-toast')) {
    const toast = document.createElement('div');
    toast.id = 'vt-toast';
    toast.className = 'vt-toast';
    document.body.appendChild(toast);
  }
  // minimaler Style (inline, um Index-Änderungen zu vermeiden)
  const styleId = 'vt-version-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .vt-version-badge { position: fixed; right: 12px; bottom: 12px; background: #0b5fff; color: #fff;
        padding: 6px 10px; border-radius: 8px; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.2);
        opacity: .85; z-index: 9999; }
      .vt-toast { position: fixed; left: 50%; transform: translateX(-50%); bottom: 52px; background: #333; color: #fff;
        padding: 8px 12px; border-radius: 6px; font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,.25);
        z-index: 9999; opacity: 0; transition: opacity .25s ease; }
      .vt-toast.show { opacity: 0.95; }
    `;
    document.head.appendChild(style);
  }
}

function showVersionBadge() {
  ensureUIElements();
  const el = document.getElementById('version-badge');
  if (!el) return;
  el.textContent = `Vokabeltrainer v${APP_VERSION}`;
}

function toast(msg) {
  ensureUIElements();
  const el = document.getElementById('vt-toast');
  if (!el) { console.log('[Toast]', msg); return; }
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ---------- Units Auto-Repair ----------
function naturalSort(a, b) {
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

function extractUnitsFromCards(cards) {
  const set = new Set();
  for (const c of cards || []) {
    const tags = Array.isArray(c?.tags) ? c.tags : (c?.tags ? [c.tags] : []);
    for (let t of tags) {
      if (!t) continue;
      t = String(t).trim();
      if (t.length === 0) continue;
      set.add(t);
    }
  }
  return Array.from(set).sort(naturalSort);
}

function unitsAreBroken(units) {
  if (!Array.isArray(units)) return true;
  if (units.length === 0) return true;
  return units.some(u => typeof u !== 'string' || u.trim().length === 0);
}

function defaultUnits() {
  // Falls unerwünscht, gib [] zurück.
  return [
    'Unit 1: Friends',
    'Unit 2: Stars',
    'Unit 3: London Life',
    'Unit 4: Food and Drink',
    'Unit 5: In the News',
    'Unit 6: Goodbye Greenwich'
  ];
}

function repairUnits() {
  const cards = loadJSON(STORAGE_KEYS.cards, []);
  let units = loadJSON(STORAGE_KEYS.units, []);

  const broken = unitsAreBroken(units);
  const derived = extractUnitsFromCards(cards);

  if (broken && derived.length > 0) {
    units = derived;
    saveJSON(STORAGE_KEYS.units, units);
    console.info('[VT] Units repaired from cards:', units);
    return { repaired: true, source: 'cards', units };
  }
  if (broken && derived.length === 0) {
    units = defaultUnits();
    saveJSON(STORAGE_KEYS.units, units);
    console.warn('[VT] Units reset to defaults:', units);
    return { repaired: true, source: 'defaults', units };
  }
  // Merge: ergänzt neue Tags aus Karten in bestehende Units
  const merged = Array.from(new Set([...(units || []), ...derived])).sort(naturalSort);
  if (JSON.stringify(merged) !== JSON.stringify(units)) {
    saveJSON(STORAGE_KEYS.units, merged);
    console.info('[VT] Units merged with derived tags:', merged);
    return { repaired: true, source: 'merge', units: merged };
  }
  return { repaired: false, source: 'none', units };
}

// ---------- SRS-Beispiel (optional verwendbar) ----------
export function updateSchedule(s, grade, now = Date.now()) {
  if (!s) s = { interval: 0, ease: 2.5, reps: 0, lapses: 0, due: now };
  if (grade <= 2) {
    s.lapses += 1; s.reps += 1; s.ease = Math.max(1.3, s.ease - 0.2);
    s.interval = 1; s.due = now + s.interval * 24 * 3600 * 1000; return s;
  }
  s.reps += 1; const delta = (grade - 3) * 0.1; s.ease = Math.max(1.3, s.ease + delta - 0.08);
  if (s.interval < 1) s.interval = 1; else if (s.interval === 1) s.interval = 6; else s.interval = Math.round(s.interval * s.ease);
  s.due = now + s.interval * 24 * 3600 * 1000; return s;
}

// ---------- App-Init ----------
export function initApp() {
  showVersionBadge();
  const prevVersion = loadJSON(STORAGE_KEYS.appVersion, null);
  if (prevVersion !== APP_VERSION) {
    console.info(`[VT] App migrated from ${prevVersion} to ${APP_VERSION}`);
    saveJSON(STORAGE_KEYS.appVersion, APP_VERSION);
  }
  const result = repairUnits();
  if (result.repaired) toast(`Einheiten aktualisiert (${result.source}).`);
  // ... hier deinen weiteren App-Start anschließen
}

// ---------- Service Worker Registrierung & Update-Info ----------
(function registerSW(){
  if (!('serviceWorker' in navigator)) return;
  const scopePath = window.location.pathname.replace(/[^\/]+$/, ''); // Ordnerpfad
  const swPath = scopePath + 'sw.js';
  navigator.serviceWorker.register(swPath)
    .then(reg => console.info('[SW] registered', reg))
    .catch(err => console.error('[SW] register error', err));

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_ACTIVATED') {
      const v = event.data.version;
      toast(`App aktualisiert (Cache v${v}).`);
      setTimeout(() => window.location.reload(), 500);
    }
  });
})();

// ---------- DOM Start ----------
document.addEventListener('DOMContentLoaded', () => { initApp(); });
\
