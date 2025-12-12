
(function(){
  const LS_VOCAB='vocab-data-v1';
  const LS_STATS='vocab-trainer-stats-v4';
  const LS_SYNC='vocab-central-meta';
  const CENTRAL_URL='./vocab/vocab.json';
  const UNIT_META=[{id:'u1',name:'Unit 1'},{id:'u2',name:'Unit 2'},{id:'u3',name:'Unit 3'},{id:'u4',name:'Unit 4'},{id:'u5',name:'Unit 5'},{id:'u6',name:'Unit 6'}];
  function $(id){return document.getElementById(id);}  
  function normalize(s){return String(s||'').trim().toLowerCase();}
  function key(w){return normalize(w.de)+'
'+normalize(w.en);} 
  function loadJSON(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f??null));}catch(e){return f??null;}}
  function saveJSON(k,v){localStorage.setItem(k,JSON.stringify(v));}
  async function fetchJSON(url){try{const res=await fetch(url,{cache:'no-store'}); if(!res.ok) throw new Error('HTTP '+res.status); return await res.json();}catch(e){console.warn('Fetch failed',url,e);return null;}}

  function ensureBlocksSection(){
    if($("blockChecklist")) return;
    const root=document.querySelector('#app-root')||document.body;
    const sec=document.createElement('section'); sec.className='blocks';
    sec.innerHTML=`<h2>Blöcke wählen</h2>
    <div class="block-actions"><button id="selectAllBtn">Alle</button><button id="clearAllBtn">Leeren</button></div>
    <div id="blockChecklist" class="checklist" aria-label="Blöcke"></div>
    <div class="stats"><div>Aktive Blöcke: <span id="currentBlocksLabel">–</span></div>
    <div>Richtig: <span id="statCorrect">0</span> · Falsch: <span id="statWrong">0</span></div>
    <div>Gewichtung: <span id="weightInfo">aktiv</span></div></div>
    <div class="reset-actions"><button id="resetSelectedBtn">Auswahl reset</button><button id="resetAllBtn">Alles reset</button></div>`;
    root.prepend(sec);
  }

  function renderChecklist(){
    const host=$("blockChecklist"); if(!host) return; host.innerHTML='';
    UNIT_META.forEach(u=>{ const label=document.createElement('label'); const cb=document.createElement('input'); cb.type='checkbox'; cb.value=u.id; cb.addEventListener('change', syncActive);
      label.appendChild(cb); label.appendChild(document.createTextNode(' '+u.name)); host.appendChild(label); });
    const first=host.querySelector('input[value="u1"]'); if(first){ first.checked=true; syncActive(); }
    $("selectAllBtn")?.addEventListener('click',()=>{ host.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.checked=true); syncActive(); });
    $("clearAllBtn")?.addEventListener('click',()=>{ host.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.checked=false); syncActive(); });
  }

  let activeIds=[]; function syncActive(){
    const host=$("blockChecklist"); activeIds=Array.from(host.querySelectorAll('input[type=checkbox]:checked')).map(el=>el.value);
    const names=activeIds.map(id=>UNIT_META.find(u=>u.id===id)?.name).filter(Boolean);
    $("currentBlocksLabel").textContent=names.length?names.join(', '):'–';
  }

  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

  function buildPool(){ const v=loadJSON(LS_VOCAB,{}); const pool=[]; activeIds.forEach(id=> (v[id]||[]).forEach(w=> pool.push({w,origin:id})) ); return pool; }

  let queue=[]; function resetQueue(){ queue=shuffle(buildPool()); }

  function nextQ(){ if(!activeIds.length) return null; if(!queue.length) resetQueue(); const cand=queue.shift(); if(!queue.length) resetQueue(); const mode=$("modeSelect")?.value||'de2en'; const from=mode==='de2en'?'de':'en'; const to=mode==='de2en'?'en':'de'; const item=cand.w; return {origin:cand.origin, from,to, prompt:item[from], answer:item[to], item}; }

  function renderQ(q){ if(!q){ $("promptText").textContent='Bitte wähle mindestens einen Block.'; return; }
    $("promptLabel").textContent=q.from==='de'?'Deutsch':'Englisch';
    $("promptText").textContent=q.prompt;
    const mcOn = $("mcEnabled")?.checked; const list=$("optionsList"); const mc=$("mcArea");
    list.innerHTML=''; if(mcOn){ mc.classList.remove('hidden'); const pool=buildPool().map(x=>x.w[q.to]).filter(ans=>normalize(ans)!==normalize(q.answer)); const opts=[q.answer]; while(opts.length<4 && pool.length){ opts.push(pool.pop()); } shuffle(opts).forEach(opt=>{ const li=document.createElement('li'); const btn=document.createElement('button'); btn.className='option-btn'; btn.textContent=opt; btn.addEventListener('click',()=>onAnswer(q,opt)); li.appendChild(btn); list.appendChild(li); }); $("checkBtn").classList.add('hidden'); } else { mc.classList.add('hidden'); $("checkBtn").classList.remove('hidden'); $("promptText").innerHTML = `${q.prompt}<br/><input id="freeInput" class="option-btn" placeholder="Antwort hier eingeben" />`; const inp=document.getElementById('freeInput'); inp?.addEventListener('keydown',e=>{ if(e.key==='Enter') onAnswer(q, inp.value.trim()); }); $("checkBtn").onclick=()=> onAnswer(q, inp?.value.trim()||''); }
  }

  function onAnswer(q,user){ const ok = normalize(user)===normalize(q.answer); $("feedback").innerHTML = ok? '✅ Richtig!' : `❌ Erwartet: <b>${q.answer}</b>`; $("nextBtn").textContent='Weiter zur nächsten Frage'; $("nextBtn").classList.add('highlight'); $("nextBtn").focus(); }

  async function init(){
    ensureBlocksSection(); renderChecklist();
    const central=await fetchJSON(CENTRAL_URL); if(central){ const meta=loadJSON(LS_SYNC,{}); if(meta.version!==central.version){
      const local=loadJSON(LS_VOCAB,{}); const out={...local}; const src=central.units||{}; for(const u of Object.keys(src)){ out[u]=src[u]; }
      saveJSON(LS_VOCAB,out); saveJSON(LS_SYNC,{version:central.version});
    }}
    $("nextBtn").onclick=()=>{ const q=nextQ(); renderQ(q); };
  }
  document.addEventListener('DOMContentLoaded', init);
})();
