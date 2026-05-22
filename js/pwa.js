/**
 * PWA Module - Controle de Presença
 * Gerencia instalação, service worker e recursos offline
 */

const PWAConfig = {
  appName: 'Controle de Presença',
  version: '1.0.0',
  cacheName: 'controle-presenca-v1',
  assetsToCache: [
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
    '/css/admin.css',
    '/css/components.css',
    '/js/config.js',
    '/js/supabase.js',
    '/js/auth.js',
    '/js/geo.js',
    '/js/registro.js',
    '/js/admin.js',
    '/js/export.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://cdn.jsdelivr.net/npm/chart.js'
  ]
};

// Estado do PWA
let installPrompt = null;
let isInstalled = false;

/**
 * Inicializa o PWA
 * Importante: Não bloqueia funcionalidades principais
 */
async function initPWA() {
  // Verificar se o navegador suporta service workers
  if ('serviceWorker' in navigator) {
    try {
      await registerServiceWorker();
      setupServiceWorkerListeners();
    } catch (error) {
      console.warn('Service Worker registration failed (pode ser cache):', error);
    }
  }

  // Setup do install prompt
  setupInstallPrompt();
  
  // Verificar se já está instalado
  checkInstallStatus();
  
  // Adicionar listeners para online/offline
  setupConnectionListeners();
  
  // Atualizar UI - não bloqueante
  try {
    updateConnectionStatus();
  } catch (error) {
    console.warn('Erro ao atualizar status de conexão:', error);
  }
}

/**
 * Registra o Service Worker
 */
async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    console.log('Service Worker registrado com sucesso:', registration.scope);
    
    // Verificar updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('Nova versão do Service Worker encontrada');
      
      newWorker.addEventListener('statechange', (event) => {
        if (event.target.state === 'installed' && navigator.serviceWorker.controller) {
          // Novo SW instalado, aguardar atualização
          showUpdatePrompt();
        }
      });
    });
    
    return registration;
  } catch (error) {
    console.error('Erro ao registrar Service Worker:', error);
    return null;
  }
}

/**
 * Configura listeners do Service Worker
 */
function setupServiceWorkerListeners() {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.addEventListener('message', (event) => {
      if (event.data.type === 'CACHE_UPDATED') {
        console.log('Cache atualizado:', event.data.payload);
      }
    });
  }
}

/**
 * Setup do install prompt
 */
function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('Install prompt disponível');
    e.preventDefault();
    installPrompt = e;
    
    // Mostrar botão de instalação
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA instalado com sucesso');
    installPrompt = null;
    isInstalled = true;
    hideInstallButton();
    trackInstall();
  });
}

/**
 * Verifica status de instalação
 */
function checkInstallStatus() {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isInstalled = true;
    console.log('App está rodando em modo standalone');
  }
  
  if (navigator.standalone === true) {
    isInstalled = true;
    console.log('App está rodando em modo standalone (iOS)');
  }
}

/**
 * Mostra botão de instalação
 */
function showInstallButton() {
  const installBanner = document.getElementById('install-pwa-banner');
  const btnInstalar = document.getElementById('btn-instalar-pwa');
  
  if (installBanner && btnInstalar) {
    installBanner.classList.remove('hidden');
    
    btnInstalar.addEventListener('click', async () => {
      await installApp();
    });
    
    // Botão fechar
    const btnFechar = document.getElementById('btn-fechar-pwa');
    if (btnFechar) {
      btnFechar.addEventListener('click', () => {
        installBanner.classList.add('hidden');
      });
    }
  }
}

/**
 * Esconde botão de instalação
 */
function hideInstallButton() {
  const installBanner = document.getElementById('install-pwa-banner');
  if (installBanner) {
    installBanner.classList.add('hidden');
  }
}

/**
 * Instala o app
 */
async function installApp() {
  if (!installPrompt) {
    console.log('Install prompt não disponível');
    return;
  }

  try {
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    
    if (result.outcome === 'accepted') {
      console.log('Usuário aceitou instalar o PWA');
    } else {
      console.log('Usuário recusou instalar o PWA');
    }
    
    installPrompt = null;
  } catch (error) {
    console.error('Erro ao instalar PWA:', error);
  }
}

/**
 * Verifica status de conexão
 * Importante: Não bloqueia funcionalidades, apenas mostra status visual
 */
function updateConnectionStatus() {
  const statusElement = document.getElementById('connection-status');
  
  if (navigator.onLine) {
    if (statusElement) {
      statusElement.classList.remove('offline');
      statusElement.classList.add('online');
      statusElement.querySelector('.status-text').textContent = 'Online';
    }
    console.log('🟢 Online - Conexão disponível');
  } else {
    if (statusElement) {
      statusElement.classList.remove('online');
      statusElement.classList.add('offline');
      statusElement.querySelector('.status-text').textContent = 'Offline';
    }
    console.log('🔴 Offline - Algumas funcionalidades podem não funcionar');
  }
}

/**
 * Configura listeners de conexão
 * Importante: Apenas atualiza UI, não bloqueia funcionalidades
 */
function setupConnectionListeners() {
  window.addEventListener('online', () => {
    console.log('🟢 Conexão restaurada');
    updateConnectionStatus();
    // Não tenta sync imediatamente para não bloquear UI
    setTimeout(() => syncData(), 1000);
  });

  window.addEventListener('offline', () => {
    console.log('🔴 Sem conexão - modo offline ativado');
    updateConnectionStatus();
    // Apenas notifica, não bloqueia o login
    showOfflineNotification();
  });
}

/**
 * Sincroniza dados quando online
 */
async function syncData() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    
    try {
      await registration.sync.sync('sync-data');
      console.log('Sincronização de dados iniciada');
    } catch (error) {
      console.error('Erro na sincronização:', error);
    }
  }
}

/**
 * Mostra notificação de offline
 */
function showOfflineNotification() {
  // Verificar se já existe notificação
  let notification = document.getElementById('offline-notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'offline-notification';
    notification.className = 'offline-notification';
    notification.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
      <span>Você está offline. Algumas funcionalidades podem não estar disponíveis.</span>
      <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remover após 5 segundos
    setTimeout(() => {
      if (notification && notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }
}

/**
 * Mostra prompt de atualização
 */
function showUpdatePrompt() {
  const updateBanner = document.getElementById('update-pwa-banner');
  
  if (updateBanner) {
    updateBanner.classList.remove('hidden');
    
    const btnAtualizar = document.getElementById('btn-atualizar-pwa');
    if (btnAtualizar) {
      btnAtualizar.addEventListener('click', () => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  }
}

/**
 * Rastreia instalação (analytics)
 */
function trackInstall() {
  // Implementar analytics se necessário
  console.log('PWA instalado - track analytics');
}

/**
 * Verifica suporte a recursos PWA
 */
function checkPWASupport() {
  const support = {
    serviceWorker: 'serviceWorker' in navigator,
    push: 'PushManager' in window,
    sync: 'SyncManager' in window,
    install: 'beforeinstallprompt' in window,
    standalone: window.matchMedia('(display-mode: standalone)').matches
  };
  
  console.log('PWA Support:', support);
  return support;
}

// Exportar funções
window.pwa = {
  init: initPWA,
  install: installApp,
  checkSupport: checkPWASupport,
  syncData
};

// Inicializar PWA
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPWA);
} else {
  initPWA();
}
