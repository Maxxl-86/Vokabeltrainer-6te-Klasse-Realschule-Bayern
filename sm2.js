export const SM2 = {
  init(id){
    return { id, ef: 2.5, interval: 0, repetition: 0, due: Date.now() };
  },
  update(rec, correct){
    const q = correct ? 4 : 2;
    rec.ef = rec.ef + (0.1 - (5 - q)*(0.08 + (5 - q)*0.02));
    if(rec.ef < 1.3) rec.ef = 1.3;
    if(!correct){
      rec.repetition = 0;
      rec.interval = 0;
      rec.due = Date.now() + 24*60*60*1000;
      return rec;
    }
    rec.repetition += 1;
    if(rec.repetition == 1){
      rec.interval = 1;
    } else if(rec.repetition == 2){
      rec.interval = 6;
    } else {
      rec.interval = Math.round(rec.interval * rec.ef);
    }
    rec.due = Date.now() + rec.interval*24*60*60*1000;
    return rec;
  }
};
