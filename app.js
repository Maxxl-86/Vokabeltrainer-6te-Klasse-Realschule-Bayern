\
(function(){
  const APP_VERSION = '0.7.5-recovery';
  const KEYS = { units:'vt_units', cards:'vt_cards', schedules:'vt_schedules', appVersion:'vt_app_version' };

  function naturalSort(a,b){ return String(a).localeCompare(String(b), undefined, {numeric:true, sensitivity:'base'}); }
  function loadJSON(k,f=null){ try{ return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } }
  function saveJSON(k,v){ localStorage.setItem(k, JSON.stringify(v)); }

  function badge(){ const b=document.getElementById('badge'); if(b) b.textContent = `Vokabeltrainer v${APP_VERSION}`; }
  function toast(msg){ const t=document.getElementById('toast'); if(!t){ console.log('[Toast]',msg); return;} t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2500); }

  function unitsBroken(units){ if(!Array.isArray(units)) return true; if(units.length===0) return true; return units.some(u=>typeof u!=="string"||u.trim().length===0); }
  function extractUnits(cards){ const set=new Set(); for(const c of cards||[]){ const tags=Array.isArray(c?.tags)?c.tags:(c?.tags?[c.tags]:[]); for(let t of tags){ t=String(t||'').trim(); if(t) set.add(t); } } return Array.from(set).sort(naturalSort); }

  function renderUnits(){
    const units = loadJSON(KEYS.units, []);
    const grid = document.getElementById('units');
    const empty = document.getElementById('empty');
    grid.innerHTML = '';
    if(!units || units.length===0){ empty.style.display='block'; return; }
    empty.style.display='none';
    for(const u of units){
      const card = document.createElement('div'); card.className='card';
      const h3 = document.createElement('h3'); h3.textContent = u; card.appendChild(h3);
      const p = document.createElement('p'); p.className='small'; p.textContent = 'Bereit zum Lernen'; card.appendChild(p);
      grid.appendChild(card);
    }
  }

  function seedDemo(){
    const cards = [{"front": "friend", "back": "Freund/in", "tags": ["Unit 1: Friends"]}, {"front": "classmate", "back": "Klassenkamerad/in", "tags": ["Unit 1: Friends"]}, {"front": "star", "back": "Star", "tags": ["Unit 2: Stars"]}, {"front": "famous", "back": "berühmt", "tags": ["Unit 2: Stars"]}, {"front": "underground", "back": "U-Bahn", "tags": ["Unit 3: London Life"]}, {"front": "sight", "back": "Sehenswürdigkeit", "tags": ["Unit 3: London Life"]}, {"front": "breakfast", "back": "Frühstück", "tags": ["Unit 4: Food and Drink"]}, {"front": "thirsty", "back": "durstig", "tags": ["Unit 4: Food and Drink"]}, {"front": "headline", "back": "Schlagzeile", "tags": ["Unit 5: In the News"]}, {"front": "reporter", "back": "Reporter/in", "tags": ["Unit 5: In the News"]}, {"front": "goodbye", "back": "auf Wiedersehen", "tags": ["Unit 6: Goodbye Greenwich"]}, {"front": "memories", "back": "Erinnerungen", "tags": ["Unit 6: Goodbye Greenwich"]}] ;
    // IDs vergeben
    for(const c of cards){ c.id = c.id || String(Date.now()+Math.random()); }
    saveJSON(KEYS.cards, cards);
    const units = extractUnits(cards);
    saveJSON(KEYS.units, units);
    toast(`Demo-Daten geladen (${cards.length} Karten, ${units.length} Units).`);
    renderUnits();
  }

  async function hardReset(){
    try{
      // 1) SW abmelden
      if('serviceWorker' in navigator){ const regs = await navigator.serviceWorker.getRegistrations(); for(const r of regs){ await r.unregister(); } }
      // 2) Caches löschen
      if('caches' in window){ const names = await caches.keys(); for(const n of names){ await caches.delete(n); } }
      // 3) Storage leeren
      localStorage.clear();
      toast('Zurückgesetzt. Seite wird neu geladen...');
    }catch(e){ console.error('Reset-Fehler:', e); }
    setTimeout(()=>location.reload(), 600);
  }

  function registerSW(){ if(!('serviceWorker' in navigator)) return; const base = location.pathname.replace(/[^\/]+$/, ''); const sw = base+'sw.js'; navigator.serviceWorker.register(sw).catch(e=>console.error('SW register error',e)); navigator.serviceWorker.addEventListener('message', ev=>{ if(ev.data?.type==='SW_ACTIVATED'){ toast(`App aktualisiert (Cache v${ev.data.version}).`); setTimeout(()=>location.reload(), 500); } }); }

  function init(){ badge(); registerSW(); const prev = loadJSON(KEYS.appVersion, null); if(prev!==APP_VERSION){ saveJSON(KEYS.appVersion, APP_VERSION); }
    // Auto-Repair: Units aus Karten ableiten, falls leer
    const cards = loadJSON(KEYS.cards, []); let units = loadJSON(KEYS.units, []);
    if (unitsBroken(units)) { const derived = extractUnits(cards); if (derived.length>0){ saveJSON(KEYS.units, derived); toast('Einheiten aktualisiert (cards).'); } }
    renderUnits();

    document.getElementById('btn-seed').onclick = seedDemo;
    document.getElementById('btn-reset').onclick = hardReset;
    document.getElementById('btn-diagnose').onclick = ()=>{
      const info = { version: APP_VERSION, path: location.pathname, keys: Object.fromEntries(Object.keys(KEYS).map(k=>[k, loadJSON(KEYS[k])] )) };
      console.log('[Diagnose]', info); toast('Diagnose in Konsole ausgegeben.');
      alert('Diagnose -> Konsole (F12) öffnen.');
    };
  }

  document.addEventListener('DOMContentLoaded', init);
})();
