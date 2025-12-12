
/* Vokabeltrainer – App-Loader v2.1 (DE->EN)
   Lädt die korrigierten Units aus all_units_v2_fixed.json im Repo-Root
   und stellt sie der bestehenden App bereit:
   - window.DATA_BY_UNIT: { "1":[...], "2":[...], ... } (Objekt)
   - window.DATA: [ {unit:1, items:[...]}, {unit:2, items:[...]}, ... ] (Array)
   Triggert vorhandene Hooks (initApp, render) und loggt den Status in der Konsole.
*/
(function(){
  const STATE = { unitsObj: {}, unitsArr: [], ready: false };

  async function loadDataset() {
    try {
      const url = 'all_units_v2_fixed.json?v=20251212';
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status} beim Laden ${url}`);
      const raw = await res.json();

      // Gruppieren DE->EN
      const unitsObj = {};
      for (const it of raw) {
        const u = Number(it.unit);
        if (!unitsObj[u]) unitsObj[u] = [];
        unitsObj[u].push({
          id: it.id,
          q: (it.de && it.de.term) ? it.de.term : '',
          a: (it.en && it.en.term) ? it.en.term : '',
          alt: Array.isArray(it.en && it.en.alt) ? it.en.alt : [],
          display: (it.en && (it.en.display || it.en.term)) ? (it.en.display || it.en.term) : '',
          tags: Array.isArray(it.tags) ? it.tags : []
        });
      }

      // Zusätzlich: Array-Form für UIs, die darüber iterieren
      const unitsArr = Object.keys(unitsObj)
        .sort((a,b)=>Number(a)-Number(b))
        .map(k => ({ unit: Number(k), items: unitsObj[k] }));

      STATE.unitsObj = unitsObj;
      STATE.unitsArr = unitsArr;
      STATE.ready   = true;

      // Exporte: zwei Formate + Kompatibilitäts-Export
      window.DATA_BY_UNIT = unitsObj;   // Objektform
      window.DATA         = unitsArr;   // Arrayform (viele UIs erwarten dies)

      console.log('[Vokabeltrainer] Daten geladen:',
                  { unitKeys: Object.keys(unitsObj), counts: unitsArr.map(u=>({unit:u.unit,count:u.items.length})) });

      // Event/Init
      document.dispatchEvent(new CustomEvent('data:ready', { detail: { unitsObj, unitsArr } }));
      if (typeof window.initApp === 'function') window.initApp();
      if (typeof window.render === 'function')   window.render();

      // Falls gar keine UI-Hooks existieren, zeige minimal eine Unit-Auswahl
      ensureBasicUnitUI(unitsArr);

    } catch (err) {
      console.error('[Vokabeltrainer] Fehler beim Laden der Units:', err);
      const el = document.getElementById('error');
      if (el) el.textContent = 'Fehler beim Laden der Vokabeln. Bitte Seite neu laden.';
    }
  }

  // Minimal-UI-Fallback: zeigt Buttons für Units, wenn keine bestehende Render-Funktion greift.
  function ensureBasicUnitUI(unitsArr){
    try {
      const host = document.getElementById('unit-list') || document.getElementById('units') || document.body;
      if (!host) return;
      // Wenn Seite bereits eigene UI gerendert hat, nicht doppelt rendern
      if (host.dataset.autorendered === '1') return;

      const hasOwnUI = (typeof window.render === 'function') || (typeof window.showUnit === 'function');
      if (hasOwnUI) return;

      const container = document.createElement('div');
      container.style.margin = '1rem 0';
      container.innerHTML = '<h3>Units</h3>';
      unitsArr.forEach(u=>{
        const btn = document.createElement('button');
        btn.textContent = `Unit ${u.unit} (${u.items.length})`;
        btn.style.margin = '0.25rem';
        btn.onclick = ()=>console.log(`Unit ${u.unit} ausgewählt`, u.items.slice(0,3));
        container.appendChild(btn);
      });
      host.appendChild(container);
      host.dataset.autorendered = '1';
    } catch(e){
      console.warn('[Vokabeltrainer] Fallback-Unit-UI nicht möglich:', e);
    }
  }

  document.addEventListener('DOMContentLoaded', loadDataset);
})();
