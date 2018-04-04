if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then((reg) => {
      console.log('SW Registration successful. Scope is ' + reg.scope);
    }).catch((error) => {
      console.log('SW Registration failed with ' + error);
    });
}

/** 
 * LazyLoader - lazy load entries using callback
 * @constructor
 * @param {function} callback: function to handle loading on intersect
 *  Element is unobserved unless the callback returns false
*/
class LazyLoader {
  constructor(callback) {
    if (('IntersectionObserver' in window)) {
      const ioConfig = {
        root: null,
        rootMargin: '0px',
        threshold: 0.01
      };
      this.callback = callback;
      this.observer = new IntersectionObserver(
        this.onIntersection.bind(this),
        ioConfig
      );
    } else {
      this.observer = null;
    }
  }

  isEnabled() {
    return this.observer !== null;
  }

  onIntersection(observedEntries) {
    observedEntries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (this.callback(entry.target) !== false) {
          this.observer.unobserve(entry.target);
        }
      }
    });
  };

  observeEntry(entry) {
    this.observer.observe(entry);
  }

  static loadPicture(entry) {
    entry.querySelectorAll('source').forEach((source) => {
      source.setAttribute('srcset', source.getAttribute('data-srcset'));
    });
    const img = entry.querySelector('img');
    img.setAttribute('src', img.getAttribute('data-src'));
    return true;
  };
}

/** IDB cache
 * Wrapper object to store and retrieve objects based on id from IndexedDB
*/
class ObjectCache {
  constructor(cachename, autoIncrement = false) {
    this.cachename = cachename;
    this.openDb(autoIncrement);
  }

  openDb(autoIncrement = false) {
    this.cache = idb.open(this.cachename, 1, (upgradeDb) => {
      switch (upgradeDb.oldVersion) {
        case 0:
          const store = upgradeDb.createObjectStore('cache', {
            keyPath: 'id',
            autoIncrement: autoIncrement
          });
          store.createIndex('by-id', 'id');
      }
    });
  }

  getAll() {
    return this.cache.then((db) => {
      return db.transaction('cache')
        .objectStore('cache').index('by-id')
        .getAll();
    });
  }

  get(id) {
    return this.cache.then((db) => {
      return db.transaction('cache')
        .objectStore('cache').get(id);
    });
  }

  putAll(objects) {
    this.cache.then((db) => {
      const tx = db.transaction('cache', 'readwrite');
      const store = tx.objectStore('cache');
      objects.forEach((object) => {
        store.put(object);
      });
    });
  }

  put(object) {
    this.putAll([object]);
  }

  delete(id) {
    this.cache.then((db) => {
      const tx = db.transaction('cache', 'readwrite');
      const store = tx.objectStore('cache');
      store.delete(id);
    });
  }
}
