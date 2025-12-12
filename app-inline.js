
// Vokabeltrainer – Auto-Repair Blocks + UX + Tippfehler-Diff + Lern-Hinweise (Beta)

const UNIT_META = [
  { id: 'u1', name: 'Unit 1' },
  { id: 'u2', name: 'Unit 2' },
  { id: 'u3', name: 'Unit 3' },
  { id: 'u4', name: 'Unit 4' },
  { id: 'u5', name: 'Unit 5' },
  { id: 'u6', name: 'Unit 6' }
];

const LS_VOCAB = 'vocab-data-v1';
const LS_STATS = 'vocab-trainer-stats-v4';
const LS_SYNC  = 'vocab-central-meta';
const CENTRAL_URL = './vocab/vocab.json';

function normalize(s){ return String(s||'').trim().toLowerCase(); }
function softNorm(s){ return normalize(s).replace(/[^a-zäöüß\-\s]/g,'').replace(/\s+/g,' ').trim(); }
function key(w){ return normalize(w.de)+'\n'+normalize(w.en); }
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }

// Diff (char-basiert)
function simpleDiffLine(a,b){
  const aa = softNorm(a), bb = softNorm(b);
  const L = Math.max(aa.length, bb.length);
  let ua = '', ub = '';
  for(let i=0;i<L;i++){
    const ca = aa[i]||''; const cb = bb[i]||'';
    if(ca===cb){ ua += ca; ub += cb; }
    else{
      ua += ca ? `<mark class="diff">${ca}</mark>` : `<mark class="diff">∅</mark>`;
      ub += cb ? `<mark class="diff">${cb}</mark>` : `<mark class="diff">∅</mark>`;
    }
  }
  return { ua, ub };
}

// Hints (kleines Lexikon + generischer Satz)
const HINTS_DICT = {
  'public': ['public transport','public holiday','in public'],
  'media': ['social media','mass media','the media'],
  'embarrassed': ['feel embarrassed','be embarrassed about sth']
};
function aAn(word){ return /^[aeiou]/.test(word.toLowerCase()) ? 'an' : 'a'; }
function pickHint(en,de,mode){
  const base = en.toLowerCase();
  const list = HINTS_DICT[base];
  if(list && list.length){ const c = list[Math.floor(Math.random()*list.length)]; return `Collocation: **${c}**`; }
  if(mode==='de2en') return `Satzidee: "This is ${aAn(en)} **${en}**."`;
  return `Satzidee: "Das Wort **${de}** kenne ich."`;
}

// Elements
const els = {};
let activeBlockIds = [];
let lastPrompts = [];
let sessionQueue = [];
let currentQ = null;
const HISTORY_SIZE = 2;

function $(id){ return document.getElementById(id); }

function ensureBlocksSection(){
  // Wenn die erwarteten Elemente fehlen, Section automatisch injizieren
  if($("blockChecklist") && $("currentBlocksLabel") && $("selectAllBtn") && $("clearAllBtn") && $("resetSelectedBtn") && $("resetAllBtn")) return;
  const root = document.querySelector('#app-root') || document.querySelector('main') || document.body;
  const sec = document.createElement('section');
  sec.className = 'blocks';
  sec.innerHTML = `
    <h2>Blöcke wählen</h2>
    <div class="block-actions">
      <button id="selectAllBtn">Alle</button>
      <button id="clearAllBtn">Leeren</button>
    </div>
    <div id="blockChecklist" class="checklist" aria-label="Blöcke"></div>
    <div class="stats">
      <div>Aktive Blöcke: <span id="currentBlocksLabel">–</span></div>
      <div>Richtig: <span id="statCorrect">0</span> | Falsch: <span id="statWrong">0</span></div>
      <div>Gewichtung: <span id="weightInfo">aktiv</span></div>
    </div>
    <div class="reset-actions">
      <button id="resetSelectedBtn">Auswahl reset</button>
      <button id="resetAllBtn">Alles reset</button>
    </div>`;
  root.prepend(sec);
}

function bindEls(){
  els.blockChecklist = $("blockChecklist");
  els.selectAllBtn = $("selectAllBtn");
  els.clearAllBtn = $("clearAllBtn");
  els.presetSelect = $("presetSelect");
  els.modeSelect = $("modeSelect");
  els.mcEnabled = $("mcEnabled");
  els.weightedEnabled = $("weightedEnabled");
  els.hintsEnabled = $("hintsEnabled");
  els.nextBtn = $("nextBtn");
  els.checkBtn = $("checkBtn");
  els.promptLabel = $("promptLabel");
  els.promptText = $("promptText");
  els.optionsList = $("optionsList");
  els.mcArea = $("mcArea");
  els.feedback = $("feedback");
  els.hintArea = $("hintArea");
  els.statCorrect = $("statCorrect");
  els.statWrong = $("statWrong");
  els.weightInfo = $("weightInfo");
  els.currentBlocksLabel = $("currentBlocksLabel");
}

function loadVocab(){ try{ return JSON.parse(localStorage.getItem(LS_VOCAB)||'{}'); }catch(e){ return {}; } }
function saveVocab(v){ localStorage.setItem(LS_VOCAB, JSON.stringify(v)); }
function loadStats(){ try{ return JSON.parse(localStorage.getItem(LS_STATS)||'{}'); }catch(e){ return {}; } }
function saveStats(s){ localStorage.setItem(LS_STATS, JSON.stringify(s)); }
function loadSync(){ try{ return JSON.parse(localStorage.getItem(LS_SYNC)||'{}'); }catch(e){ return {}; } }
function saveSync(m){ localStorage.setItem(LS_SYNC, JSON.stringify(m)); }

async function fetchCentral(){
  try{ const res = await fetch(CENTRAL_URL, { cache: 'no-store' }); if(!res.ok) throw new Error('HTTP '+res.status); return await res.json(); }
  catch(e){ console.warn('Zentrale Liste konnte nicht geladen werden:', e); return null; }
}
function mergeCentralIntoLocal(central){
  const local = loadVocab(); const out = { ...local };
  const src = (central && central.units) ? central.units : {};
  for(const unit of Object.keys(src)){
    const list = Array.isArray(src[unit]) ? src[unit] : [];
    if(!out[unit]) out[unit] = [];
    const existing = new Set(out[unit].map(key));
    list.forEach(w=>{ if(!existing.has(key(w))) out[unit].push(w); });
  }
  saveVocab(out); initStats();
}
async function initCentralSync(){
  const central = await fetchCentral();
  if(central){ const newVersion = central.version||'unknown'; const meta = loadSync(); if(newVersion!==meta.version){ mergeCentralIntoLocal(central); saveSync({version:newVersion}); } }
}

function initStats(){
  const stats = loadStats(); if(!stats.blocks) stats.blocks={}; if(!stats.words) stats.words={};
  const vocab = loadVocab();
  UNIT_META.forEach(u=>{
    if(!stats.blocks[u.id]) stats.blocks[u.id] = {correct:0,wrong:0};
    if(!stats.words[u.id]) stats.words[u.id] = {};
    (vocab[u.id]||[]).forEach(w=>{ const k=key(w); if(!stats.words[u.id][k]) stats.words[u.id][k] = {correct:0,wrong:0}; });
  });
  saveStats(stats);
}

function updateStatsUI(){
  els.weightInfo && (els.weightInfo.textContent = els.weightedEnabled?.checked ? 'aktiv' : 'aus');
  if(!activeBlockIds.length){ els.statCorrect.textContent='0'; els.statWrong.textContent='0'; return; }
  const stats = loadStats();
  const agg = activeBlockIds.reduce((acc,id)=>{ const s=stats.blocks[id]||{correct:0,wrong:0}; acc.correct+=s.correct; acc.wrong+=s.wrong; return acc; },{correct:0,wrong:0});
  els.statCorrect.textContent = agg.correct; els.statWrong.textContent = agg.wrong;
}

function record(originBlockId,item,ok){
  const stats = loadStats(); const bs = stats.blocks[originBlockId]; const ws = stats.words[originBlockId][key(item)];
  if(ok){ bs.correct++; ws.correct++; }else{ bs.wrong++; ws.wrong++; }
  saveStats(stats); updateStatsUI();
}

function resetBlock(blockId){ const stats=loadStats(); if(!stats.blocks[blockId]) return; stats.blocks[blockId]={correct:0,wrong:0}; Object.keys(stats.words[blockId]||{}).forEach(k=> stats.words[blockId][k]={correct:0,wrong:0}); saveStats(stats); updateStatsUI(); }
function resetSelected(){ activeBlockIds.forEach(id=> resetBlock(id)); }
function resetAll(){ UNIT_META.forEach(u=> resetBlock(u.id)); }

function renderChecklist(){
  try{
    els.blockChecklist.innerHTML='';
    UNIT_META.forEach(u=>{
      const label=document.createElement('label');
      const cb=document.createElement('input'); cb.type='checkbox'; cb.value=u.id; cb.checked=false; cb.addEventListener('change', syncActiveBlockIds);
      label.appendChild(cb); label.appendChild(document.createTextNode(' '+u.name));
      els.blockChecklist.appendChild(label);
    });
    const first = els.blockChecklist.querySelector('input[value="u1"]'); if(first){ first.checked=true; syncActiveBlockIds(); }
  }catch(e){ console.error('[Blocks] renderChecklist fehlgeschlagen:', e); }
}

function syncActiveBlockIds(){
  activeBlockIds = Array.from(els.blockChecklist.querySelectorAll('input[type=checkbox]:checked')).map(el=>el.value);
  const names = activeBlockIds.map(id=> UNIT_META.find(u=>u.id===id)?.name).filter(Boolean);
  els.currentBlocksLabel.textContent = names.length ? names.join(', ') : '–';
  updateStatsUI(); resetSessionQueue(); els.presetSelect && (els.presetSelect.value='custom');
}

function buildPool(){ const vocab=loadVocab(); const pool=[]; activeBlockIds.forEach(id=> (vocab[id]||[]).forEach(w=> pool.push({w,origin:id})) ); return pool; }

function resetSessionQueue(){
  const base=buildPool(); const weighted=[]; const useW=!!els.weightedEnabled?.checked; const stats=loadStats();
  base.forEach(({w,origin})=>{ const ws=stats.words[origin]?.[key(w)]||{correct:0,wrong:0}; let weight=1; if(useW) weight=Math.max(1, Math.min(5, 1 + ws.wrong - Math.floor(ws.correct*0.5))); for(let i=0;i<weight;i++) weighted.push({w,origin}); });
  sessionQueue=shuffle(weighted);
}

function recentlyAsked(text){ return lastPrompts.some(t=> normalize(t)===normalize(text)); }
function pushHistory(text){ lastPrompts.unshift(text); if(lastPrompts.length>HISTORY_SIZE) lastPrompts.pop(); }

function pickQuestion(){
  const mode=els.modeSelect.value; if(!activeBlockIds.length) return null; if(!sessionQueue.length) resetSessionQueue();
  let tries=Math.min(sessionQueue.length,5); let cand=sessionQueue[0]; const from=mode==='de2en'?'de':'en'; const to=mode==='de2en'?'en':'de';
  while(tries>0 && cand && recentlyAsked(cand.w[from])){ sessionQueue.push(sessionQueue.shift()); cand=sessionQueue[0]; tries--; }
  cand=sessionQueue.shift(); if(!sessionQueue.length) resetSessionQueue();
  const item=cand.w, origin=cand.origin; const prompt=item[from]; const answer=item[to];
  const pool=buildPool(); let options=[answer];
  const distract=shuffle(pool.filter(x=>x.w!==item).map(x=>x.w[to]).filter(x=> normalize(x)!==normalize(answer)));
  while(options.length<4 && distract.length) options.push(distract.pop()); options=shuffle(options);
  currentQ={ origin, from, to, prompt, answer, options, item, answered:false };
  return currentQ;
}

function diffFeedback(user, correct){ const {ua,ub} = simpleDiffLine(user, correct); return `Fast richtig – **Schreibweise prüfen**:<div class="diffline">Dein Wort: ${ua}</div><div class="diffline">Richtig: ${ub}</div>`; }

function disableInputsAfterAnswer(){ els.optionsList.querySelectorAll('button.option-btn').forEach(btn=>{ btn.disabled=true; btn.classList.add('disabled'); }); const free=document.getElementById('freeInput'); if(free){ free.disabled=true; } els.checkBtn && (els.checkBtn.disabled=true); }
function prepareNextUX(){ if(!els.nextBtn) return; els.nextBtn.textContent='Weiter zur nächsten Frage'; els.nextBtn.classList.add('highlight'); setTimeout(()=>{ try{ els.nextBtn.focus(); }catch(e){} },700); }

function showHint(ok){ if(!els.hintsEnabled?.checked){ els.hintArea && els.hintArea.classList.add('hidden'); return; } if(!els.hintArea) return; const mode=els.modeSelect.value; const ans=currentQ.answer; const de=currentQ.from==='de'?currentQ.prompt:ans; const en=currentQ.from==='de'?ans:currentQ.prompt; const content = pickHint(en,de,mode); els.hintArea.innerHTML = `<div class="meta">Lern‑Hinweis (Beta):</div><div>${content}</div>`; els.hintArea.classList.remove('hidden'); }

function onAnswerOnce(userInput){ if(!currentQ || currentQ.answered) return; currentQ.answered=true; const exact = softNorm(userInput)===softNorm(currentQ.answer); let ok = exact; let msg = exact ? '✅ Richtig!' : diffFeedback(userInput, currentQ.answer); els.feedback.innerHTML = msg; record(currentQ.origin, currentQ.item, ok); disableInputsAfterAnswer(); prepareNextUX(); showHint(ok); }

function renderQuestion(){ if(!currentQ) return; els.feedback.textContent=''; els.hintArea && els.hintArea.classList.add('hidden'); els.nextBtn && (els.nextBtn.textContent='Start / Weiter', els.nextBtn.classList.remove('highlight')); els.checkBtn && (els.checkBtn.disabled=false);
  els.promptLabel.textContent = currentQ.from==='de'?'Deutsch':'Englisch'; els.promptText.textContent=currentQ.prompt; pushHistory(currentQ.prompt);
  if(els.mcEnabled?.checked){ els.mcArea.classList.remove('hidden'); els.optionsList.innerHTML=''; els.checkBtn && els.checkBtn.classList.add('hidden'); currentQ.options.forEach(opt=>{ const li=document.createElement('li'); const btn=document.createElement('button'); btn.className='option-btn'; btn.textContent=opt; btn.addEventListener('click',()=> onAnswerOnce(opt)); li.appendChild(btn); els.optionsList.appendChild(li); }); }
  else { els.mcArea.classList.add('hidden'); els.optionsList.innerHTML=''; els.checkBtn && els.checkBtn.classList.remove('hidden'); els.promptText.innerHTML = `${currentQ.prompt}<br/><input id="freeInput" class="option-btn" placeholder="Antwort hier eingeben" />`; setTimeout(()=>{ const input=document.getElementById('freeInput'); if(input){ input.focus(); input.addEventListener('keydown', e=>{ if(e.key==='Enter'){ onAnswerOnce(input.value.trim()); } }); els.checkBtn && els.checkBtn.addEventListener('click', ()=> onAnswerOnce(input.value.trim()) ); } },0); }
}

// Controls
function bindControls(){
  els.nextBtn && els.nextBtn.addEventListener('click', ()=>{ const q=pickQuestion(); if(q) renderQuestion(); else { els.promptText.textContent='Bitte wähle mindestens einen Block.'; } });
  els.resetSelectedBtn && els.resetSelectedBtn.addEventListener('click', ()=> resetSelected());
  els.resetAllBtn && els.resetAllBtn.addEventListener('click',   ()=> resetAll());
  els.weightedEnabled && els.weightedEnabled.addEventListener('change', ()=>{ updateStatsUI(); resetSessionQueue(); });
  els.presetSelect && els.presetSelect.addEventListener('change', e=>{ if(e.target.value==='custom') return; applyPreset(e.target.value); });
  els.selectAllBtn && els.selectAllBtn.addEventListener('click', ()=>{ els.blockChecklist.querySelectorAll('input[type=checkbox]').forEach(cb=> cb.checked=true ); syncActiveBlockIds(); });
  els.clearAllBtn && els.clearAllBtn.addEventListener('click', ()=>{ els.blockChecklist.querySelectorAll('input[type=checkbox]').forEach(cb=> cb.checked=false ); syncActiveBlockIds(); });
}

function applyPreset(val){ const ranges={ 'u1_2':['u1','u2'], 'u1_3':['u1','u2','u3'], 'u3_4':['u3','u4'], 'u1_6':['u1','u2','u3','u4','u5','u6'] }; els.blockChecklist.querySelectorAll('input[type=checkbox]').forEach(cb=> cb.checked=false ); (ranges[val]||[]).forEach(id=>{ const cb=els.blockChecklist.querySelector(`input[value="${id}"]`); if(cb) cb.checked=true; }); syncActiveBlockIds(); }

(async function init(){
  try{
    ensureBlocksSection();
    bindEls();
    bindControls();
    await initCentralSync();
    renderChecklist();
    initStats();
    updateStatsUI();
  }catch(e){ console.error('[INIT] Fehler:', e); }
})();
