// Vokabeltrainer (PWA) – CSV Import + Multi-Mix + Presets + Fehlergewichtung + Anti-Repeat + Reset

// --- Konfiguration ---
const UNIT_META = [
  { id: 'u1', name: 'Unit 1' },
  { id: 'u2', name: 'Unit 2' },
  { id: 'u3', name: 'Unit 3' },
  { id: 'u4', name: 'Unit 4' },
  { id: 'u5', name: 'Unit 5' },
  { id: 'u6', name: 'Unit 6' },
  { id: 'u7', name: 'Unit 7' },
];

// --- Storage Keys ---
const LS_VOCAB = 'vocab-data-v1';      // { u1:[{de,en},...], ... }
const LS_STATS = 'vocab-trainer-stats-v4';

// --- DOM ---
const els = {
  blockChecklist: document.getElementById('blockChecklist'),
  selectAllBtn: document.getElementById('selectAllBtn'),
  clearAllBtn: document.getElementById('clearAllBtn'),
  presetSelect: document.getElementById('presetSelect'),
  modeSelect: document.getElementById('modeSelect'),
  mcEnabled: document.getElementById('mcEnabled'),
  weightedEnabled: document.getElementById('weightedEnabled'),
  nextBtn: document.getElementById('nextBtn'),
  promptLabel: document.getElementById('promptLabel'),
  promptText: document.getElementById('promptText'),
  optionsList: document.getElementById('optionsList'),
  mcArea: document.getElementById('mcArea'),
  feedback: document.getElementById('feedback'),
  statCorrect: document.getElementById('statCorrect'),
  statWrong: document.getElementById('statWrong'),
  currentBlocksLabel: document.getElementById('currentBlocksLabel'),
  updateBanner: document.getElementById('updateBanner'),
  reloadBtn: document.getElementById('reloadBtn'),
  weightInfo: document.getElementById('weightInfo'),
  installBtn: document.getElementById('installBtn'),
  installInfo: document.getElementById('installInfo'),
  resetSelectedBtn: document.getElementById('resetSelectedBtn'),
  resetAllBtn: document.getElementById('resetAllBtn'),
};

// --- State ---
let activeBlockIds = [];
let lastPrompts = [];
let sessionQueue = [];
const HISTORY_SIZE = 2;

// --- Helpers ---
function normalize(s){ return String(s||'').trim().toLowerCase(); }
function key(w){ return normalize(w.de)+'|'+normalize(w.en); }
function shuffle(arr){ for (let i=arr.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]] = [arr[j],arr[i]]; } return arr; }

function loadVocab(){ try{ return JSON.parse(localStorage.getItem(LS_VOCAB) || '{}'); } catch(e){ return {}; } }
function saveVocab(v){ localStorage.setItem(LS_VOCAB, JSON.stringify(v)); }
function loadStats(){ try{ return JSON.parse(localStorage.getItem(LS_STATS) || '{}'); } catch(e){ return {}; } }
function saveStats(s){ localStorage.setItem(LS_STATS, JSON.stringify(s)); }

// --- Init Default Sample (nur falls leer) ---
function ensureSampleVocab(){
  const v = loadVocab();
  if (Object.keys(v).length) return; // schon vorhanden
  v['u1'] = [ {de:'Schule',en:'school'}, {de:'Freund',en:'friend'}, {de:'Hausaufgaben',en:'homework'} ];
  v['u2'] = [ {de:'Wochenende',en:'weekend'}, {de:'Plan',en:'plan'}, {de:'Zukunft',en:'future'} ];
  v['u3'] = [ {de:'Stadtplan',en:'city map'}, {de:'Sehenswürdigkeit',en:'sight'}, {de:'U-Bahn',en:'underground'} ];
  saveVocab(v);
}

// --- Stats Setup ---
function initStats(){
  const stats = loadStats();
  if (!stats.blocks) stats.blocks = {}; if (!stats.words) stats.words = {};
  const vocab = loadVocab();
  UNIT_META.forEach(u => {
    if (!stats.blocks[u.id]) stats.blocks[u.id] = {correct:0, wrong:0};
    if (!stats.words[u.id]) stats.words[u.id] = {};
    (vocab[u.id]||[]).forEach(w => { const k = key(w); if (!stats.words[u.id][k]) stats.words[u.id][k] = {correct:0, wrong:0}; });
  });
  saveStats(stats);
}

function updateStatsUI(){
  els.weightInfo.textContent = els.weightedEnabled.checked ? 'aktiv' : 'aus';
  if (!activeBlockIds.length){ els.statCorrect.textContent = '0'; els.statWrong.textContent = '0'; return; }
  const stats = loadStats();
  const agg = activeBlockIds.reduce((acc, id) => {
    const s = stats.blocks[id] || {correct:0, wrong:0}; acc.correct += s.correct; acc.wrong += s.wrong; return acc; }, {correct:0, wrong:0});
  els.statCorrect.textContent = agg.correct; els.statWrong.textContent = agg.wrong;
}

function record(originBlockId, item, ok){
  const stats = loadStats();
  const bs = stats.blocks[originBlockId];
  const ws = stats.words[originBlockId][key(item)];
  if (ok) { bs.correct++; ws.correct++; } else { bs.wrong++; ws.wrong++; }
  saveStats(stats); updateStatsUI();
}

// --- Reset ---
function resetBlock(blockId){
  const stats = loadStats();
  if (!stats.blocks[blockId]) return;
  stats.blocks[blockId] = {correct:0, wrong:0};
  Object.keys(stats.words[blockId]||{}).forEach(k => stats.words[blockId][k] = {correct:0, wrong:0});
  saveStats(stats); updateStatsUI();
}
function resetSelected(){ activeBlockIds.forEach(id => resetBlock(id)); }
function resetAll(){ UNIT_META.forEach(u => resetBlock(u.id)); }

// --- Checklist & Presets ---
function renderChecklist(){
  els.blockChecklist.innerHTML = '';
  UNIT_META.forEach(u => {
    const label = document.createElement('label');
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = u.id; cb.checked = false;
    cb.addEventListener('change', syncActiveBlockIds);
    label.appendChild(cb); label.appendChild(document.createTextNode(' '+u.name));
    els.blockChecklist.appendChild(label);
  });
  // Default: Unit 1 aktiv
  els.blockChecklist.querySelector('input[value="u1"]').checked = true;
  syncActiveBlockIds();
}

function syncActiveBlockIds(){
  activeBlockIds = Array.from(els.blockChecklist.querySelectorAll('input[type=checkbox]:checked')).map(el => el.value);
  const names = activeBlockIds.map(id => UNIT_META.find(u=>u.id===id)?.name).filter(Boolean);
  els.currentBlocksLabel.textContent = names.length ? names.join(', ') : '–';
  updateStatsUI(); resetSessionQueue(); els.presetSelect.value = 'custom';
}

function applyPreset(val){
  const ranges = {
    'u1_2': ['u1','u2'],
    'u1_3': ['u1','u2','u3'],
    'u3_4': ['u3','u4'],
    'u1_7': ['u1','u2','u3','u4','u5','u6','u7'],
  };
  els.blockChecklist.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
  (ranges[val]||[]).forEach(id => { const cb = els.blockChecklist.querySelector(`input[value="${id}"]`); if (cb) cb.checked = true; });
  syncActiveBlockIds();
}

// --- Pool & Queue ---
function buildPool(){
  const vocab = loadVocab();
  const pool = [];
  activeBlockIds.forEach(id => (vocab[id]||[]).forEach(w => pool.push({w, origin:id})));
  return pool;
}

function resetSessionQueue(){
  const basePool = buildPool();
  const weighted = [];
  const useWeighted = !!els.weightedEnabled?.checked;
  const stats = loadStats();
  basePool.forEach(({w,origin}) => {
    const ws = stats.words[origin]?.[key(w)] || {correct:0, wrong:0};
    let weight = 1; if (useWeighted) weight = Math.max(1, Math.min(5, 1 + ws.wrong - Math.floor(ws.correct*0.5)));
    for (let i=0;i<weight;i++) weighted.push({w, origin});
  });
  sessionQueue = shuffle(weighted);
}

function recentlyAsked(text){ return lastPrompts.some(t => normalize(t) === normalize(text)); }
function pushHistory(text){ lastPrompts.unshift(text); if (lastPrompts.length>HISTORY_SIZE) lastPrompts.pop(); }

let currentQ = null; // {origin, from, to, prompt, answer, options, item}

function pickQuestion(){
  const mode = els.modeSelect.value; if (!activeBlockIds.length) return null; if (!sessionQueue.length) resetSessionQueue();
  let tries = Math.min(sessionQueue.length, 5);
  let candidate = sessionQueue[0];
  const from = mode === 'de2en' ? 'de' : 'en'; const to = mode === 'de2en' ? 'en' : 'de';
  while (tries>0 && candidate && recentlyAsked(candidate.w[from])) { sessionQueue.push(sessionQueue.shift()); candidate = sessionQueue[0]; tries--; }
  candidate = sessionQueue.shift(); if (!sessionQueue.length) resetSessionQueue();
  const item = candidate.w, origin = candidate.origin; const prompt = item[from]; const answer = item[to];
  const pool = buildPool();
  let options = [answer];
  const distractPool = shuffle(pool.filter(x => x.w!==item).map(x => x.w[to]).filter(x => normalize(x)!==normalize(answer)));
  while (options.length < 4 && distractPool.length) options.push(distractPool.pop()); options = shuffle(options);
  currentQ = { origin, from, to, prompt, answer, options, item }; return currentQ;
}

function renderQuestion(){
  if (!currentQ) return; els.promptLabel.textContent = currentQ.from==='de' ? 'Deutsch' : 'Englisch';
  els.promptText.textContent = currentQ.prompt; els.feedback.textContent=''; pushHistory(currentQ.prompt);
  if (els.mcEnabled.checked){
    els.mcArea.classList.remove('hidden'); els.optionsList.innerHTML='';
    currentQ.options.forEach(optText => { const li = document.createElement('li'); const btn = document.createElement('button'); btn.className='option-btn'; btn.textContent=optText; btn.addEventListener('click',()=>onAnswer(optText)); li.appendChild(btn); els.optionsList.appendChild(li); });
  } else {
    els.mcArea.classList.add('hidden'); els.optionsList.innerHTML='';
    els.promptText.innerHTML = `${currentQ.prompt}<br/><input id="freeInput" class="option-btn" placeholder="Antwort hier eingeben" />`;
    setTimeout(()=>{ const input = document.getElementById('freeInput'); if (input) input.addEventListener('keydown', e => { if (e.key==='Enter') onAnswer(input.value.trim()); }); },0);
  }
}

function onAnswer(selected){ const ok = normalize(selected)===normalize(currentQ.answer); els.feedback.textContent = ok ? '✅ Richtig!' : `❌ Falsch. Richtig: ${currentQ.answer}`; record(currentQ.origin, currentQ.item, ok); }

// --- Install ---
let deferredPrompt = null;
function updateInstallInfo(){ const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone; els.installInfo.textContent = isStandalone ? 'installiert' : 'nicht installiert'; els.installBtn.style.display = isStandalone ? 'none' : 'inline-block'; }
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; els.installBtn.style.display = 'inline-block'; });
window.addEventListener('appinstalled', () => { deferredPrompt = null; updateInstallInfo(); });
els.installBtn.addEventListener('click', async () => { if (!deferredPrompt){ if (/iphone|ipad|ipod/i.test(navigator.userAgent)) alert('iOS: Teilen-Icon → "Zum Home-Bildschirm" hinzufügen'); return; } deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; updateInstallInfo(); });

// --- Events ---
els.nextBtn.addEventListener('click', () => { pickQuestion(); renderQuestion(); });
els.resetSelectedBtn.addEventListener('click', () => { resetSelected(); });
els.resetAllBtn.addEventListener('click', () => { resetAll(); });
els.weightedEnabled.addEventListener('change', () => { updateStatsUI(); resetSessionQueue(); });
els.presetSelect.addEventListener('change', (e) => { if (e.target.value==='custom') return; applyPreset(e.target.value); });
els.selectAllBtn.addEventListener('click', () => { els.blockChecklist.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked=true); syncActiveBlockIds(); });
els.clearAllBtn.addEventListener('click', () => { els.blockChecklist.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked=false); syncActiveBlockIds(); });

// --- Init ---
ensureSampleVocab();
renderChecklist();
initStats();
updateStatsUI();
updateInstallInfo();

// --- SW & Update-Banner ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { scope: './' }).then(reg => {
    if (reg.waiting) showUpdateBanner();
    reg.addEventListener('updatefound', () => { const newSW = reg.installing; if (!newSW) return; newSW.addEventListener('statechange', () => { if (newSW.state==='installed' && navigator.serviceWorker.controller) { showUpdateBanner(); } }); });
  });
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data==='SW_UPDATED') showUpdateBanner(); });
}
function showUpdateBanner(){ els.updateBanner.classList.remove('hidden'); }
els.reloadBtn.addEventListener('click', () => { window.location.reload(); });
