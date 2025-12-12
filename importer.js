\
(function(){
  const STORAGE_KEYS = { units: 'vt_units', cards: 'vt_cards' };
  function loadJSON(key, fallback = null) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
  function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function naturalSort(a, b) { return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }); }
  function extractUnitsFromCards(cards) { const set=new Set(); for(const c of cards||[]){ const tags=Array.isArray(c?.tags)?c.tags:(c?.tags?[c.tags]:[]); for(let t of tags){ t=String(t||'').trim(); if(t) set.add(t); } } return Array.from(set).sort(naturalSort); }
  function mergeCards(existing, incoming) { const key=(c)=>(String(c.front)+'|'+String(c.back)).toLowerCase().trim(); const map=new Map(existing.map(c=>[key(c), c])); for(const c of incoming){ const k=key(c); if(!map.has(k)){ map.set(k, { ...c, id: (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random())) }); } else { const prev=map.get(k); const prevTags=Array.isArray(prev.tags)?prev.tags:(prev.tags?[prev.tags]:[]); const newTags=Array.isArray(c.tags)?c.tags:(c.tags?[c.tags]:[]); const mergedTags=Array.from(new Set([...prevTags,...newTags])); map.set(k, { ...prev, tags: mergedTags }); } } return Array.from(map.values()); }
  function safeImport(cardsToImport) { const backup={ units: loadJSON(STORAGE_KEYS.units, []), cards: loadJSON(STORAGE_KEYS.cards, []) }; try{ const merged=mergeCards(backup.cards, cardsToImport); saveJSON(STORAGE_KEYS.cards, merged); const units=extractUnitsFromCards(merged); saveJSON(STORAGE_KEYS.units, units); return { ok:true, added: cardsToImport.length, units }; } catch(e){ console.error('Import-Fehler, Rollback:', e); saveJSON(STORAGE_KEYS.units, backup.units); saveJSON(STORAGE_KEYS.cards, backup.cards); return { ok:false, error:String(e) }; } }
  window.VTImporter = { safeImport, mergeCards };
})();
