let requestCache;
let retryInProgress = 0;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then((reg) => {
      console.log('SW Registration successful. Scope is ' + reg.scope);
      requestCache = new ObjectCache('failedRequests', true);
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.message === 'request_failed') {
          requestCache.put(event.data.request);
          showUnsavedChangesToaster();
        }
      });
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'complete') {
          showUnsavedChangesToaster();
        }
      });
    }).catch((error) => {
      console.log('SW Registration failed with ' + error);
    });
}

const showUnsavedChangesToaster = () => {
  requestCache.getAll().then((requests) => {
    if (requests.length) {
      const chg = requests.length == 1 ? 'change' : 'changes';
      showToaster(`${requests.length} ${chg} were not saved, ` +
      `but don't worry, nothing is lost. You can retry saving anytime.`,
      'Retry', runRetryRequests);
    }
  });
}

// document.ononline doesn't seem to be reliable,
// navigator.onLine looks like a better source
const retryIfOnline = () => {
  setTimeout(() => {
    if (navigator.onLine) {
      runRetryRequests();
    } else {
      retryIfOnline();
    }
  }, 2000);
};

const runRetryRequests = () => {
  retryInProgress++;
  if (retryInProgress !== 1) return;
  showToaster('Retrying requests, please wait...', null, null);
  retryRequests().then((success) => {
    if (success) {
      showToaster('Your changes were successfully stored. ' +
      'Reload the page to see the latest changes', 'Reload', () => {
        window.location.reload();
      });
    } else {
      showUnsavedChangesToaster();
      retryIfOnline();
    }
    retryInProgress = 0;
  });
};

const showToaster = (message, btntext, callback) => {
  const toaster = document.querySelector('#toaster');
  if (null !== toaster) {
    toaster.querySelector('#toaster-message')
      .innerHTML = message;
    const button = toaster.querySelector('#toaster-button').querySelector('a');
    if (btntext !== null) {
      button.innerHTML = btntext;
      button.classList.remove('waiting');
    } else {
      button.innerHTML = 'Ok';
      button.classList.add('waiting');
    }
    button.onclick = callback;
    toaster.style.display = 'flex';
  }
};

const hideToaster = () => {
  const toaster = document.querySelector('#toaster');
  if (null !== toaster) {
    toaster.removeAttribute('style');
  }
};

const retryRequests = () => {
  const retries = [];
  return new Promise((resolve) => {
    requestCache.takeAll().then((requests) => {
      requests.forEach((request) => {
        const r = fetch(request.url, {
          method: request.method,
          body: request.body ? JSON.stringify(request.body) : undefined
        });
        retries.push(r);
      });
      Promise.all(retries)
      .then(() => {
        return resolve(true);
      })
      .catch(() => {
        return resolve(false);
      });
    })
    .catch(() => {
      return resolve(false);
    });
  });
};

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

  /**
   * get all elements and delete them from the db
   */
  takeAll() {
    const items = [];
    return new Promise((resolve, reject) => {
      this.cache.then((db) => {
        const tx = db.transaction('cache', 'readwrite');
        tx.objectStore('cache').index('by-id').iterateCursor((cursor) => {
          if (!cursor) return;
          items.push(cursor.value);
          cursor.delete();
          cursor.continue();
        });
        tx.complete.then(() => {
          resolve(items);
        });
      })
      .catch((error) => {
        reject(error);
      });
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
