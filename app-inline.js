// Vokabeltrainer – Auto-Repair Blocks + UX + Tippfehler-Diff + Lern-Hinweise (Beta)
const APP_VERSION = 'v9'; // <--- ZENTRALE VERSIONSNUMMER
const UNIT_META = [
// ... (UNIT_META bleibt unverändert) ...
// ... (Funktionen wie normalize, softNorm, key, shuffle, simpleDiffLine, pickHint bleiben unverändert) ...

const els = {};
let activeBlockIds = [], lastPrompts = [], sessionQueue = [], currentQ = null;
let deferredPrompt = null; // Für das Installations-Prompt

function $(id){ return document.getElementById(id); }
// ... (ensureBlocksSection, bindEls, loadVocab, saveVocab, loadStats, saveStats, loadSync, saveSync, fetchJSON, initCentralSync, initStats, updateStatsUI, record, resetBlock, resetSelected, resetAll, renderChecklist, syncActiveBlockIds, buildPool, resetSessionQueue, recentlyAsked, pushHistory, pickQuestion, diffFeedback, disableInputsAfterAnswer, prepareNextUX, showHint, onAnswerOnce bleiben unverändert) ...

function renderQuestion(){ 
    if(!currentQ) return; 
    // ... (Logik zur Anzeige von Feedback, Hints und Prompt-Label bleibt unverändert) ...
    
    // NEU: Next-Button (Start/Weiter) ausblenden, solange die Frage aktiv ist
    els.nextBtn && els.nextBtn.classList.add('hidden'); 
    els.checkBtn && (els.checkBtn.disabled=false); 
    
    els.promptLabel.textContent = currentQ.from==='de'?'Deutsch':'Englisch'; 
    els.promptText.textContent=currentQ.prompt; 
    pushHistory(currentQ.prompt); 
    
    if(els.mcEnabled?.checked){ 
        els.mcArea.classList.remove('hidden'); 
        els.optionsList.innerHTML=''; 
        // MC: Check-Button wird nicht gebraucht
        els.checkBtn && els.checkBtn.classList.add('hidden'); 
        currentQ.options.forEach(opt=>{ 
            const li=document.createElement('li'); 
            const btn=document.createElement('button'); 
            btn.className='option-btn'; 
            btn.textContent=opt; 
            btn.addEventListener('click',()=> onAnswerOnce(opt)); 
            li.appendChild(btn); 
            els.optionsList.appendChild(li); 
        }); 
    } else { 
        // Freitext-Eingabe (Free Input Mode)
        els.mcArea.classList.add('hidden'); 
        els.optionsList.innerHTML=''; 
        els.checkBtn && els.checkBtn.classList.remove('hidden'); // Check-Button sichtbar
        els.promptText.innerHTML = `${currentQ.prompt}<br/><input id="freeInput" class="option-btn" placeholder="Antwort hier eingeben" />`; 
        
        // Event Listener für manuelle Eingabe (ROBUSTER FIX)
        setTimeout(()=>{ 
            const input=document.getElementById('freeInput'); 
            
            // FIX: checkBtn neu binden, um alte Listener zu entfernen (DOM-Ersatz)
            const oldCheckBtn = els.checkBtn;
            els.checkBtn = oldCheckBtn.cloneNode(true);
            oldCheckBtn.replaceWith(els.checkBtn);
            
            if(input){ 
                const answerCheckHandler = (e) => {
                    if(e.type === 'keydown' && e.key !== 'Enter') return;
                    if(e.type === 'click' && input.disabled) return;
                    onAnswerOnce(input.value.trim()); 
                    if (e.preventDefault) e.preventDefault();
                };

                // 1. Enter-Taste
                input.addEventListener('keydown', answerCheckHandler); 
                
                // 2. Prüfen-Button
                els.checkBtn.addEventListener('click', answerCheckHandler);
                
                input.focus();
            } 
        },0); 
    }
}

function bindControls(){ 
    // ... (Alle anderen Event-Listener bleiben unverändert) ...

    // Installations-Logik (GEÄNDERT)
    if (els.installBtn) {
        
        // Listener für das PWA-Ereignis speichern
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            // Der Button ist bereits sichtbar, muss hier nicht explizit sichtbar gemacht werden.
        });

        els.installBtn.addEventListener('click', (e) => {
            if (deferredPrompt) {
                // Wenn Prompt verfügbar, Installation starten
                els.installBtn.classList.add('hidden');
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('App installiert');
                    } else {
                        // Bei Ablehnung Button wieder anzeigen
                        els.installBtn.classList.remove('hidden');
                        console.log('App Installation abgebrochen');
                    }
                    deferredPrompt = null;
                });
            } else {
                // FALLBACK: Wenn der Browser das Event nicht gesendet hat, Anweisung geben
                alert("Der Browser hat die automatische Installation noch nicht freigegeben. Bitte nutzen Sie das 3-Punkte-Menü (⋮) oben rechts und wählen Sie 'App installieren' oder 'Zum Startbildschirm hinzufügen'.");
            }
        });
        
        window.addEventListener('appinstalled', (e) => {
            els.installBtn.classList.add('hidden');
        });
        
        // Beim Start prüfen, ob die App bereits als PWA läuft
        if (window.matchMedia('(display-mode: standalone)').matches || 
            document.referrer.includes('android-app://')) {
            els.installBtn.classList.add('hidden');
        } else {
            // Wenn nicht installiert, machen wir den Button sofort sichtbar (entfernen hidden)
            els.installBtn.classList.remove('hidden');
        }
    }
}
function applyPreset(val){ const ranges={ 'u1_2':['u1','u2'], 'u1_3':['u1','u2','u3'], 'u3_4':['u3','u4'], 'u1_6':['u1','u2','u3','u4','u5','u6'] }; els.blockChecklist.querySelectorAll('input[type=checkbox]').forEach(cb=> cb.checked=false ); (ranges[val]||[]).forEach(id=>{ const cb=els.blockChecklist.querySelector(`input[value=\"${id}\"]`); if(cb) cb.checked=true; }); syncActiveBlockIds(); }

// FUNKTION: Version im Footer anzeigen
function displayVersion() {
    const versionEl = document.getElementById('appVersion');
    if (versionEl) {
        versionEl.textContent = APP_VERSION;
    }
}

(async function init(){ try{ 
    ensureBlocksSection(); 
    bindEls(); 
    bindControls(); 
    await initCentralSync(); 
    renderChecklist(); 
    initStats(); 
    updateStatsUI(); 
    displayVersion(); 

    // Initialen Zustand setzen
    els.promptText.textContent='Wähle mindestens einen Block und starte.';
    els.checkBtn && els.checkBtn.classList.add('hidden'); 
    
} catch(e){ console.error('[INIT] Fehler:', e); }})();