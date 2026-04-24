// --- 『旅人の杖と救いの泉』 Service Worker (Ver 1.0) ---

const CACHE_NAME = 'wayfarers-staff-cache-v25'; 

const CACHE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './image_3.webp',
    './icon-180-v2.png',
    './icon-192-v2.png',
    './icon-512-v2.png'
];
const GEOJSON_FILES = [
    'OSM_relics_of_kinki_38142.geojson',
    'Gov-OSM_Park_30m_merge_17323.geojson',
    'Gov_Public Facilities-Gymnasiums_6278.geojson',
    'Gov_Cultural_Facilities-Libraries_6100.geojson',
    'Gov_cultural_6196.geojson',
    'Local_Toilet_Data_merged_30m_7218_point.geojson'
];
GEOJSON_FILES.forEach(file => CACHE_ASSETS.push(`./${file}`));

self.addEventListener('install', event => {
    console.log('👷 SW: キャッシュ魔法を詠唱中...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('👷 SW: アセットをキャッシュに保存した。');
                return cache.addAll(CACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    console.log('👷 SW: 古い魔力を証拠隠滅中...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('👷 SW: 古いキャッシュ ' + cache + ' を塵へ還した。');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
