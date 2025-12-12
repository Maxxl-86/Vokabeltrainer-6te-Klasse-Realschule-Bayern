
/* Vokabeltrainer – App-Loader v2 (DE->EN)
   Lädt die korrigierten Units aus all_units_v2_fixed.json im Repo-Root
   und stellt sie der bestehenden App unter window.DATA bereit.
   Minimalinvasiv, ohne Styling- oder UI-Änderungen.
*/
(function(){
  const STATE = { units: {}, ready: false };

  async function loadDataset() {
    try {
      // Cache-Busting Query vermeidet veraltete SW-/Browser-Caches
      const url = 'all_units_v2_fixed.json?v=20251212';
      const res = await fetch(url, { cache: 'no-cache' });
      const raw = await res.json();

      // Nach Unit gruppieren und ins App-Format mappen (Deutsch -> Englisch)
      const units = {};
      for (const it of raw) {
        const u = Number(it.unit);
        if (!units[u]) units[u] = [];
        units[u].push({
          id: it.id,
          q: (it.de && it.de.term) ? it.de.term : '',     // Frage: Deutsch
          a: (it.en && it.en.term) ? it.en.term : '',     // Antwort: Englisch
          alt: Array.isArray(it.en && it.en.alt) ? it.en.alt : [],
          display: (it.en && (it.en.display || it.en.term)) ? (it.en.display || it.en.term) : '',
          tags: Array.isArray(it.tags) ? it.tags : []
        });
      }

      STATE.units = units;
      STATE.ready = true;

      // Rückwärtskompatibel: globale Daten-Referenz
      window.DATA = units;

      // Event an App signalisieren
      document.dispatchEvent(new CustomEvent('data:ready', { detail: { units } }));

      // Optionale, bereits vorhandene Hooks aufrufen
      if (typeof window.initApp === 'function') window.initApp();
      if (typeof window.render === 'function') window.render();
    } catch (err) {
      console.error('Fehler beim Laden der Units:', err);
      const el = document.getElementById('error');
      if (el) el.textContent = 'Fehler beim Laden der Vokabeln. Bitte Seite neu laden.';
    }
  }

  function getUnits(){ return STATE.units; }

  document.addEventListener('DOMContentLoaded', loadDataset);

  // Export eines kleinen API-Objekts, falls benötigt
  window.APP = Object.assign(window.APP || {}, { getUnits });
})();
