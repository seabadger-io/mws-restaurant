if ('serviceWorker' in navigator && false) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then((reg) => {
      console.log('SW Registration successful. Scope is ' + reg.scope);
    }).catch((error) => {
      console.log('SW Registration failed with ' + error);
    });
}

/** 
 * lazyLoader - load picture tags of HTML elements dynamically
*/
class lazyLoader {
  constructor() {
    if (('IntersectionObserver' in window)) {
      const ioConfig = {
        root: null,
        rootMargin: '0px',
        threshold: 0.01
      };
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
        this.observer.unobserve(entry.target);
        lazyLoader.loadPicture(entry.target);
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
  };
}

