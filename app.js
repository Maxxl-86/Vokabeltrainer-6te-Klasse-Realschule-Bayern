import { DB } from './db.js';
import { CONFIG } from './config.js';
import { SM2 } from './sm2.js';
import { Utils } from './utils.js';

let deferredPrompt = null; // for install button

const state = {
  mode: 'de-en',
  useMC: false,
  useHints: false,
  unitsEnabled: new Set(),
  cards: [],
  queue: [],
  current: null,
  stats: {},
  hints: {},
  dataVersion: null,
};

const els = {
  mode: document.getElementById('mode'),
  useMC: document.getElementById('useMC'),
  useHints: document.getElementById('useHints'),
  unitList: document.getElementById('unitList'),
  presetAll: document.getElementById('presetAll'),
  presetNone: document.getElementById('presetNone'),
  presetReset: document.getElementById('presetReset'),
  prompt: document.getElementById('prompt'),
  answer: document.getElementById('answer'),
  mcArea: document.getElementById('mcArea'),
  startNext: document.getElementById('startNext'),
  check: document.getElementById('check'),
  feedback: document.getElementById('feedback'),
  stats: document.getElementById('stats'),
  hintBox: document.getElementById('hintBox'),
  kofiWrap: document.getElementById('kofiWrap'),
  kofiLink: document.getElementById('kofiLink'),
  badge: document.getElementById('badge'),
  resetStats: document.getElementById('resetStats'),
  resetAll: document.getElementById('resetAll'),
  installBtn: document.getElementById('installBtn'),
};

// PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  els.installBtn.classList.remove('hidden');
});
els.installBtn.addEventListener('click', async () => {
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  if(choice.outcome === 'accepted'){
    els.installBtn.classList.add('hidden');
  }
});

async function boot(){
  // config
  els.badge.textContent = 'v' + CONFIG.APP_VERSION;
  if(CONFIG.KOFI_ENABLED){
    els.kofiWrap.classList.remove('hidden');
    els.kofiLink.href = CONFIG.KOFI_LINK;
  }

  // load data
  const vocabResp = await fetch('vocab/vocab.json');
  const vocab = await vocabResp.json();
  state.dataVersion = vocab.version;
  const hintsResp = await fetch('vocab/hints.json');
  state.hints = await hintsResp.json();

  // build cards
  state.cards = [];
  for(const [uid, list] of Object.entries(vocab.units)){
    list.forEach(w => {
      const id = `${uid}|${w.de}|${w.en}`;
      state.cards.push({ id, unit: uid, de: w.de, en: w.en });
    });
  }

  renderUnits(Object.keys(vocab.units));
  state.unitsEnabled = new Set(Object.keys(vocab.units));

  // load progress from IndexedDB
  await DB.open();
  await DB.migrateFromLocalStorage();
  const progress = await DB.getAllProgress();

  // init stats
  resetStats(true);

  // attach progress
  state.cards.forEach(card => {
    let p = progress.get(card.id);
    if(!p){
      p = SM2.init(card.id);
      DB.putProgress(p);
    }
    card.progress = p;
  });

  rebuildQueue();
  updateStats();
}

function renderUnits(ids){
  els.unitList.innerHTML = '';
  ids.forEach(id => {
    const div = document.createElement('div');
    div.className = 'unit';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.addEventListener('change', () => {
      if(cb.checked) state.unitsEnabled.add(id); else state.unitsEnabled.delete(id);
      rebuildQueue();
    });
    div.appendChild(cb);
    div.appendChild(document.createTextNode(id.toUpperCase()));
    els.unitList.appendChild(div);
  });
}

function rebuildQueue(){
  const candidate = state.cards.filter(c => state.unitsEnabled.has(c.unit));
  if(CONFIG.SCHEDULE_MODE === 'sm2'){
    candidate.sort((a,b) => (a.progress.due || 0) - (b.progress.due || 0));
  } else {
    // lightweight shuffle
    candidate.sort(() => Math.random() - 0.5);
  }
  state.queue = candidate;
}

function nextQuestion(){
  if(state.queue.length === 0){
    rebuildQueue();
    if(state.queue.length === 0){
      els.prompt.textContent = 'Keine Karte fällig.';
      return;
    }
  }
  state.current = state.queue[0];
  const prompt = (state.mode === 'de-en') ? state.current.de : state.current.en;
  els.prompt.textContent = `Frage: ${prompt}`;
  els.feedback.textContent = '';
  els.check.disabled = false;
  els.answer.value = '';
  const showHints = state.useHints && state.hints[(state.mode==='de-en'?state.current.en:state.current.de).toLowerCase()];
  if(showHints){
    const h = state.hints[(state.mode==='de-en'?state.current.en:state.current.de).toLowerCase()];
    els.hintBox.classList.remove('hidden');
    els.hintBox.innerHTML = Utils.renderHint(h);
  } else {
    els.hintBox.classList.add('hidden');
    els.hintBox.innerHTML = '';
  }
  els.mcArea.classList.toggle('hidden', !state.useMC);
  if(state.useMC){
    renderMC();
  }
}

function renderMC(){
  const correct = (state.mode === 'de-en') ? state.current.en : state.current.de;
  const pool = state.cards.map(c => (state.mode==='de-en')?c.en:c.de);
  const options = new Set([correct]);
  while(options.size < 4 && pool.length){
    const p = pool[Math.floor(Math.random()*pool.length)];
    options.add(p);
  }
  const shuffled = Array.from(options).sort(() => Math.random() - 0.5);
  els.mcArea.innerHTML = '';
  shuffled.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      els.answer.value = opt; // hidden field gets value
      checkAnswer(true);      // flag: from MC
    });
    els.mcArea.appendChild(btn);
  });
}

async function checkAnswer(fromMC=false){
  const givenRaw = els.answer.value.trim();
  const given = givenRaw.toLowerCase();
  const correct = (state.mode==='de-en')?state.current.en.toLowerCase():state.current.de.toLowerCase();
  const uid = state.current.unit;
  let wasCorrect = false;
  if(given === correct){
    state.stats[uid].right++;
    els.feedback.textContent = '✅ Richtig!';
    wasCorrect = true;
  } else {
    state.stats[uid].wrong++;
    // Wenn Multiple Choice, keine Schreibweisen-Meldung, sondern neutraler Hinweis
    if(fromMC){
      els.feedback.textContent = '❌ Leider falsch.';
    } else {
      els.feedback.textContent = `❌ Falsch. Richtig wäre: ${(state.mode==='de-en')?state.current.en:state.current.de}`;
    }
  }
  // update progress
  state.current.progress = SM2.update(state.current.progress, wasCorrect);
  await DB.putProgress(state.current.progress);
  updateStats();
  els.check.disabled = true;
  state.queue.shift();
}

function updateStats(){
  const parts = [];
  for(const [uid,s] of Object.entries(state.stats)){
    parts.push(`${uid.toUpperCase()}: ${s.right} ✓ / ${s.wrong} ✗`);
  }
  els.stats.textContent = parts.join('  ·  ');
}

function resetStats(silent=false){
  state.stats = {};
  const unitIds = new Set(state.cards.map(c=>c.unit));
  unitIds.forEach(uid => state.stats[uid] = {right:0, wrong:0});
  updateStats();
  if(!silent){ els.feedback.textContent = '↺ Statistik zurückgesetzt.'; }
}

async function resetAll(){
  // Statistik
  resetStats(true);
  // Fortschritt in IndexedDB löschen
  await DB.clearStore('progress');
  // Cards neu initialisieren
  state.cards.forEach(card => { card.progress = SM2.init(card.id); });
  await Promise.all(state.cards.map(c => DB.putProgress(c.progress)));
  // Auswahl auf Standard (alle an)
  state.unitsEnabled = new Set(state.cards.map(c=>c.unit));
  Array.from(els.unitList.querySelectorAll('input[type=checkbox]')).forEach(cb=>cb.checked=true);
  rebuildQueue();
  updateStats();
  els.feedback.textContent = '↺ Alles zurückgesetzt (Fortschritt, Statistik, Auswahl).';
}

// events
els.mode.addEventListener('change', e => { state.mode = e.target.value; });
els.useMC.addEventListener('change', e => { state.useMC = e.target.checked; });
els.useHints.addEventListener('change', e => { state.useHints = e.target.checked; });
els.startNext.addEventListener('click', nextQuestion);
els.check.addEventListener('click', () => checkAnswer(false));
els.presetAll.addEventListener('click', () => { state.unitsEnabled = new Set(state.cards.map(c=>c.unit)); Array.from(els.unitList.querySelectorAll('input[type=checkbox]')).forEach(cb=>cb.checked=true); rebuildQueue(); });
els.presetNone.addEventListener('click', () => { state.unitsEnabled = new Set(); Array.from(els.unitList.querySelectorAll('input[type=checkbox]')).forEach(cb=>cb.checked=false); rebuildQueue(); });
els.presetReset.addEventListener('click', () => { state.unitsEnabled = new Set(state.cards.map(c=>c.unit)); Array.from(els.unitList.querySelectorAll('input[type=checkbox]')).forEach(cb=>cb.checked=true); rebuildQueue(); els.feedback.textContent = '↺ Auswahl auf Standard gesetzt.'; });
els.resetStats.addEventListener('click', () => resetStats(false));
els.resetAll.addEventListener('click', () => { resetAll(); });

boot();
