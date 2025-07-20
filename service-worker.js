const CACHE_NAME = 'runedream-v1';
const ASSETS = [
  './',
  'index.html',
  'game.html',
  'upgrade.html',
  'settings.html',
  'css/style.css',
  'js/game.js',
  'js/settings.js',
  'js/upgrade.js',
  'song_Dreamy_Wisps.mp3',
  'Blank Screen.png',
  'Title Screen.png',
  'button_exitgame.png',
  'button_playgame.png',
  'button_resetprogress.png',
  'button_return.png',
  'button_settings.png',
  'button_timeattack.png',
  'button_upgradeshop.png',
  'Obs_yellowstar.png',
  'Obs_yellowstar_break1.png',
  'Obs_yellowstar_break2.png',
  'Obs_yellowstar_break3.png',
  'Obs_yellowstar_break4.png',
  'RuneDreamAssets/Obs_blackstar.png',
  'RuneDreamAssets/Obs_orangestar.png',
  'RuneDreamAssets/Obs_orangestar_break.png',
  'RuneDreamAssets/plat_clouds1.png',
  'RuneDreamAssets/sprite_dash_1.png',
  'RuneDreamAssets/sprite_run_1.png',
  'RuneDreamAssets/sprite_run_2.png',
  'RuneDreamAssets/sprite_run_3.png',
  'RuneDreamAssets/sprite_run_4.png',
  'RuneDreamAssets/sprite_run_5.png',
  'Obs_orangestar.png',
  'manifest.json',
  'service-worker.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
