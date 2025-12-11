// Vokabeltrainer (PWA) – App-Logik
// Blöcke (Beispiel-Daten für 6. Klasse Realschule – bitte je nach Unterricht anpassen)
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
  blockSelect: document.getElementById('blockSelect'),
  modeSelect: document.getElementById('modeSelect'),
  mcEnabled: document.getElementById('mcEnabled'),
  nextBtn: document.getElementById('nextBtn'),
  promptLabel: document.getElementById('promptLabel'),
  promptText: document.getElementById('promptText'),
  optionsList: document.getElementById('optionsList'),
  mcArea: document.getElementById('mcArea'),
  feedback: document.getElementById('feedback'),
  statCorrect: document.getElementById('statCorrect'),
  statWrong: document.getElementById('statWrong'),
  currentBlockName: document.getElementById('currentBlockName'),
  updateBanner: document.getElementById('updateBanner'),
  reloadBtn: document.getElementById('reloadBtn'),
};

// Stats per Block (localStorage)
const LS_KEY = 'vocab-trainer-stats-v1';
let stats = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
function initStats() {
  BLOCKS.forEach(b => {
    if (!stats[b.id]) stats[b.id] = {correct:0, wrong:0};
  });
  localStorage.setItem(LS_KEY, JSON.stringify(stats));
}

function updateStatsUI(blockId) {
  const s = stats[blockId] || {correct:0, wrong:0};
  els.statCorrect.textContent = s.correct;
  els.statWrong.textContent = s.wrong;
}

function record(blockId, ok) {
  const s = stats[blockId];
  if (ok) s.correct++; else s.wrong++;
  localStorage.setItem(LS_KEY, JSON.stringify(stats));
  updateStatsUI(blockId);
}

// UI Setup
function fillBlocks() {
  els.blockSelect.innerHTML = '';
  BLOCKS.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id; opt.textContent = b.name; els.blockSelect.appendChild(opt);
  });
}

function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

let currentQ = null; // {blockId, from, to, prompt, answer, options[]}

function pickQuestion() {
  const blockId = els.blockSelect.value;
  const mode = els.modeSelect.value; // 'de2en' | 'en2de'
  const block = BLOCKS.find(b => b.id === blockId);
  if (!block) return null;
  const pool = block.words;
  const item = pool[Math.floor(Math.random()*pool.length)];
  const from = mode === 'de2en' ? 'de' : 'en';
  const to = mode === 'de2en' ? 'en' : 'de';
  const prompt = item[from];
  const answer = item[to];

  // Generate multiple-choice options (4 total)
  let options = [answer];
  const distractPool = shuffle([...pool.filter(w => w !== item).map(w => w[to])]);
  while (options.length < 4 && distractPool.length) options.push(distractPool.pop());
  options = shuffle(options);

  currentQ = { blockId, from, to, prompt, answer, options };
  return currentQ;
}

function renderQuestion() {
  if (!currentQ) return;
  els.currentBlockName.textContent = BLOCKS.find(b => b.id === currentQ.blockId)?.name || '–';
  els.promptLabel.textContent = currentQ.from === 'de' ? 'Deutsch' : 'Englisch';
  els.promptText.textContent = currentQ.prompt;
  els.feedback.textContent = '';

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
    // Freitextmodus (einfach): Nutzer tippt Antwort in Prompt (Quick & Dirty)
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
  record(currentQ.blockId, ok);
}

function normalize(s) { return String(s || '').trim().toLowerCase(); }

// Events
els.nextBtn.addEventListener('click', () => { pickQuestion(); renderQuestion(); });
els.blockSelect.addEventListener('change', () => { updateStatsUI(els.blockSelect.value); });

// Init
fillBlocks();
initStats();
updateStatsUI(els.blockSelect.value);

// Service Worker Registration + Update-Banner
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { scope: './' }).then(reg => {
    // Listen for updates
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
