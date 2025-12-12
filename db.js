export const DB = {
  db: null,
  open(){
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('vokabeltrainer', 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if(!db.objectStoreNames.contains('progress')){
          const store = db.createObjectStore('progress', { keyPath: 'id' });
          store.createIndex('due', 'due');
        }
        if(!db.objectStoreNames.contains('settings')){
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };
      req.onsuccess = () => { this.db = req.result; resolve(); };
      req.onerror = () => reject(req.error);
    });
  },
  getAllProgress(){
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('progress', 'readonly');
      const store = tx.objectStore('progress');
      const req = store.getAll();
      req.onsuccess = () => {
        const map = new Map();
        req.result.forEach(r => map.set(r.id, r));
        resolve(map);
      };
      req.onerror = () => reject(req.error);
    });
  },
  putProgress(rec){
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('progress', 'readwrite');
      const store = tx.objectStore('progress');
      const req = store.put(rec);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },
  clearStore(name){
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(name, 'readwrite');
      const store = tx.objectStore(name);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },
  migrateFromLocalStorage(){
    const key = 'vokabeltrainer_progress';
    try {
      const raw = localStorage.getItem(key);
      if(raw){
        const list = JSON.parse(raw);
        return Promise.all(list.map(item => this.putProgress(item))).then(()=>{
          localStorage.removeItem(key);
        });
      }
    } catch(e){}
    return Promise.resolve();
  }
};
