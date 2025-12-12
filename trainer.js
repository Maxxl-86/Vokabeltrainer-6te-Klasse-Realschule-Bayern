// trainer.js
const DATA_URL = 'data/all_units_v2.json';
let ALL = [];
const $ = id => document.getElementById(id);
const normalize = s => (s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();

async function loadData(){
  const res = await fetch(DATA_URL);
  if(!res.ok) throw new Error('Konnte Daten nicht laden: '+res.status);
  ALL = await res.json();
  const units = Array.from(new Set(ALL.map(x=>x.unit))).sort((a,b)=>a-b);
  $('unit').innerHTML = units.map(u=>`<option value="${u}">Unit ${u}</option>`).join('');
}

const sample = (arr,n)=>{const a=[...arr],out=[];while(a.length&&out.length<n){out.push(a.splice(Math.floor(Math.random()*a.length),1)[0]);}return out};
let current=[], idx=0, hits=0, total=0, direction='EN2DE', mode='practice';

function next(){
  if(idx>=current.length){ finish(); return; }
  const item=current[idx];
  const q = (direction==='EN2DE')? (item.en.display||item.en.term) : item.de.term;
  $('question').textContent = q; $('answer').value=''; $('feedback').innerHTML='';
  $('card').classList.remove('hidden');
}

function check(){
  const item=current[idx];
  const u = normalize($('answer').value);
  let ok=false, expected=[]; let show=[];
  if(direction==='EN2DE'){
    expected = [item.de.term, ...(item.de.alt||[])].map(normalize);
    ok = expected.includes(u);
    show = [item.de.term, ...(item.de.alt||[])];
  } else {
    const answers = [item.en.term, ...(item.en.alt||[])];
    const extra = item.en.term.startsWith('to ')? [item.en.term.slice(3)]:[];
    expected = [...answers, ...extra].map(normalize);
    ok = expected.includes(u);
    show = answers;
  }
  if(ok){ hits++; $('feedback').innerHTML='<span class="ok">Richtig!</span>'; }
  else { $('feedback').innerHTML='<span class="bad">Falsch.</span> Richtige Antwort: '+show.join(' / '); }
  idx++; total++;
}

function finish(){
  $('card').classList.add('hidden');
  const pct = total? Math.round(100*hits/total):0;
  $('stats').classList.remove('hidden');
  $('stats').innerHTML = `<h3>Ergebnis</h3><p>Fragen: <b>${total}</b> · Richtig: <b>${hits}</b> · Quote: <b>${pct}%</b></p>`;
}

$('start').addEventListener('click', ()=>{
  direction=$('direction').value; mode=$('mode').value; const u=parseInt($('unit').value,10);
  const pool = ALL.filter(x=>x.unit===u);
  current = mode==='test'? sample(pool, Math.min(10,pool.length)) : pool;
  idx=0; hits=0; total=0; $('stats').classList.add('hidden'); next();
});
$('check').addEventListener('click', check);
$('next').addEventListener('click', next);

loadData().catch(e=>{ console.error(e); alert('Fehler beim Laden der Vokabeln. Liegt die Datei unter '+DATA_URL+'?'); });
