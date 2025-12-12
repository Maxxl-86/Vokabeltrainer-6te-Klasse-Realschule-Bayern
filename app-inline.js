\
/** Patch v0.7.4 (Pages-kompatibel)
 * - Klassisches Script (kein ES Module), damit es sicher von index.html geladen wird
 * - Versionsbadge & Auto-Repair & SW-Update-Info
 */
(function(){
  const APP_VERSION = '0.7.4';
  const STORAGE_KEYS = { units:'vt_units', cards:'vt_cards', schedules:'vt_schedules', appVersion:'vt_app_version' };

  function debug(){ return /[?&]debug=1/.test(location.search); }

  function loadJSON(key, fallback=null){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback; }catch{ return fallback; } }
  function saveJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

  function ensureUI(){
    if(!document.getElementById('vt-badge')){
      const d=document.createElement('div'); d.id='vt-badge'; d.className='vt-badge'; document.body.appendChild(d);
    }
    if(!document.getElementById('vt-toast')){
      const t=document.createElement('div'); t.id='vt-toast'; t.className='vt-toast'; document.body.appendChild(t);
    }
    if(!document.getElementById('vt-style')){
      const s=document.createElement('style'); s.id='vt-style'; s.textContent = `
        .vt-badge{position:fixed;right:12px;bottom:12px;background:#0b5fff;color:#fff;padding:6px 10px;border-radius:8px;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.2);opacity:.9;z-index:9999}
        .vt-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:52px;background:#333;color:#fff;padding:8px 12px;border-radius:6px;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.25);z-index:9999;opacity:0;transition:opacity .25s}
        .vt-toast.show{opacity:.95}
      `; document.head.appendChild(s);
    }
  }
  function badge(){ ensureUI(); const el=document.getElementById('vt-badge'); if(el) el.textContent = `Vokabeltrainer v${APP_VERSION}`; }
  function toast(msg){ ensureUI(); const el=document.getElementById('vt-toast'); if(!el){ console.log('[Toast]', msg); return;} el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'), 2500); }

  function naturalSort(a,b){ return String(a).localeCompare(String(b), undefined, {numeric:true, sensitivity:'base'}); }
  function extractUnitsFromCards(cards){ const set=new Set(); for(const c of cards||[]){ const tags=Array.isArray(c?.tags)?c.tags:(c?.tags?[c.tags]:[]); for(let t of tags){ t=String(t||'').trim(); if(t) set.add(t); } } return Array.from(set).sort(naturalSort); }
  function unitsBroken(units){ if(!Array.isArray(units)) return true; if(units.length===0) return true; return units.some(u=>typeof u!=="string"||u.trim().length===0); }
  function defaults(){ return ['Unit 1: Friends','Unit 2: Stars','Unit 3: London Life','Unit 4: Food and Drink','Unit 5: In the News','Unit 6: Goodbye Greenwich']; }

  function repairUnits(){
    const cards = loadJSON(STORAGE_KEYS.cards, []);
    let units = loadJSON(STORAGE_KEYS.units, []);
    const broken = unitsBroken(units);
    const derived = extractUnitsFromCards(cards);

    if (broken && derived.length>0){ units = derived; saveJSON(STORAGE_KEYS.units, units); console.info('[VT] Units repaired from cards', units); return {repaired:true, source:'cards', units}; }
    if (broken && derived.length===0){ units = defaults(); saveJSON(STORAGE_KEYS.units, units); console.warn('[VT] Units set to defaults', units); return {repaired:true, source:'defaults', units}; }
    const merged = Array.from(new Set([...(units||[]), ...derived])).sort(naturalSort);
    if (JSON.stringify(merged)!==JSON.stringify(units)){ saveJSON(STORAGE_KEYS.units, merged); console.info('[VT] Units merged', merged); return {repaired:true, source:'merge', units:merged}; }
    return {repaired:false, source:'none', units};
  }

  function init(){
    if(debug()) console.log('[VT] init v'+APP_VERSION);
    badge();
    const prev = loadJSON(STORAGE_KEYS.appVersion, null);
    if(prev!==APP_VERSION){ if(debug()) console.log(`[VT] migrate ${prev} -> ${APP_VERSION}`); saveJSON(STORAGE_KEYS.appVersion, APP_VERSION); }
    const r = repairUnits(); if(r.repaired) toast(`Einheiten aktualisiert (${r.source}).`);
    registerSW();
  }

  function registerSW(){ if(!('serviceWorker' in navigator)) return;
    // Pfad robust für GitHub Pages (gleicher Ordner wie index.html)
    const base = (document.currentScript && document.currentScript.src) ? new URL(document.currentScript.src, location.href).pathname.replace(/[^\/]+$/, '') : (location.pathname.replace(/[^\/]+$/, ''));
    const swPath = base + 'sw.js';
    if(debug()) console.log('[SW] register', swPath);
    navigator.serviceWorker.register(swPath).then(reg=>{
      if(debug()) console.log('[SW] registered', reg);
    }).catch(err=>console.error('[SW] register error', err));

    navigator.serviceWorker.addEventListener('message', (ev)=>{
      if(ev.data?.type==='SW_ACTIVATED'){ toast(`App aktualisiert (Cache v${ev.data.version}).`); setTimeout(()=>location.reload(), 500); }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  // Expose minimal debug info
  window.VT_DEBUG = { version: APP_VERSION, keys: STORAGE_KEYS };
})();
