// Vokabeltrainer (PWA) – Multi-Mix & Install + Fehlergewichtung + Anti-Repeat + Reset

// Blöcke
const BLOCKS = [
  { id: 'school', name: 'School & Classroom', words: [
    {de:'Schule', en:'school'}, {de:'Lehrer', en:'teacher'}, {de:'Schüler', en:'student'},
    {de:'Klassenraum', en:'classroom'}, {de:'Hausaufgaben', en:'homework'}, {de:'Bleistift', en:'pencil'},
    {de:'Heft', en:'notebook'}, {de:'Tafel', en:'board'}, {de:'Pause', en:'break'}, {de:'Test', en:'test'}
  ]},
  { id: 'family', name: 'Family & Friends', words: [
    {de:'Familie', en:'family'}, {de:'Vater', en:'father'}, {de:'Mutter', en:'mother'},
    {de:'Bruder', en:'brother'}, {de:'Schwester', en:'sister'}, {de:'Freund', en:'friend'},
    {de:'Großvater', en:'grandfather'}, {de:'Großmutter', en:'grandmother'}, {de:'Cousin', en:'cousin'}, {de:'Nachbar', en:'neighbour'}
  ]},
  { id: 'daily', name: 'Daily Routines', words: [
    {de:'aufwachen', en:'wake up'}, {de:'frühstücken', en:'have breakfast'}, {de:'zur Schule gehen', en:'go to school'},
    {de:'lernen', en:'study'}, {de:'spielen', en:'play'}, {de:'zu Abend essen', en:'have dinner'},
    {de:'lesen', en:'read'}, {de:'schlafen', en:'sleep'}, {de:'Fernsehen schauen', en:'watch TV'}, {de:'Hausarbeit', en:'housework'}
  ]},
  { id: 'food', name: 'Food & Drinks', words: [
    {de:'Apfel', en:'apple'}, {de:'Brot', en:'bread'}, {de:'Wasser', en:'water'},
    {de:'Milch', en:'milk'}, {de:'Saft', en:'juice'}, {de:'Käse', en:'cheese'},
    {de:'Butter', en:'butter'}, {de:'Ei', en:'egg'}, {de:'Salat', en:'salad'}, {de:'Sandwich', en:'sandwich'}
  ]},
  { id: 'shopping', name: 'Shopping & Money', words: [
    {de:'Geschäft', en:'shop'}, {de:'kaufen', en:'buy'}, {de:'verkaufen', en:'sell'},
    {de:'Preis', en:'price'}, {de:'billig', en:'cheap'}, {de:'teuer', en:'expensive'},
    {de:'Geld', en:'money'}, {de:'Rechnung', en:'bill'}, {de:'Wechselgeld', en:'change'}, {de:'Kassierer', en:'cashier'}
  ]},
  { id: 'sports', name: 'Hobbies & Sports', words: [
    {de:'Fußball', en:'football'}, {de:'Basketball', en:'basketball'}, {de:'Schwimmen', en:'swimming'},
    {de:'Musik', en:'music'}, {de:'tanzen', en:'dance'}, {de:'zeichnen', en:'draw'},
    {de:'spielen (Instrument)', en:'play (an instrument)'}, {de:'laufen', en:'run'}, {de:'Rad fahren', en:'ride a bike'}, {de:'Wandern', en:'hiking'}
  ]},
  { id: 'travel', name: 'Travel & Holidays', words: [
    {de:'Stadt', en:'city'}, {de:'Land', en:'country'}, {de:'Bahnhof', en:'station'},
    {de:'Zug', en:'train'}, {de:'Bus', en:'bus'}, {de:'Flugzeug', en:'plane'},
    {de:'Hotel', en:'hotel'}, {de:'Reise', en:'trip'}, {de:'Ferien', en:'holidays'}, {de:'Karte', en:'map'}
  ]},
  { id: 'weather', name: 'Weather & Seasons', words: [
    {de:'Wetter', en:'weather'}, {de:'Sonne', en:'sun'}, {de:'Regen', en:'rain'},
    {de:'Schnee', en:'snow'}, {de:'Wind', en:'wind'}, {de:'warm', en:'warm'},
    {de:'kalt', en:'cold'}, {de:'Frühling', en:'spring'}, {de:'Sommer', en:'summer'}, {de:'Winter', en:'winter'}
  ]}
];

const els = {
  blockChecklist: document.getElementById('blockChecklist'),
  selectAllBtn: document.getElementById('selectAllBtn'),
  clearAllBtn: document.getElementById('clearAllBtn'),
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

// --- Stats in localStorage ---
const LS_KEY = 'vocab-trainer-stats-v4';
let stats = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
if (!stats.blocks) stats.blocks = {};
if (!stats.words) stats.words = {};

function initStats() {
  BLOCKS.forEach(b => {
    if (!stats.blocks[b.id]) stats.blocks[b.id] = {correct:0, wrong:0};
    if (!stats.words[b.id]) stats.words[b.id] = {};
    b.words.forEach(w => {
      const k = wordKey(w);
      if (!stats.words[b.id][k]) stats.words[b.id][k] = {correct:0, wrong:0};
    });
  });
  saveStats();
}

function saveStats(){ localStorage.setItem(LS_KEY, JSON.stringify(stats)); }
function wordKey(w){ return normalize(w.de)+'|'+normalize(w.en); }

// --- Auswahl der aktiven Blöcke ---
let activeBlockIds = [];
function renderChecklist() {
  els.blockChecklist.innerHTML = '';
  BLOCKS.forEach((b, idx) => {
    const id = `chk_${b.id}`;
    const label = document.createElement('label');
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = id; cb.value = b.id;
    // initial: erste zwei Blöcke aktiv als Beispiel
    cb.checked = idx < 1;
    cb.addEventListener('change', onChecklistChange);
    const name = document.createElement('span'); name.textContent = b.name;
    label.appendChild(cb); label.appendChild(name);
    els.blockChecklist.appendChild(label);
  });
  syncActiveBlockIds();
}

function onChecklistChange(){ syncActiveBlockIds(); }
function syncActiveBlockIds(){
  activeBlockIds = Array.from(els.blockChecklist.querySelectorAll('input[type=checkbox]:checked')).map(el => el.value);
  if (!activeBlockIds.length) {
    els.currentBlocksLabel.textContent = '–';
  } else {
    const names = activeBlockIds.map(id => BLOCKS.find(b => b.id===id)?.name).filter(Boolean);
    els.currentBlocksLabel.textContent = names.join(', ');
  }
  updateStatsUI();
  resetSessionQueue();
}

els.selectAllBtn.addEventListener('click', () => {
  els.blockChecklist.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = true);
  syncActiveBlockIds();
});
els.clearAllBtn.addEventListener('click', () => {
  els.blockChecklist.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
  syncActiveBlockIds();
});

function updateStatsUI() {
  els.weightInfo.textContent = els.weightedEnabled.checked ? 'aktiv' : 'aus';
  if (!activeBlockIds.length) {
    els.statCorrect.textContent = '0'; els.statWrong.textContent = '0'; return;
  }
  const agg = activeBlockIds.reduce((acc, id) => {
    const s = stats.blocks[id] || {correct:0, wrong:0};
    acc.correct += s.correct; acc.wrong += s.wrong; return acc;
  }, {correct:0, wrong:0});
  els.statCorrect.textContent = agg.correct;
  els.statWrong.textContent = agg.wrong;
}

function record(originBlockId, item, ok) {
  const bs = stats.blocks[originBlockId];
  const ws = stats.words[originBlockId][wordKey(item)];
  if (ok) { bs.correct++; ws.correct++; } else { bs.wrong++; ws.wrong++; }
  saveStats();
  updateStatsUI();
}

function resetSelected(){ activeBlockIds.forEach(id => resetBlock(id)); }
function resetBlock(blockId){
  if (!stats.blocks[blockId]) return;
  stats.blocks[blockId] = {correct:0, wrong:0};
  const words = stats.words[blockId] || {};
  Object.keys(words).forEach(k => { words[k] = {correct:0, wrong:0}; });
  saveStats();
  updateStatsUI();
}
function resetAll(){ BLOCKS.forEach(b => resetBlock(b.id)); }

// --- Anti-Repeat & Session-Queue ---
const HISTORY_SIZE = 2;            // wie viele letzte Fragen vermeiden
let lastPrompts = [];              // Merker der letzten Prompts
let sessionQueue = [];             // Reihenfolge der Wörter (ohne Ersatz)

function buildPool(){
  if (!activeBlockIds.length) return [];
  const pool = [];
  activeBlockIds.forEach(id => {
    const b = BLOCKS.find(x => x.id === id);
    if (b) pool.push(...b.words);
  });
  return pool;
}

function resetSessionQueue() {
  const basePool = buildPool();
  const weighted = [];
  const useWeighted = !!els.weightedEnabled?.checked;
  basePool.forEach(w => {
    const origin = BLOCKS.find(b => b.words.includes(w))?.id;
    if (!origin) return;
    if (!stats.words[origin]) stats.words[origin] = {};
    const k = wordKey(w);
    if (!stats.words[origin][k]) stats.words[origin][k] = {correct:0, wrong:0};
    const ws = stats.words[origin][k];
    let weight = 1;
    if (useWeighted) {
      weight = Math.max(1, Math.min(5, 1 + ws.wrong - Math.floor(ws.correct * 0.5)));
    }
    for (let i=0;i<weight;i++) weighted.push({w, origin});
  });
  sessionQueue = shuffle(weighted);
}

function recentlyAsked(text) {
  const norm = normalize(text);
  return lastPrompts.some(t => normalize(t) === norm);
}

function pushHistory(text) {
  lastPrompts.unshift(text);
  if (lastPrompts.length > HISTORY_SIZE) lastPrompts.pop();
}

function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function normalize(s) { return String(s || '').trim().toLowerCase(); }

let currentQ = null; // {origin, from, to, prompt, answer, options, item}

function pickQuestion() {
  const mode = els.modeSelect.value; // 'de2en' | 'en2de'
  if (!activeBlockIds.length) return null;
  if (!sessionQueue.length) resetSessionQueue();

  let tries = Math.min(sessionQueue.length, 5);
  let candidate = sessionQueue[0];
  const from = mode === 'de2en' ? 'de' : 'en';
  const to   = mode === 'de2en' ? 'en' : 'de';

  while (tries > 0 && candidate && recentlyAsked(candidate.w[from])) {
    sessionQueue.push(sessionQueue.shift());
    candidate = sessionQueue[0];
    tries--;
  }

  candidate = sessionQueue.shift();
  if (!sessionQueue.length) resetSessionQueue();

  const item = candidate.w; const origin = candidate.origin;
  const prompt = item[from];
  const answer = item[to];

  // Optionen aus aktivem Pool
  const pool = buildPool();
  let options = [answer];
  const distractPool = shuffle(
    pool
      .filter(w => w !== item)
      .map(w => w[to])
      .filter(w => normalize(w) !== normalize(answer))
  );
  while (options.length < 4 && distractPool.length) options.push(distractPool.pop());
  options = shuffle(options);

  currentQ = { origin, from, to, prompt, answer, options, item };
  return currentQ;
}

function renderQuestion() {
  if (!currentQ) return;
  els.promptLabel.textContent = currentQ.from === 'de' ? 'Deutsch' : 'Englisch';
  els.promptText.textContent = currentQ.prompt;
  els.feedback.textContent = '';
  pushHistory(currentQ.prompt);

  if (els.mcEnabled.checked) {
    els.mcArea.classList.remove('hidden');
    els.optionsList.innerHTML = '';
    currentQ.options.forEach(optText => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = optText;
      btn.addEventListener('click', () => onAnswer(optText));
      li.appendChild(btn);
      els.optionsList.appendChild(li);
    });
  } else {
    els.mcArea.classList.add('hidden');
    els.optionsList.innerHTML = '';
    els.promptText.innerHTML = `${currentQ.prompt}<br/><input id="freeInput" class="option-btn" placeholder="Antwort hier eingeben" />`;
    setTimeout(() => {
      const input = document.getElementById('freeInput');
      if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') onAnswer(input.value.trim()); });
    }, 0);
  }
}

function onAnswer(selected) {
  const ok = normalize(selected) === normalize(currentQ.answer);
  els.feedback.textContent = ok ? '✅ Richtig!' : `❌ Falsch. Richtig: ${currentQ.answer}`;
  record(currentQ.origin, currentQ.item, ok);
}

// --- Install-Flow (beforeinstallprompt) ---
let deferredPrompt = null;
function updateInstallInfo(){
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  els.installInfo.textContent = isStandalone ? 'installiert' : 'nicht installiert';
  els.installBtn.style.display = isStandalone ? 'none' : 'inline-block';
}
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  els.installBtn.style.display = 'inline-block';
});
window.addEventListener('appinstalled', () => {
  deferredPrompt = null; updateInstallInfo();
});
els.installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) {
    // iOS Hinweis
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      alert('iOS: Teilen-Icon → "Zum Home-Bildschirm" hinzufügen');
    }
    return;
  }
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice; // 'accepted' | 'dismissed'
  deferredPrompt = null; updateInstallInfo();
});

// Buttons
els.nextBtn.addEventListener('click', () => { pickQuestion(); renderQuestion(); });
els.resetSelectedBtn.addEventListener('click', () => { resetSelected(); });
els.resetAllBtn.addEventListener('click', () => { resetAll(); });
els.weightedEnabled.addEventListener('change', () => { updateStatsUI(); resetSessionQueue(); });
els.modeSelect.addEventListener('change', () => { /* nichts weiter nötig */ });

// Init
renderChecklist();
initStats();
updateStatsUI();
updateInstallInfo();

// Service Worker Registration + Update-Banner
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { scope: './' }).then(reg => {
    if (reg.waiting) showUpdateBanner();
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      if (!newSW) return;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner();
        }
      });
    });
  });
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data === 'SW_UPDATED') showUpdateBanner();
  });
}

function showUpdateBanner() { els.updateBanner.classList.remove('hidden'); }
els.reloadBtn.addEventListener('click', () => { window.location.reload(); });
