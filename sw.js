const currentCache = 'mws-static-v1';
const currentImgCache = 'mws-images-v1';

const currentCaches = [currentCache, currentImgCache];

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    if (requestUrl.pathname.endsWith('.jpg')) {
        event.respondWith(servePhoto(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((response) => {
                return caches.open(currentCache)
                .then((cache) => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            })
            .catch((error) => {
                return new Response(
                    'The requested resource is currently not available, ' +
                    'please try again later',
                    { status: 404, statusText: error.message });
            });
        })
    );
});

self.addEventListener('install', (event) => {
    const cachedUrls = [
        '/',
        '/js/app.js',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/js/dbhelper.js',
        '/data/restaurant.json',
        '/restaurant.html',
        '/index.html',
        '/css/styles.css'
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

servePhoto = (request) => {
    const storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

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
