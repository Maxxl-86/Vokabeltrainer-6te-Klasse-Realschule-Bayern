
// Vokabeltrainer (PWA) – Central Sync Build (bereinigt)
// Lädt beim Start zentrale Vokabelliste ./vocab/vocab.json und merged/erzwingt sie.

const UNIT_META = [
  { id: 'u1', name: 'Unit 1' },
  { id: 'u2', name: 'Unit 2' },
  { id: 'u3', name: 'Unit 3' },
  { id: 'u4', name: 'Unit 4' },
  { id: 'u5', name: 'Unit 5' },
  { id: 'u6', name: 'Unit 6' },
  { id: 'u7', name: 'Unit 7' },
];

const LS_VOCAB = 'vocab-data-v1';
const LS_STATS = 'vocab-trainer-stats-v4';
const LS_SYNC  = 'vocab-central-meta';
const CENTRAL_URL = './vocab/vocab.json';

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
  centralInfo: document.getElementById('centralInfo'),
  forceCentralToggle: document.getElementById('forceCentral'),
  refreshCentralBtn: document.getElementById('refreshCentral'),
  centralVersion: document.getElementById('centralVersion'),
};

let activeBlockIds = [];
let lastPrompts = [];
let sessionQueue = [];
const HISTORY_SIZE = 2;

function normalize(s){ return String(s||'').trim().toLowerCase(); }
function key(w){ return normalize(w.de)+'\n'+normalize(w.en); }
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }

function loadVocab(){ try{ return JSON.parse(localStorage.getItem(LS_VOCAB)||'{}'); }catch(e){ return {}; } }
function saveVocab(v){ localStorage.setItem(LS_VOCAB, JSON.stringify(v)); }
function loadStats(){ try{ return JSON.parse(localStorage.getItem(LS_STATS)||'{}'); }catch(e){ return {}; } }
function saveStats(s){ localStorage.setItem(LS_STATS, JSON.stringify(s)); }
function loadSync(){ try{ return JSON.parse(localStorage.getItem(LS_SYNC)||'{}'); }catch(e){ return {}; } }
function saveSync(m){ localStorage.setItem(LS_SYNC, JSON.stringify(m)); }

async function fetchCentral(){
  try{
    const res = await fetch(CENTRAL_URL, { cache: 'no-store' });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    return data; // {version, units}
  }catch(e){ console.warn('Zentrale Liste konnte nicht geladen werden:', e); return null; }
}

function mergeCentralIntoLocal(central, enforced=false){
  const local = enforced ? {} : loadVocab();
  const out = Object.assign({}, local);
  const src = (central && central.units) ? central.units : {};
  for(const unit of Object.keys(src)){
    const list = Array.isArray(src[unit]) ? src[unit] : [];
    if(!out[unit]) out[unit]=[];
    if(enforced){ out[unit] = list.slice(); }
    else{
      const existing = new Set(out[unit].map(key));
      list.forEach(w=>{ if(!existing.has(key(w))) out[unit].push(w); });
    }
  }
  saveVocab(out);
  initStats();
}

async function initCentralSync(){
  const meta = loadSync();
  if(els.forceCentralToggle) els.forceCentralToggle.checked = !!meta.enforced;
  if(els.centralVersion)     els.centralVersion.textContent = meta.version ? meta.version : '–';

  const central = await fetchCentral();
  if(central){
    const newVersion = central.version || 'unknown';
    const changed = newVersion !== meta.version;
    if(changed || meta.enforced){
      mergeCentralIntoLocal(central, !!meta.enforced);
      saveSync({ version: newVersion, enforced: !!meta.enforced });
      if(els.centralVersion) els.centralVersion.textContent = newVersion;
    }
    if(els.centralInfo) els.centralInfo.classList.remove('hidden');
  } else {
    if(els.centralInfo) els.centralInfo.classList.remove('hidden');
  }
}

function initStats(){
  const stats = loadStats();
  if(!stats.blocks) stats.blocks={};
  if(!stats.words)  stats.words={};
  const vocab = loadVocab();
  UNIT_META.forEach(u=>{
    if(!stats.blocks[u.id]) stats.blocks[u.id] = {correct:0, wrong:0};
    if(!stats.words[u.id])  stats.words[u.id]  = {};
    (vocab[u.id]||[]).forEach(w=>{
      const k = key(w);
      if(!stats.words[u.id][k]) stats.words[u.id][k] = {correct:0,wrong:0};
    });
  });
  saveStats(stats);
}

function updateStatsUI(){
  if(els.weightInfo) els.weightInfo.textContent = els.weightedEnabled?.checked ? 'aktiv' : 'aus';
  if(!activeBlockIds.length){ els.statCorrect.textContent='0'; els.statWrong.textContent='0'; return; }
  const stats = loadStats();
  const agg = activeBlockIds.reduce((acc,id)=>{
    const s = stats.blocks[id]||{correct:0,wrong:0};
    acc.correct += s.correct; acc.wrong += s.wrong; return acc; }, {correct:0,wrong:0});
  els.statCorrect.textContent = agg.correct; els.statWrong.textContent = agg.wrong;
}

function record(originBlockId, item, ok){
  const stats = loadStats();
  const bs = stats.blocks[originBlockId];
  const ws = stats.words[originBlockId][key(item)];
  if(ok){ bs.correct++; ws.correct++; } else { bs.wrong++; ws.wrong++; }
  saveStats(stats); updateStatsUI();
}

function resetBlock(blockId){
  const stats = loadStats(); if(!stats.blocks[blockId]) return;
  stats.blocks[blockId] = {correct:0,wrong:0};
  Object.keys(stats.words[blockId]||{}).forEach(k=> stats.words[blockId][k] = {correct:0,wrong:0});
  saveStats(stats); updateStatsUI();
}
function resetSelected(){ activeBlockIds.forEach(id=> resetBlock(id)); }
function resetAll(){ UNIT_META.forEach(u=> resetBlock(u.id)); }

function renderChecklist(){
  els.blockChecklist.innerHTML='';
  UNIT_META.forEach(u=>{
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type='checkbox'; cb.value=u.id; cb.checked=false;
    cb.addEventListener('change', syncActiveBlockIds);
    label.appendChild(cb); label.appendChild(document.createTextNode(' '+u.name));
    els.blockChecklist.appendChild(label);
  });
  // default: Unit 1 aktiv
  const first = els.blockChecklist.querySelector('input[value="u1"]');
  if(first){ first.checked=true; syncActiveBlockIds(); }
}

function syncActiveBlockIds(){
  activeBlockIds = Array.from(els.blockChecklist.querySelectorAll('input[type=checkbox]:checked')).map(el=>el.value);
  const names = activeBlockIds.map(id=> UNIT_META.find(u=>u.id===id)?.name).filter(Boolean);
  els.currentBlocksLabel.textContent = names.length ? names.join(', ') : '–';
  updateStatsUI(); resetSessionQueue(); if(els.presetSelect) els.presetSelect.value='custom';
}

function buildPool(){
  const vocab = loadVocab(); const pool=[];
  activeBlockIds.forEach(id=> (vocab[id]||[]).forEach(w=> pool.push({w,origin:id})) );
  return pool;
}

function resetSessionQueue(){
  const base = buildPool(); const weighted = [];
  const useW = !!els.weightedEnabled?.checked; const stats = loadStats();
  base.forEach(({w,origin})=>{
    const ws = stats.words[origin]?.[key(w)] || {correct:0,wrong:0};
    let weight = 1; if(useW) weight = Math.max(1, Math.min(5, 1 + ws.wrong - Math.floor(ws.correct*0.5)));
    for(let i=0;i<weight;i++) weighted.push({w,origin});
  });
  sessionQueue = shuffle(weighted);
}

function recentlyAsked(text){ return lastPrompts.some(t=> normalize(t)===normalize(text)); }
function pushHistory(text){ lastPrompts.unshift(text); if(lastPrompts.length>HISTORY_SIZE) lastPrompts.pop(); }

let currentQ = null;
function pickQuestion(){
  const mode = els.modeSelect.value; if(!activeBlockIds.length) return null;
  if(!sessionQueue.length) resetSessionQueue();
  let tries = Math.min(sessionQueue.length, 5);
  let cand = sessionQueue[0];
  const from = mode==='de2en' ? 'de' : 'en';
  const to   = mode==='de2en' ? 'en' : 'de';
  while(tries>0 && cand && recentlyAsked(cand.w[from])){ sessionQueue.push(sessionQueue.shift()); cand=sessionQueue[0]; tries--; }
  cand = sessionQueue.shift(); if(!sessionQueue.length) resetSessionQueue();
  const item = cand.w, origin=cand.origin; const prompt = item[from]; const answer = item[to];
  const pool = buildPool(); let options = [answer];
  const distract = shuffle(pool.filter(x=> x.w!==item).map(x=> x.w[to]).filter(x=> normalize(x)!==normalize(answer)) );
  while(options.length<4 && distract.length) options.push(distract.pop()); options = shuffle(options);
  currentQ = { origin, from, to, prompt, answer, options, item }; return currentQ;
}

function renderQuestion(){ if(!currentQ) return;
  els.promptLabel.textContent = currentQ.from==='de' ? 'Deutsch' : 'Englisch';
  els.promptText.textContent = currentQ.prompt; els.feedback.textContent=''; pushHistory(currentQ.prompt);
  if(els.mcEnabled?.checked){
    els.mcArea.classList.remove('hidden'); els.optionsList.innerHTML='';
    currentQ.options.forEach(opt=>{ const li=document.createElement('li'); const btn=document.createElement('button'); btn.className='option-btn'; btn.textContent=opt; btn.addEventListener('click',()=> onAnswer(opt)); li.appendChild(btn); els.optionsList.appendChild(li); });
  } else {
    els.mcArea.classList.add('hidden'); els.optionsList.innerHTML='';
    els.promptText.innerHTML = `${currentQ.prompt}<br/><input id="freeInput" class="option-btn" placeholder="Antwort hier eingeben" />`;
    setTimeout(()=>{ const input=document.getElementById('freeInput'); if(input) input.addEventListener('keydown', e=>{ if(e.key==='Enter') onAnswer(input.value.trim()); }); },0);
  }
}

function onAnswer(sel){ const ok = normalize(sel)===normalize(currentQ.answer);
  els.feedback.textContent = ok ? '✅ Richtig!' : `❌ Falsch. Richtig: ${currentQ.answer}`;
  record(currentQ.origin, currentQ.item, ok);
}

let deferredPrompt = null;
function updateInstallInfo(){ const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone; els.installInfo && (els.installInfo.textContent = standalone ? 'installiert' : 'nicht installiert'); }
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredPrompt=e; els.installBtn && (els.installBtn.style.display='inline-block'); });
window.addEventListener('appinstalled', ()=>{ deferredPrompt=null; updateInstallInfo(); });
els.installBtn && els.installBtn.addEventListener('click', async ()=>{ if(!deferredPrompt){ if(/iphone|ipad|ipod/i.test(navigator.userAgent)) alert('iOS: Teilen-Icon → "Zum Home-Bildschirm" hinzufügen'); return; } deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; updateInstallInfo(); });

els.nextBtn && els.nextBtn.addEventListener('click', ()=>{ const q=pickQuestion(); if(q) renderQuestion(); else { els.promptText.textContent='Bitte wähle mindestens einen Block.'; } });
els.resetSelectedBtn && els.resetSelectedBtn.addEventListener('click', ()=> resetSelected());
els.resetAllBtn && els.resetAllBtn.addEventListener('click',   ()=> resetAll());
els.weightedEnabled && els.weightedEnabled.addEventListener('change', ()=>{ updateStatsUI(); resetSessionQueue(); });
els.presetSelect && els.presetSelect.addEventListener('change', e=>{ if(e.target.value==='custom') return; applyPreset(e.target.value); });
els.selectAllBtn && els.selectAllBtn.addEventListener('click', ()=>{ els.blockChecklist.querySelectorAll('input[type=checkbox]').forEach(cb=> cb.checked=true ); syncActiveBlockIds(); });
els.clearAllBtn && els.clearAllBtn.addEventListener('click', ()=>{ els.blockChecklist.querySelectorAll('input[type=checkbox]').forEach(cb=> cb.checked=false ); syncActiveBlockIds(); });

els.forceCentralToggle && els.forceCentralToggle.addEventListener('change', ()=>{ const m=loadSync(); m.enforced = !!els.forceCentralToggle.checked; saveSync(m); });
els.refreshCentralBtn && els.refreshCentralBtn.addEventListener('click', async ()=>{ const central=await fetchCentral(); if(central){ const meta=loadSync(); mergeCentralIntoLocal(central, !!meta.enforced); saveSync({version: central.version||'unknown', enforced: !!meta.enforced}); els.centralVersion && (els.centralVersion.textContent = central.version||'unknown'); alert('Zentrale Liste aktualisiert.'); } else alert('Zentrale Liste konnte nicht geladen werden.'); });

(async function init(){
  await initCentralSync();
  renderChecklist();
  initStats();
  updateStatsUI();
  updateInstallInfo();
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js', { scope: './' }).then(reg=>{
      if(reg.waiting) showUpdateBanner();
      reg.addEventListener('updatefound',()=>{ const n=reg.installing; if(!n) return; n.addEventListener('statechange',()=>{ if(n.state==='installed' && navigator.serviceWorker.controller) showUpdateBanner(); }); });
    });
    navigator.serviceWorker.addEventListener('message', e=>{ if(e.data==='SW_UPDATED') showUpdateBanner(); });
  }
})();

function showUpdateBanner(){ els.updateBanner && els.updateBanner.classList.remove('hidden'); }
els.reloadBtn && els.reloadBtn.addEventListener('click', ()=> window.location.reload());

function applyPreset(val){
  const ranges = { 'u1_2':['u1','u2'], 'u1_3':['u1','u2','u3'], 'u3_4':['u3','u4'], 'u1_7':['u1','u2','u3','u4','u5','u6','u7'] };
  els.blockChecklist.querySelectorAll('input[type=checkbox]').forEach(cb=> cb.checked=false );
  (ranges[val]||[]).forEach(id=>{ const cb=els.blockChecklist.querySelector(`input[value="${id}"]`); if(cb) cb.checked=true; });
  syncActiveBlockIds();
}
