
(function(){
  var LS_VOCAB='vocab-data-v1';
  var LS_STATS='vocab-trainer-stats-v4';
  var LS_SYNC='vocab-central-meta';
  var CENTRAL_URL='./vocab/vocab.json';

  function $(id){ return document.getElementById(id); }
  function normalize(s){ return String(s||'').trim().toLowerCase(); }
  function key(w){ return normalize(w.de)+'
'+normalize(w.en); }
  function loadJSON(k,f){ try{ var v = localStorage.getItem(k); return v? JSON.parse(v): (f||null); }catch(e){ return f||null; } }
  function saveJSON(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var tmp=a[i]; a[i]=a[j]; a[j]=tmp; } return a; }
  function canonicalUnitId(k){ var s=String(k||'').trim().toLowerCase(); var m; if((m=s.match(/^u([1-6])$/))) return 'u'+m[1]; if((m=s.match(/^unit\s*([1-6])$/))) return 'u'+m[1]; if((m=s.match(/^([1-6])$/))) return 'u'+m[1]; return s; }
  function unitLabel(id){ var m=String(id||'').match(/^u([1-6])$/); return m? ('Unit '+m[1]) : String(id||''); }

  function ensureBlocksSection(){
    if($("blockChecklist") && $("currentBlocksLabel") && $("selectAllBtn") && $("clearAllBtn") && $("resetSelectedBtn") && $("resetAllBtn")) return;
    var root = document.querySelector('#app-root') || document.body;
    var sec = document.createElement('section'); sec.className = 'blocks card';
    sec.innerHTML = ''+
      '<h2>Blöcke wählen</h2>'+
      '<div class="block-actions">'+
        '<button id="selectAllBtn">Alle</button> '+
        '<button id="clearAllBtn">Leeren</button>'+
      '</div>'+
      '<div id="blockChecklist" class="checklist" aria-label="Blöcke"></div>'+
      '<div class="stats">'+
        '<div>Aktive Blöcke: <span id="currentBlocksLabel">–</span></div>'+
        '<div>Richtig: <span id="statCorrect">0</span> · Falsch: <span id="statWrong">0</span></div>'+
        '<div>Gewichtung: <span id="weightInfo">aktiv</span></div>'+
      '</div>'+
      '<div class="reset-actions">'+
        '<button id="resetSelectedBtn">Auswahl reset</button> '+
        '<button id="resetAllBtn">Alles reset</button>'+
      '</div>';
    root.insertBefore(sec, root.firstChild);
  }

  function renderChecklistFromVocab(vocab){
    var host = $("blockChecklist"); if(!host) return;
    host.innerHTML='';
    var keys = Object.keys(vocab||{});
    if(!keys.length){
      // Fallback: 6 Units anzeigen
      keys = ['u1','u2','u3','u4','u5','u6'];
      vocab = {u1:[],u2:[],u3:[],u4:[],u5:[],u6:[]};
    }
    // Canonical + sort numerisch u1..u6
    var seen = {}; var ordered = [];
    keys.forEach(function(k){ var id=canonicalUnitId(k); if(!seen[id]){ seen[id]=true; ordered.push(id); }});
    ordered.sort(function(a,b){
      var ma=a.match(/^u(\d)$/), mb=b.match(/^u(\d)$/);
      if(ma && mb) return parseInt(ma[1])-parseInt(mb[1]);
      return String(a).localeCompare(String(b));
    });
    ordered.forEach(function(id){
      var label = unitLabel(id);
      var el = document.createElement('label');
      var cb = document.createElement('input'); cb.type='checkbox'; cb.value=id; cb.checked=false; cb.addEventListener('change', syncActive);
      var count = (vocab[id]||[]).length;
      el.appendChild(cb);
      el.appendChild(document.createTextNode(' '+label+(count?(' ('+count+')'):'') ));
      host.appendChild(el);
    });
    var first = host.querySelector('input[value="u1"]'); if(first){ first.checked=true; syncActive(); }
    var selectAllBtn=$("selectAllBtn"), clearAllBtn=$("clearAllBtn");
    if(selectAllBtn) selectAllBtn.onclick=function(){ host.querySelectorAll('input[type=checkbox]').forEach(function(cb){ cb.checked=true; }); syncActive(); };
    if(clearAllBtn) clearAllBtn.onclick=function(){ host.querySelectorAll('input[type=checkbox]').forEach(function(cb){ cb.checked=false; }); syncActive(); };
  }

  var activeIds=[]; function syncActive(){
    var host=$("blockChecklist"); if(!host) return;
    activeIds = Array.prototype.slice.call(host.querySelectorAll('input[type=checkbox]:checked')).map(function(el){return el.value;});
    var names = activeIds.map(unitLabel);
    var lbl=$("currentBlocksLabel"); if(lbl) lbl.textContent = names.length? names.join(', '): '–';
    updateStatsUI(); resetQueue();
  }

  function loadStats(){ var s=loadJSON(LS_STATS,{}); if(!s.blocks) s.blocks={}; if(!s.words) s.words={}; return s; }
  function saveStats(s){ saveJSON(LS_STATS,s); }
  function updateStatsUI(){ var w=$("weightedEnabled"); var info=$("weightInfo"); if(info) info.textContent = (w && w.checked)? 'aktiv':'aus'; var c=$("statCorrect"), wr=$("statWrong"); if(!c||!wr){return;} var stats=loadStats(); var agg={correct:0,wrong:0}; activeIds.forEach(function(id){ var b=stats.blocks[id]||{correct:0,wrong:0}; agg.correct+=b.correct; agg.wrong+=b.wrong; }); c.textContent=agg.correct; wr.textContent=agg.wrong; }

  function record(originId,item,ok){ var stats=loadStats(); if(!stats.blocks[originId]) stats.blocks[originId]={correct:0,wrong:0}; if(!stats.words[originId]) stats.words[originId]={}; var k=key(item); if(!stats.words[originId][k]) stats.words[originId][k]={correct:0,wrong:0}; if(ok){ stats.blocks[originId].correct++; stats.words[originId][k].correct++; } else { stats.blocks[originId].wrong++; stats.words[originId][k].wrong++; } saveStats(stats); updateStatsUI(); }
  function resetBlock(id){ var stats=loadStats(); stats.blocks[id]={correct:0,wrong:0}; stats.words[id]={}; saveStats(stats); updateStatsUI(); }
  function resetQueue(){ queue = shuffle(buildPool()); }

  function buildPool(){ var vocab=loadJSON(LS_VOCAB,{}); var pool=[]; activeIds.forEach(function(id){ (vocab[id]||[]).forEach(function(w){ pool.push({w:w, origin:id}); }); }); return pool; }

  var queue=[]; var current=null;
  function pickQuestion(){ if(!activeIds.length) return null; if(!queue.length) resetQueue(); var cand=queue.shift(); if(!queue.length) resetQueue(); var mode = ($("modeSelect")? $("modeSelect").value : 'de2en'); var from = (mode==='de2en')? 'de':'en'; var to = (mode==='de2en')? 'en':'de'; var item=cand.w; var prompt=item[from]; var answer=item[to]; var pool=buildPool(); var options=[answer]; // Distraktoren
    var distract = shuffle(pool.filter(function(x){ return x.w!==item; }).map(function(x){ return x.w[to]; }).filter(function(x){ return normalize(x)!==normalize(answer); }));
    while(options.length<4 && distract.length){ options.push(distract.pop()); }
    options = shuffle(options);
    current = {origin:cand.origin, from:from, to:to, prompt:prompt, answer:answer, item:item, options:options, answered:false};
    return current;
  }

  function renderQuestion(){ if(!current) return; var fb=$("feedback"); if(fb) fb.textContent=''; var mcArea=$("mcArea"); var list=$("optionsList"); var check=$("checkBtn"); var promptText=$("promptText"), promptLabel=$("promptLabel"); if(promptLabel) promptLabel.textContent = (current.from==='de')? 'Deutsch':'Englisch'; if(promptText) promptText.textContent = current.prompt; if(list) list.innerHTML=''; if($("mcEnabled") && $("mcEnabled").checked){ if(mcArea) mcArea.classList.remove('hidden'); if(check) check.classList.add('hidden'); current.options.forEach(function(opt){ var li=document.createElement('li'); var btn=document.createElement('button'); btn.className='option-btn'; btn.textContent=opt; btn.onclick=function(){ onAnswer(opt); }; li.appendChild(btn); list.appendChild(li); }); } else { if(mcArea) mcArea.classList.add('hidden'); if(check) check.classList.remove('hidden'); if(promptText) promptText.innerHTML = current.prompt + '<br/>' + '<input id="freeInput" class="option-btn" placeholder="Antwort hier eingeben" />'; var inp=document.getElementById('freeInput'); if(inp){ inp.onkeydown=function(e){ if(e.key==='Enter'){ onAnswer(inp.value.trim()); } }; if(check){ check.onclick=function(){ onAnswer(inp.value.trim()); }; } }
    }
  }

  function onAnswer(user){ if(!current || current.answered) return; current.answered=true; var ok = normalize(user)===normalize(current.answer); var fb=$("feedback"); if(fb) fb.innerHTML = ok? '✅ Richtig!' : ('❌ Erwartet: <b>'+current.answer+'</b>'); record(current.origin, current.item, ok); var next=$("nextBtn"); if(next){ next.textContent='Weiter zur nächsten Frage'; next.classList.add('highlight'); next.focus(); }
  }

  function migrateCentralUnits(central){ // Map beliebige Schlüssel auf u1..u6
    var out={}; var units = central && central.units? central.units : {};
    Object.keys(units).forEach(function(k){ var id = canonicalUnitId(k); out[id] = (units[k]||[]); });
    return { version: (central && central.version? central.version : 'unknown'), units: out };
  }

  function injectBlocksAndData(){
    ensureBlocksSection();
    var vocabLocal = loadJSON(LS_VOCAB, {});
    // Falls keine Daten oder falsche Schlüssel vorhanden -> central laden und migrieren
    var empty = Object.keys(vocabLocal).length===0;
    var needsCanon = Object.keys(vocabLocal).some(function(k){ return !/^u[1-6]$/.test(canonicalUnitId(k)); });
    fetch(CENTRAL_URL, {cache:'no-store'}).then(function(res){ if(!res.ok) return null; return res.json(); }).then(function(central){
      if(central){ var mig = migrateCentralUnits(central); var meta = loadJSON(LS_SYNC,{}); if(!meta || meta.version!==mig.version || empty || needsCanon){ var out={}; Object.keys(mig.units).forEach(function(id){ out[id] = mig.units[id]; }); saveJSON(LS_VOCAB, out); saveJSON(LS_SYNC, {version:mig.version}); }
      }
      // Jetzt Checkliste aus lokalem Vokab aufbauen
      renderChecklistFromVocab(loadJSON(LS_VOCAB, {}));
      // Diagnose-Daten anzeigen
      setupDiag();
    }).catch(function(){ renderChecklistFromVocab(loadJSON(LS_VOCAB, {})); setupDiag(); });
  }

  function setupDiag(){ var diagBtn=$("diagBtn"); var diag=$("diag"), box=$("diagContent"); if(!diagBtn||!box) return; diagBtn.onclick=function(){ var open = !diag.classList.contains('hidden'); if(open){ diag.classList.add('hidden'); return; } var meta = loadJSON(LS_SYNC,{}); var vocab = loadJSON(LS_VOCAB,{}); var stats = loadJSON(LS_STATS,{}); var lines=[]; lines.push('Version: '+ (meta && meta.version? meta.version : 'unknown')); Object.keys(vocab||{}).forEach(function(id){ lines.push(' '+unitLabel(id)+': '+ (vocab[id]||[]).length +' Wörter'); }); box.textContent = lines.join('
'); diag.classList.remove('hidden'); };
  }

  function init(){
    injectBlocksAndData();
    var next=$("nextBtn"); if(next) next.onclick=function(){ var q=pickQuestion(); if(q) renderQuestion(); else { var p=$("promptText"); if(p) p.textContent='Bitte wähle mindestens einen Block.'; } };
    var resetSel=$("resetSelectedBtn"), resetAll=$("resetAllBtn");
    if(resetSel) resetSel.onclick=function(){ activeIds.forEach(function(id){ resetBlock(id); }); };
    if(resetAll) resetAll.onclick=function(){ ['u1','u2','u3','u4','u5','u6'].forEach(function(id){ resetBlock(id); }); };
    var w=$("weightedEnabled"); if(w) w.onchange=function(){ updateStatsUI(); resetQueue(); };
    var preset=$("presetSelect"); if(preset) preset.onchange=function(e){ if(preset.value==='custom') return; var ranges={ 'u1_2':['u1','u2'], 'u1_3':['u1','u2','u3'], 'u3_4':['u3','u4'], 'u1_6':['u1','u2','u3','u4','u5','u6'] }; var host=$("blockChecklist"); if(!host) return; host.querySelectorAll('input[type=checkbox]').forEach(function(cb){ cb.checked=false; }); (ranges[preset.value]||[]).forEach(function(id){ var cb=host.querySelector('input[value="'+id+'"]'); if(cb) cb.checked=true; }); syncActive(); };
  }

  document.addEventListener('DOMContentLoaded', init);
})();
