const CACHE_NAME = "ss-weight-calculator-v2.1.1"; // Constant cache name (version info is managed in version.json)

const CACHE_VERSION_KEY = "app-cache-version"; // Key to store version info
const VERSION_URL = "/version.json"; // URL to fetch version info

// Assets split into app-specific and library files.
const APP_ASSETS = [
    "./index.html",
    "./manifest.json",
    "./service-worker.js",
    "./icons/icon-192x192.png",
    "./icons/icon-512x512.png",
    "./styles.css",
    "./app.js"
];
const LIB_ASSETS = [
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css",
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css",
    "https://code.jquery.com/jquery-3.6.0.min.js",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
    "https://cdn.jsdelivr.net/npm/vue@3.2.47"
];

// ✅ Install: Fetch version.json and cache both app and library assets.
self.addEventListener("install", (event) => {
    event.waitUntil(
        fetch(VERSION_URL)
            .then(response => response.json())
            .then(async data => {
                return caches.open(CACHE_NAME).then(async (cache) => {
                    // Cache all assets on first install.
                    await cache.addAll(APP_ASSETS);
                    await cache.addAll(LIB_ASSETS);
                    // Store the version and the updatelibs flag.
                    const versionInfo = { version: data.version, updatelibs: data.updatelibs };
                    await cache.put(CACHE_VERSION_KEY, new Response(JSON.stringify(versionInfo)));
                });
            })
            .catch(() => console.log("⚠️ Failed to fetch initial version.json"))
    );
});

// ✅ Fetch: Serve from cache first, then check for update in background.
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                checkForUpdate(); // Trigger background update check.
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});

// ✅ Check for update by fetching version.json.
async function checkForUpdate() {
    try {
        const response = await fetch(VERSION_URL);
        const data = await response.json();
        const newVersion = data.version;
        const newUpdateLibs = data.updatelibs;

        const cache = await caches.open(CACHE_NAME);
        const versionResponse = await cache.match(CACHE_VERSION_KEY);
        let currentVersionInfo = { version: null, updatelibs: false };
        if (versionResponse) {
            currentVersionInfo = JSON.parse(await versionResponse.text());
        }
        // Update if version changes or the updatelibs flag differs.
        if (currentVersionInfo.version !== newVersion || currentVersionInfo.updatelibs !== newUpdateLibs) {
            console.log("🔄 New version detected! Updating cache...");
            await updateCache(newVersion, newUpdateLibs);
            self.skipWaiting();
        }
    } catch (error) {
        console.log("⚠️ Version check failed (offline or server error).");
    }
}

// ✅ Update cache: Always update app assets; update libraries only if updateLibs is true.
async function updateCache(newVersion, updateLibs) {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_ASSETS);
    if (updateLibs) {
        await cache.addAll(LIB_ASSETS);
    }
    const versionInfo = { version: newVersion, updatelibs: updateLibs };
    await cache.put(CACHE_VERSION_KEY, new Response(JSON.stringify(versionInfo)));
}

// ✅ Activate: Remove old caches and claim clients immediately.
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log("🗑 Deleting old cache:", cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ✅ Listen for messages (e.g., to manually trigger skipWaiting).
self.addEventListener("message", (event) => {
    if (event.data === "skipWaiting") {
        self.skipWaiting();
    }
});
