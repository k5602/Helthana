// Enhanced Service Worker with Advanced Caching Strategies
const CACHE_VERSION = '2.0.0';
const STATIC_CACHE = `health-guide-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `health-guide-dynamic-v${CACHE_VERSION}`;
const API_CACHE = `health-guide-api-v${CACHE_VERSION}`;
const IMAGE_CACHE = `health-guide-images-v${CACHE_VERSION}`;

// Cache strategies configuration
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/index.css',
  '/src/main.jsx',
  '/src/api.js',
  '/src/auth.js',
  '/src/ui.js',
  '/src/offline.js',
  '/src/navigation.js',
  '/src/router.js',
  '/src/error-handler.js',
  '/src/localization.js',
  '/src/permissions.js',
  '/src/voice-commands.js',
  '/src/ai-insights.js',
  '/src/pages/dashboard.js',
  '/src/pages/prescriptions.js',
  '/src/pages/vitals.js',
  '/src/pages/reports.js',
  '/src/pages/emergency.js',
  '/src/pages/profile.js',
  '/components/loading.js',
  '/components/modal.js',
  '/components/voice-command-button.js',
  '/public/manifest.json'
];

// Offline fallback page
const OFFLINE_PAGE = '/offline.html';

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  DYNAMIC: 24 * 60 * 60 * 1000,    // 1 day
  API: 5 * 60 * 1000,              // 5 minutes
  IMAGES: 30 * 24 * 60 * 60 * 1000 // 30 days
};

// Install event - Enhanced with better error handling
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE),
      caches.open(IMAGE_CACHE)
    ]).then(() => {
      console.log('[SW] Service worker installed successfully');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    }).catch(error => {
      console.error('[SW] Failed to install service worker:', error);
    })
  );
});

// Activate event - Enhanced cache cleanup
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, IMAGE_CACHE];
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!validCaches.includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Service worker activated successfully');
      // Notify clients about update
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_VERSION
          });
        });
      });
    }).catch(error => {
      console.error('[SW] Failed to activate service worker:', error);
    })
  );
});

// Enhanced fetch event with multiple caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Determine caching strategy based on request type
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Background sync for offline data
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(performBackgroundSync());
  } else if (event.tag === 'prescription-sync') {
    event.waitUntil(syncPrescriptions());
  } else if (event.tag === 'vitals-sync') {
    event.waitUntil(syncVitals());
  }
});

// Enhanced push notification handling
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  let notificationData = {
    title: 'Health Guide',
    body: 'You have a new health notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: '/dashboard.html'
    },
    actions: []
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[SW] Push payload:', payload);
      
      // Customize notification based on type
      switch (payload.type) {
        case 'medication_reminder':
          notificationData = {
            ...notificationData,
            title: 'Medication Reminder',
            body: `Time to take ${payload.medication_name} (${payload.dosage})`,
            icon: '/icons/medication-icon.png',
            vibrate: [200, 100, 200],
            requireInteraction: true,
            data: {
              ...notificationData.data,
              type: 'medication_reminder',
              prescription_id: payload.prescription_id,
              url: '/prescriptions.html'
            },
            actions: [
              {
                action: 'taken',
                title: 'Mark as Taken',
                icon: '/icons/checkmark.png'
              },
              {
                action: 'snooze',
                title: 'Remind Later',
                icon: '/icons/clock.png'
              },
              {
                action: 'view',
                title: 'View Details',
                icon: '/icons/info.png'
              }
            ]
          };
          break;
          
        case 'emergency_alert':
          notificationData = {
            ...notificationData,
            title: 'Emergency Alert',
            body: payload.message || 'Emergency assistance requested',
            icon: '/icons/emergency-icon.png',
            vibrate: [300, 100, 300, 100, 300],
            requireInteraction: true,
            silent: false,
            data: {
              ...notificationData.data,
              type: 'emergency_alert',
              urgent: true,
              url: '/emergency.html'
            },
            actions: [
              {
                action: 'acknowledge',
                title: 'Acknowledge',
                icon: '/icons/checkmark.png'
              },
              {
                action: 'call_emergency',
                title: 'Call 911',
                icon: '/icons/phone.png'
              }
            ]
          };
          break;
          
        case 'health_tip':
          notificationData = {
            ...notificationData,
            title: 'Health Tip',
            body: payload.message,
            icon: '/icons/health-tip-icon.png',
            data: {
              ...notificationData.data,
              type: 'health_tip',
              tip_id: payload.tip_id
            },
            actions: [
              {
                action: 'read_more',
                title: 'Read More',
                icon: '/icons/info.png'
              }
            ]
          };
          break;
          
        case 'vitals_reminder':
          notificationData = {
            ...notificationData,
            title: 'Vitals Reminder',
            body: 'Time to log your vital signs',
            icon: '/icons/vitals-icon.png',
            data: {
              ...notificationData.data,
              type: 'vitals_reminder',
              url: '/vitals.html'
            },
            actions: [
              {
                action: 'log_vitals',
                title: 'Log Vitals',
                icon: '/icons/plus.png'
              },
              {
                action: 'snooze',
                title: 'Remind Later',
                icon: '/icons/clock.png'
              }
            ]
          };
          break;
          
        default:
          // Use payload data if available
          notificationData.title = payload.title || notificationData.title;
          notificationData.body = payload.body || notificationData.body;
          notificationData.data = { ...notificationData.data, ...payload.data };
      }
    } catch (error) {
      console.error('[SW] Failed to parse push payload:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Enhanced notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action, event.notification.data);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const action = event.action;
  
  // Handle specific actions
  switch (action) {
    case 'taken':
      // Mark medication as taken
      event.waitUntil(
        handleMedicationTaken(notificationData.prescription_id)
          .then(() => clients.openWindow(notificationData.url || '/prescriptions.html'))
      );
      break;
      
    case 'snooze':
      // Snooze reminder for 15 minutes
      event.waitUntil(
        snoozeMedicationReminder(notificationData.prescription_id, 15)
      );
      break;
      
    case 'acknowledge':
      // Acknowledge emergency alert
      event.waitUntil(
        acknowledgeEmergencyAlert(notificationData)
          .then(() => clients.openWindow('/emergency.html'))
      );
      break;
      
    case 'call_emergency':
      // Open emergency calling interface
      event.waitUntil(
        clients.openWindow('/emergency.html?action=call')
      );
      break;
      
    case 'log_vitals':
      // Open vitals logging page
      event.waitUntil(
        clients.openWindow('/vitals.html?action=log')
      );
      break;
      
    case 'read_more':
      // Open health tip details
      event.waitUntil(
        clients.openWindow(`/dashboard.html?tip=${notificationData.tip_id}`)
      );
      break;
      
    case 'view':
      // View details
      event.waitUntil(
        clients.openWindow(notificationData.url || '/dashboard.html')
      );
      break;
      
    case 'close':
      // Just close the notification
      return;
      
    default:
      // Default action - open the appropriate page
      const targetUrl = notificationData.url || '/dashboard.html';
      event.waitUntil(
        clients.matchAll().then(clientList => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(targetUrl.split('?')[0])) {
              return client.focus();
            }
          }
          // Open new window/tab
          return clients.openWindow(targetUrl);
        })
      );
  }
});

// Helper functions for notification actions
async function handleMedicationTaken(prescriptionId) {
  try {
    // Store medication taken event
    const medicationEvent = {
      prescription_id: prescriptionId,
      action: 'taken',
      timestamp: new Date().toISOString()
    };
    
    // Try to send to backend
    if (self.registration.sync) {
      // Use background sync if available
      await self.registration.sync.register('medication-taken');
      
      // Store in IndexedDB for sync
      const db = await openIndexedDB();
      if (db) {
        const transaction = db.transaction(['sync_queue'], 'readwrite');
        const store = transaction.objectStore('sync_queue');
        await store.add({
          action: 'medication_taken',
          data: medicationEvent,
          timestamp: new Date().toISOString(),
          synced: false
        });
      }
    }
    
    console.log('[SW] Medication marked as taken:', prescriptionId);
  } catch (error) {
    console.error('[SW] Failed to handle medication taken:', error);
  }
}

async function snoozeMedicationReminder(prescriptionId, minutes) {
  try {
    // Schedule new reminder
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);
    
    const reminderData = {
      prescription_id: prescriptionId,
      snooze_until: snoozeTime.toISOString(),
      action: 'snooze'
    };
    
    // Store snooze event
    if (self.registration.sync) {
      await self.registration.sync.register('medication-snooze');
      
      const db = await openIndexedDB();
      if (db) {
        const transaction = db.transaction(['sync_queue'], 'readwrite');
        const store = transaction.objectStore('sync_queue');
        await store.add({
          action: 'medication_snooze',
          data: reminderData,
          timestamp: new Date().toISOString(),
          synced: false
        });
      }
    }
    
    console.log('[SW] Medication reminder snoozed:', prescriptionId, minutes, 'minutes');
  } catch (error) {
    console.error('[SW] Failed to snooze medication reminder:', error);
  }
}

async function acknowledgeEmergencyAlert(alertData) {
  try {
    const acknowledgment = {
      alert_id: alertData.alert_id,
      acknowledged_at: new Date().toISOString(),
      action: 'acknowledge'
    };
    
    // Store acknowledgment
    if (self.registration.sync) {
      await self.registration.sync.register('emergency-acknowledge');
      
      const db = await openIndexedDB();
      if (db) {
        const transaction = db.transaction(['sync_queue'], 'readwrite');
        const store = transaction.objectStore('sync_queue');
        await store.add({
          action: 'emergency_acknowledge',
          data: acknowledgment,
          timestamp: new Date().toISOString(),
          synced: false
        });
      }
    }
    
    console.log('[SW] Emergency alert acknowledged:', alertData.alert_id);
  } catch (error) {
    console.error('[SW] Failed to acknowledge emergency alert:', error);
  }
}

// Helper function to open IndexedDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HealthGuideDB', 2);
    
    request.onerror = () => {
      console.error('[SW] Failed to open IndexedDB');
      resolve(null);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('action_type', 'action', { unique: false });
        syncStore.createIndex('synced', 'synced', { unique: false });
      }
    };
  });
}

// Message handling from clients
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }
});

// Helper functions for request classification
function isStaticAsset(request) {
  const url = new URL(request.url);
  return STATIC_ASSETS.some(asset => 
    url.pathname === asset || url.href === asset
  ) || url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/);
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

function isImageRequest(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Cache-first strategy for static assets
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse && !isExpired(cachedResponse, CACHE_EXPIRATION.STATIC)) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Asset not available offline', { status: 503 });
  }
}

// Network-first strategy for API requests with fallback
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] API request failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse && !isExpired(cachedResponse, CACHE_EXPIRATION.API)) {
      // Add offline indicator header
      const response = cachedResponse.clone();
      response.headers.set('X-Served-From', 'cache');
      return response;
    }
    
    // Return offline response for specific endpoints
    if (request.url.includes('/prescriptions/') || 
        request.url.includes('/vitals/') || 
        request.url.includes('/reports/')) {
      return new Response(JSON.stringify({ 
        offline: true, 
        message: 'Data not available offline' 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Cache-first strategy for images with long expiration
async function handleImageRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse && !isExpired(cachedResponse, CACHE_EXPIRATION.IMAGES)) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Image fetch failed:', error);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Image not available offline', { status: 503 });
  }
}

// Navigation requests with offline fallback
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation request failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    const offlinePage = await caches.match(OFFLINE_PAGE);
    return offlinePage || new Response('Page not available offline', {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Stale-while-revalidate strategy for dynamic content
async function handleDynamicRequest(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(error => {
    console.error('[SW] Dynamic request failed:', error);
    return cachedResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Check if cached response is expired
function isExpired(response, maxAge) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseDate = new Date(dateHeader);
  const now = new Date();
  return (now.getTime() - responseDate.getTime()) > maxAge;
}

// Background sync functions
async function performBackgroundSync() {
  console.log('[SW] Performing background sync');
  
  try {
    // Sync offline data
    await syncOfflineData();
    console.log('[SW] Background sync completed successfully');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    throw error; // This will cause the sync to be retried
  }
}

async function syncPrescriptions() {
  console.log('[SW] Syncing prescriptions');
  // Implementation would sync prescription data
  // This is a placeholder for the actual sync logic
}

async function syncVitals() {
  console.log('[SW] Syncing vitals');
  // Implementation would sync vitals data
  // This is a placeholder for the actual sync logic
}

async function syncOfflineData() {
  // Open IndexedDB and sync queued data
  // This would integrate with the offline manager
  console.log('[SW] Syncing offline data');
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}
