// Agropecuária 2D — abre sem internet depois do primeiro acesso.
const CACHE = 'agro2d-v3';
const ARQUIVOS = ['./index.html', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('agro2d-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // planilha do Google: sempre pela rede
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // a pagina do app e sempre guardada numa unica chave, seja qual for o endereco usado
    const chave = e.request.mode === 'navigate' ? './index.html' : e.request;
    const rede = fetch(e.request).then(r => { if (r.ok) cache.put(chave, r.clone()); return r; });
    const guardado = await cache.match(chave);
    if (!guardado) return rede;
    // sinal fraco no campo: espera no máximo 2,5 s pela rede e abre a cópia guardada
    e.waitUntil(rede.catch(() => {}));
    return Promise.race([rede.then(r => r.ok ? r : guardado).catch(() => guardado), new Promise(ok => setTimeout(() => ok(guardado), 2500))]);
  })());
});