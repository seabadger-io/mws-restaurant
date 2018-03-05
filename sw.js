const currentCache = 'mws-restaurant';

self.addEventListener('fetch', (event) => {
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
