const currentCache = 'mws-static-v1';
const currentImgCache = 'mws-images-v1';

const currentCaches = [currentCache, currentImgCache];

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  const requestCopy = event.request.clone();

  /* handle API requests */
  if (['POST', 'PUT', 'DELETE']
  .indexOf(event.request.method.toUpperCase()) > -1) {
    event.respondWith(
      fetch(event.request).then((response) => {
        response.clone().json().then((responsedata) => {
          let id;
          let target;
          if ('restaurant_id' in responsedata) {
            // it's a review
            id = responsedata['restaurant_id'];
            target = 'review';
          } else {
            id = responsedata['id'];
            target = 'restaurant';
          }
          sendCacheNotification({
            'target': target,
            'id': id
          });
        });
        return response;
      })
      .catch((error) => {
        sendRequestNotification(requestCopy);
        return new Promise((resolve, reject) => {
          reject('API request failed', error);
        });
      })
    );
    return;
  }

  /* some objects are cached by dbhelper in IndexedDB */
  if (requestUrl.pathname.match('^\/(restaurants|reviews)')) {
    return;
  }

  if (requestUrl.pathname.match(/\.jpg$/i)) {
    event.respondWith(servePhoto(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((response) => {
          if (response.status === 200) {
            return caches.open(currentCache)
              .then((cache) => {
                cache.put(event.request, response.clone());
                return response;
              });
          } else {
            return response;
          }
        })
        .catch((error) => {
          return new Response(
            'The requested resource is currently not available, ' +
            'please try again later', {
              status: 404,
              statusText: error.message
            });
        });
    })
  );
});

self.addEventListener('install', (event) => {
  const cachedUrls = [
    '/',
    '/js/mainbundle.js',
    '/js/detailsbundle.js',
    '/restaurant.html',
    '/index.html',
    '/css/mainstyles.css',
    '/css/detailsstyles.css'
  ];
  event.waitUntil(
    caches.open(currentCache).then((cache) => {
      cache.addAll(cachedUrls);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('mws-') &&
            currentCaches.indexOf(cacheName) === -1;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.servePhoto = (request) => {
  const storageUrl = request.url.replace(/\@\d+\.jpg$/, '');

  return caches.open(currentImgCache).then((cache) => {
    return cache.match(storageUrl).then((response) => {
      if (response) return response;
      return fetch(request).then((networkResponse) => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
};

self.sendCacheNotification = (data) => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        message: 'cache_refresh',
        cacheinfo: data
      });
    });
  });
};

self.sendRequestNotification = (requestCopy) => {
  new Promise((resolve) => {
    requestCopy.json().then((body) => {
      resolve({
        url: requestCopy.url,
        method: requestCopy.method,
        body: body
      });
    })
    .catch(() => {
      resolve({
        url: requestCopy.url,
        method: requestCopy.method
      });
    });
  })
  .then((requestData) => {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          message: 'request_failed',
          request: requestData
        });
      });
    });
  });
};
