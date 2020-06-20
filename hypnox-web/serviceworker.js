// This is the "Offline copy of pages" service worker Created using
// www.pwabuilder.com

// Install stage sets up the index page (home page) in the cache and opens a
// new cache

self.addEventListener('install', (e) => {
    let indexPage = new Request('index.html');
    e.waitUntil(
        fetch(indexPage).then( (response) => {
            return caches.open('eegreview-offline').then( (cache) => {
                console.log(`[ServiceWroker: event 'install'] Cached index page ${response.url} into ${indexPage}`);
                return cache.put(indexPage, response);
            }).catch( (err) => {
                console.log(`[ServiceWorker: event 'install'] ${err}`);
            });
        }));
});

//If any fetch fails, it will look for the request in the cache and serve it from there first
self.addEventListener('fetch', (e) => {
    var updateCache = (request) => {
        return caches.open('eegreview-offline').then(function (cache) {
            return fetch(request).then( (response) => {
                return cache.put(request, response);
            }).catch( (e) => {
                console.log(e);
            });
        });
    };

    e.waitUntil(updateCache(e.request));

    e.respondWith(
        fetch(e.request).catch((err) => {
            console.log(`[ServiceWroker: event 'fetch'] Network request Failed. Serving content from cache: ${err}`);

            //Check to see if you have it in the cache
            //Return response
            //If not in the cache, then return error page
            return caches.open('eegreview-offline').then( (cache) => {
                return cache.match(event.request).then( (matching) => {
                    var report =  !matching || matching.status == 404?Promise.reject('no-match'): matching;
                    return report;
                }).catch( (e) => {
                    console.log(e);
                });
            }).catch( (e) => {
                console.log(e);
            });
        })
    );
});
