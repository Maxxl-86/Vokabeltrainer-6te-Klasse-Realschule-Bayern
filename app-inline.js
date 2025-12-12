
(function(){
  const APP_VERSION='0.8.1';
  const UNIT_META=[{id:'u1',name:'Unit 1'},{id:'u2',name:'Unit 2'},{id:'u3',name:'Unit 3'},{id:'u4',name:'Unit 4'},{id:'u5',name:'Unit 5'},{id:'u6',name:'Unit 6'}];
  const LS_VOCAB='vocab-data-v1';
  const LS_STATS='vocab-trainer-stats-v4';
  const LS_SYNC='vocab-central-meta';
  const CENTRAL_URL='./vocab/vocab.json';

  function $(id){return document.getElementById(id);} 
  function norm(s){return String(s||'').trim().toLowerCase();}
  function key(w){return norm(w.de)+'
'+norm(w.en);} 
  function load(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f??null));}catch(e){return f??null;}}
  function save(k,v){localStorage.setItem(k, JSON.stringify(v));}
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

  // --- Blocks selection ---
  let activeIds=[];
  function syncActive(){
    const host=$("blockChecklist");
    activeIds = Array.from(host.querySelectorAll('input[type=checkbox]:checked')).map(el=>el.value);
    const names = activeIds.map(id=> UNIT_META.find(u=>u.id===id)?.name).filter(Boolean);
    $("currentBlocksLabel").textContent = names.length ? names.join(', ') : '–';
    updateStatsUI(); resetQueue();
  }
  $("selectAllBtn")?.addEventListener('click', ()=>{ $("blockChecklist").querySelectorAll('input[type=checkbox]').forEach(cb=>cb.checked=true); syncActive(); });
  $("clearAllBtn")?.addEventListener('click', ()=>{ $("blockChecklist").querySelectorAll('input[type=checkbox]').forEach(cb=>cb.checked=false); syncActive(); });
  $("blockChecklist")?.addEventListener('change', syncActive);
  syncActive();

  // --- Stats ---
  function initStats(){ const stats=load(LS_STATS,{blocks:{},words:{}}); UNIT_META.forEach(u=>{ if(!stats.blocks[u.id]) stats.blocks[u.id]={correct:0,wrong:0}; if(!stats.words[u.id]) stats.words[u.id]={}; }); save(LS_STATS,stats); }
  function updateStatsUI(){ const stats=load(LS_STATS,{blocks:{}}); if(!activeIds.length){ $("statCorrect").textContent='0'; $("statWrong").textContent='0'; return; } const agg=activeIds.reduce((acc,id)=>{ const s=stats.blocks[id]||{correct:0,wrong:0}; acc.correct+=s.correct; acc.wrong+=s.wrong; return acc; },{correct:0,wrong:0}); $("statCorrect").textContent=agg.correct; $("statWrong").textContent=agg.wrong; }
  function record(origin,item,ok){ const stats=load(LS_STATS,{blocks:{},words:{}}); stats.blocks[origin].correct += ok?1:0; stats.blocks[origin].wrong += ok?0:1; const k=key(item); if(!stats.words[origin][k]) stats.words[origin][k]={correct:0,wrong:0}; if(ok) stats.words[origin][k].correct++; else stats.words[origin][k].wrong++; save(LS_STATS,stats); updateStatsUI(); }
  $("resetSelectedBtn")?.addEventListener('click', ()=>{ const s=load(LS_STATS,{blocks:{},words:{}}); activeIds.forEach(id=>{ s.blocks[id]={correct:0,wrong:0}; Object.keys(s.words[id]||{}).forEach(k=> s.words[id][k]={correct:0,wrong:0}); }); save(LS_STATS,s); updateStatsUI(); });
  $("resetAllBtn")?.addEventListener('click', ()=>{ const s=load(LS_STATS,{blocks:{},words:{}}); UNIT_META.forEach(u=>{ s.blocks[u.id]={correct:0,wrong:0}; s.words[u.id]={}; }); save(LS_STATS,s); updateStatsUI(); });

  // --- Vocab ---
  async function ensureVocab(){
    let central=null; try{ const res=await fetch(CENTRAL_URL,{cache:'no-store'}); if(res.ok) central=await res.json(); }catch(e){ central=null; }
    const meta=load(LS_SYNC,{});
    if(central && meta.version!==central.version){ const out=load(LS_VOCAB,{}); const src=central.units||{}; for(const u of Object.keys(src)){ out[u]=src[u]; } save(LS_VOCAB,out); save(LS_SYNC,{version:central.version}); }
    const v=load(LS_VOCAB,{}); if(!v.u1&&!v.u2&&!v.u3&&!v.u4&&!v.u5&&!v.u6){ // fallback seed
      const seed = window.VOCAB_SEED || {};
      save(LS_VOCAB, seed);
    }
    initStats(); updateStatsUI();
  }

  function buildPool(){ const v=load(LS_VOCAB,{}); const pool=[]; activeIds.forEach(id=> (v[id]||[]).forEach(w=> pool.push({w,origin:id})) ); return pool; }
  let queue=[]; function resetQueue(){ queue=shuffle(buildPool()); }

  function pickQuestion(){ if(!activeIds.length) return null; if(!queue.length) resetQueue(); const cand=queue.shift(); if(!queue.length) resetQueue(); const mode=$("modeSelect")?.value||'de2en'; const from=mode==='de2en'?'de':'en'; const to=mode==='de2en'?'en':'de'; const item=cand.w; return {origin:cand.origin, from,to, prompt:item[from], answer:item[to], item}; }

  function renderQuestion(q){ if(!q){ $("promptText").textContent='Bitte wähle mindestens einen Block.'; return; }
    $("promptLabel").textContent = q.from==='de'?'Deutsch':'Englisch';
    $("promptText").textContent = q.prompt;
    const mcOn = $("mcEnabled")?.checked;
    const list=$("optionsList"); const mc=$("mcArea"); list.innerHTML='';
    if(mcOn){ mc.classList.remove('hidden'); const pool=buildPool().map(x=>x.w[q.to]).filter(ans=>norm(ans)!==norm(q.answer)); const opts=[q.answer]; while(opts.length<4 && pool.length){ opts.push(pool.pop()); } shuffle(opts).forEach(opt=>{ const li=document.createElement('li'); const btn=document.createElement('button'); btn.className='option-btn'; btn.textContent=opt; btn.addEventListener('click',()=> onAnswer(q,opt)); li.appendChild(btn); list.appendChild(li); }); $("checkBtn").classList.add('hidden'); }
    else { mc.classList.add('hidden'); $("checkBtn").classList.remove('hidden'); $("promptText").innerHTML = `${q.prompt}<br/><input id="freeInput" class="option-btn" placeholder="Antwort hier eingeben" />`; const inp=document.getElementById('freeInput'); inp?.addEventListener('keydown',e=>{ if(e.key==='Enter') onAnswer(q, inp.value.trim()); }); $("checkBtn").onclick = ()=> onAnswer(q, inp?.value.trim()||''); }
  }

  function onAnswer(q,user){ const ok = norm(user)===norm(q.answer); $("feedback").innerHTML = ok? '✅ Richtig!' : `❌ Erwartet: <b>${q.answer}</b>`; record(q.origin,q.item,ok); $("nextBtn").textContent='Weiter zur nächsten Frage'; $("nextBtn").classList.add('highlight'); }

  $("nextBtn").addEventListener('click', ()=>{ const q=pickQuestion(); renderQuestion(q); });
  $("modeSelect").addEventListener('change', ()=>{ const q=pickQuestion(); renderQuestion(q); });

  // Version badge minimal
  const badge=document.createElement('div'); badge.style.position='fixed'; badge.style.right='12px'; badge.style.bottom='12px'; badge.style.background='#0b5fff'; badge.style.color='#fff'; badge.style.padding='6px 10px'; badge.style.borderRadius='8px'; badge.style.fontSize='12px'; badge.style.boxShadow='0 2px 8px rgba(0,0,0,.2)'; badge.textContent='v'+APP_VERSION; document.body.appendChild(badge);

  document.addEventListener('DOMContentLoaded', ensureVocab);
})();
