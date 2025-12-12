
(function(){
  const LS_VOCAB='vocab-data-v1';
  function load(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f??null));}catch(e){return f??null;}}
  function save(k,v){localStorage.setItem(k, JSON.stringify(v));}

  function parseLegacyText(txt){
    // Erwartet: "version ... units u1 de ... en ... u2 ..."
    const units = {u1:[],u2:[],u3:[],u4:[],u5:[],u6:[]};
    const m = txt.match(/units\s+u[1-6][\s\S]*/i);
    const body = m? m[0] : txt;
    const parts = body.split(/u([1-6])/i);
    for(let i=1;i<parts.length;i+=2){
      const id='u'+parts[i];
      const seg=parts[i+1]||'';
      const re = /de\s+(.*?)\s+en\s+(.*?)(?=\s+de\s+|u[1-6]|$)/gis;
      let mm; while((mm=re.exec(seg))){
        const de = mm[1].trim(); const en = mm[2].trim();
        if(de && en) units[id].push({de,en});
      }
    }
    return units;
  }

  document.getElementById('run').onclick = async()=>{
    const f=document.getElementById('file').files[0]; if(!f) return alert('Datei wählen');
    const text=await f.text(); let data;
    try{ const obj=JSON.parse(text); if(obj.units) data=obj.units; else data=obj; }
    catch{ data=parseLegacyText(text); }
    const existing = load(LS_VOCAB,{}); const out={...existing};
    ['u1','u2','u3','u4','u5','u6'].forEach(id=>{ out[id]=data[id]||out[id]||[]; });
    save(LS_VOCAB,out);
    document.getElementById('out').textContent = 'Import OK: '+['u1','u2','u3','u4','u5','u6'].map(id=> id+':'+(out[id]?.length||0)).join(' | ');
  };
})();
