var timestampNow = new Date().getTime();
const CACHE_NAME = "ss-weight-calculator-v1"+ timestampNow;
const ASSETS = [
    "./index.html",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css",
    "https://cdn.jsdelivr.net/npm/vue@3.2.47"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

//delete all other caches
self.addEventListener("activate", (event) => {
    const cacheAllowlist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((keyList) =>
            Promise.all(
                keyList.map((key) => {
                    if (!cacheAllowlist.includes(key)) {
                        return caches.delete(key);
                    }
                })
            )
        )
    );
});
