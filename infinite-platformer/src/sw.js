// ===== SERVICE WORKER =====
// Estratégia: cache-first.
// - O núcleo do jogo (HTML/CSS/JS/sprites, poucos KB) é pré-cacheado na
//   instalação → o jogo abre offline.
// - As músicas (MP3, ~19 MB no total) são cacheadas na primeira reprodução,
//   para não pesar na instalação.
// Ao publicar uma atualização, incremente a versão do CACHE_NAME.

const CACHE_NAME = 'maicon-v2';

const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',

    './styles/style.css',
    './styles/animations.css',
    './styles/start-screen.css',
    './styles/game-layout.css',
    './styles/hud.css',
    './styles/boss-hud.css',
    './styles/overlays.css',
    './styles/story-cards.css',
    './styles/mobile.css',
    './styles/levels/level1.css',
    './styles/levels/level2.css',
    './styles/levels/level3.css',
    './styles/levels/level4.css',
    './styles/levels/level5.css',

    './scripts/vendor/howler.min.js',
    './scripts/utils.js',
    './scripts/input.js',
    './scripts/viewport.js',
    './scripts/touchControls.js',
    './scripts/player.js',
    './scripts/platform.js',
    './scripts/camera.js',
    './scripts/levelManager.js',
    './scripts/platformGenerator.js',
    './scripts/lavaManager.js',
    './scripts/powerUpManager.js',
    './scripts/starManager.js',
    './scripts/bossArena.js',
    './scripts/bossManager.js',
    './scripts/bossItemManager.js',
    './scripts/soundManager.js',
    './scripts/uiManager.js',
    './scripts/storyManager.js',
    './scripts/game_fixed.js',

    './assets/LULI.png',
    './assets/pulando.png',
    './assets/caindo.png',
    './assets/morrendo.png',
    './assets/chefe_meteoro.png',
    './assets/princesa.png',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(CORE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then((cached) => {
            if (cached) return cached;

            return fetch(event.request)
                .then((response) => {
                    // Cacheia em tempo de execução o que não foi pré-cacheado
                    // (principalmente as músicas)
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => {
                    // Offline e sem cache: navegações caem no index
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
        })
    );
});
