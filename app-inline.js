
(function(){
  const LS_VOCAB='vocab-data-v1';
  const LS_SYNC='vocab-central-meta';
  const CENTRAL_URL='./vocab/vocab.json';
  const UNIT_META=[{id:'u1',name:'Unit 1'},{id:'u2',name:'Unit 2'},{id:'u3',name:'Unit 3'},{id:'u4',name:'Unit 4'},{id:'u5',name:'Unit 5'},{id:'u6',name:'Unit 6'}];
  function $(id){return document.getElementById(id);}  
  function norm(s){return String(s||'').trim().toLowerCase();}
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function load(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f??null));}catch(e){return f??null;}}
  function save(k,v){localStorage.setItem(k,JSON.stringify(v));}

  let active=[]; function syncActive(){ const host=$("blockChecklist"); active=Array.from(host.querySelectorAll('input[type=checkbox]:checked')).map(el=>el.value); const names=active.map(id=>UNIT_META.find(u=>u.id===id)?.name).filter(Boolean); $("currentBlocksLabel").textContent=names.length?names.join(', '):'–'; }

  function buildPool(){ const v=load(LS_VOCAB,{}); const pool=[]; active.forEach(id=> (v[id]||[]).forEach(w=> pool.push({w,origin:id})) ); return pool; }
  let queue=[]; function nextQ(){ if(!active.length) return null; if(!queue.length){ queue=shuffle(buildPool()); } const cand=queue.shift(); if(!queue.length) queue=shuffle(buildPool()); const mode=$("modeSelect")?.value||'de2en'; const from=mode==='de2en'?'de':'en'; const to=mode==='de2en'?'en':'de'; const item=cand.w; return {prompt:item[from], answer:item[to], to}; }

  function render(q){ if(!q){ $("promptText").textContent='Bitte wähle mindestens einen Block.'; return; } $("promptLabel").textContent=q.to==='en'? 'Deutsch' : 'Englisch'; $("promptText").textContent=q.prompt; const mc=$("mcEnabled")?.checked; const list=$("optionsList"); list.innerHTML=''; if(mc){ const pool=buildPool().map(x=>x.w[q.to]).filter(x=>norm(x)!==norm(q.answer)); const opts=[q.answer]; while(opts.length<4 && pool.length){ opts.push(pool.pop()); } shuffle(opts).forEach(opt=>{ const li=document.createElement('li'); const btn=document.createElement('button'); btn.className='option-btn'; btn.textContent=opt; btn.onclick=()=> check(q,opt); li.appendChild(btn); list.appendChild(li); }); $("mcArea").classList.remove('hidden'); $("checkBtn").classList.add('hidden'); } else { $("mcArea").classList.add('hidden'); $("checkBtn").classList.remove('hidden'); $("promptText").innerHTML = `${q.prompt}<br/><input id="freeInput" class="option-btn" placeholder="Antwort hier eingeben" />`; const inp=document.getElementById('freeInput'); $("checkBtn").onclick=()=> check(q, inp?.value||''); }
  }

  function check(q, user){ const ok = norm(user)===norm(q.answer); $("feedback").innerHTML = ok? '✅ Richtig!' : `❌ Erwartet: <b>${q.answer}</b>`; $("nextBtn").textContent='Weiter zur nächsten Frage'; $("nextBtn").classList.add('highlight'); }

  async function init(){
    $("selectAllBtn").onclick=()=>{ $("blockChecklist").querySelectorAll('input[type=checkbox]').forEach(cb=>cb.checked=true); syncActive(); };
    $("clearAllBtn").onclick=()=>{ $("blockChecklist").querySelectorAll('input[type=checkbox]').forEach(cb=>cb.checked=false); syncActive(); };
    $("blockChecklist").addEventListener('change', syncActive); syncActive();
    const central = await fetch(CENTRAL_URL, {cache:'no-store'}).then(r=>r.json()).catch(()=>null);
    if(central){ const meta=load(LS_SYNC,{}); if(meta.version!==central.version){ save(LS_VOCAB, central.units||{}); save(LS_SYNC, {version:central.version}); }}
    $("nextBtn").onclick=()=>{ const q=nextQ(); render(q); };
  }
  document.addEventListener('DOMContentLoaded', init);
})();
