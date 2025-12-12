export const Utils = {
  renderHint(h){
    const parts = [];
    if(h.collocations){ parts.push('<b>Kollokationen:</b> ' + h.collocations.join(', ')); }
    if(h.examples){ parts.push('<b>Beispiel:</b> ' + h.examples.join(' · ')); }
    if(h.note){ parts.push('<b>Hinweis:</b> ' + h.note); }
    return parts.join('<br>');
  },
  parseCSV(text){
    const lines = text.split(/?
/).filter(l=>l.trim().length);
    const out = [];
    for(let i=0;i<lines.length;i++){
      const row = lines[i].split(',').map(s=>s.trim());
      if(row.length < 2) continue;
      const [de,en,unit] = row;
      out.push({de,en,unit:unit||'uX'});
    }
    return out;
  },
  downloadJSON(obj, filename){
    const blob = new Blob([JSON.stringify(obj, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }
};
