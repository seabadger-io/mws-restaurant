if ('serviceWorker' in navigator && false) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then((reg) => {
      console.log('SW Registration successful. Scope is ' + reg.scope);
    }).catch((error) => {
      console.log('SW Registration failed with ' + error);
    });
}

/** 
 * lazyLoader - lazy load entries using callback
 * @constructor
 * @param {function} callback: function to handle loading on intersect
 *  Element is unobserved unless the callback returns false
*/
class lazyLoader {
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

