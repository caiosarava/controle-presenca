const CACHE_NAME = 'controle-presenca-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/historico.html',
  '/offline.html',
  '/admin/index.html',
  '/admin/locais.html',
  '/admin/usuarios.html',
  '/admin/historico.html',
  '/css/global.css',
  '/css/login.css',
  '/css/dashboard.css',
  '/css/admin.css',
  '/css/components.css',
  '/js/config.js',
  '/js/supabase.js',
  '/js/auth.js',
  '/js/geo.js',
  '/js/registro.js',
  '/js/admin.js',
  '/js/export.js',
  '/js/pwa.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Estratégia de cache: Cache First para assets, Network First para API
const CACHE_STRATEGIES = {
  'fonts': 'cache-first',
  'images': 'cache-first',
  'api': 'network-first',
  'default': 'cache-first'
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET (deixa POST, PUT, DELETE passarem)
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // Ignorar requisições externas (ex: fonts.googleapis.com, CDN)
  if (!requestUrl.origin.startsWith(self.location.origin)) {
    return;
  }

  // Ignorar requisições de autenticação do Supabase
  if (requestUrl.pathname.includes('/auth/v1/') || 
      requestUrl.pathname.includes('/rest/v1/')) {
    return;
  }

  const strategy = getCacheStrategy(event.request);

  if (strategy === 'cache-first') {
    event.respondWith(cacheFirst(event.request));
  } else if (strategy === 'network-first') {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(defaultStrategy(event.request));
  }
});

/**
 * Estratégia Cache First
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Se falhar e for navegação, retorna página offline
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Estratégia Network First
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se falhar e for navegação, retorna página offline
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Estratégia padrão
 */
async function defaultStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, networkResponse.clone());
      });
    }
    return networkResponse;
  }).catch(() => {
    return cachedResponse;
  });

  return cachedResponse || fetchPromise;
}

/**
 * Determina estratégia de cache baseada na URL
 */
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // API requests
  if (url.pathname.includes('/api/') || url.pathname.includes('/rest/')) {
    return CACHE_STRATEGIES.api;
  }
  
  // Fontes
  if (url.pathname.match(/\.(woff2?|ttf|otf)$/)) {
    return CACHE_STRATEGIES.fonts;
  }
  
  // Imagens
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
    return CACHE_STRATEGIES.images;
  }
  
  return CACHE_STRATEGIES.default;
}

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Controle de Presença';
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard.html'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/dashboard.html')
  );
});
