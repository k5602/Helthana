/**
 * Enhanced Offline Functionality Module
 * Handles offline data storage, intelligent synchronization, and conflict resolution
 */

// Conflict Resolution Strategy
class ConflictResolver {
    constructor() {
        this.strategies = {
            TIMESTAMP_WINS: 'timestamp',
            SERVER_WINS: 'server',
            CLIENT_WINS: 'client',
            MERGE: 'merge',
            USER_CHOICE: 'user'
        };
        this.defaultStrategy = this.strategies.TIMESTAMP_WINS;
    }

    async resolveConflict(localData, serverData, strategy = this.defaultStrategy) {
        console.log('[ConflictResolver] Resolving conflict:', { localData, serverData, strategy });

        switch (strategy) {
            case this.strategies.TIMESTAMP_WINS:
                return this.timestampWins(localData, serverData);
            case this.strategies.SERVER_WINS:
                return serverData;
            case this.strategies.CLIENT_WINS:
                return localData;
            case this.strategies.MERGE:
                return this.mergeData(localData, serverData);
            case this.strategies.USER_CHOICE:
                return await this.promptUserChoice(localData, serverData);
            default:
                return this.timestampWins(localData, serverData);
        }
    }

    timestampWins(localData, serverData) {
        const localTime = new Date(localData.updated_at || localData.created_at);
        const serverTime = new Date(serverData.updated_at || serverData.created_at);
        
        return localTime > serverTime ? localData : serverData;
    }

    mergeData(localData, serverData) {
        // Intelligent merge based on data type
        const merged = { ...serverData };
        
        // Preserve local changes that are newer
        Object.keys(localData).forEach(key => {
            if (key.endsWith('_at')) return; // Skip timestamp fields
            
            if (localData[key] !== serverData[key]) {
                // If local data has a value and server doesn't, keep local
                if (localData[key] && !serverData[key]) {
                    merged[key] = localData[key];
                }
                // For arrays, merge unique items
                else if (Array.isArray(localData[key]) && Array.isArray(serverData[key])) {
                    merged[key] = [...new Set([...serverData[key], ...localData[key]])];
                }
            }
        });
        
        return merged;
    }

    async promptUserChoice(localData, serverData) {
        return new Promise((resolve) => {
            if (window.ui && window.ui.showConflictDialog) {
                window.ui.showConflictDialog(localData, serverData, resolve);
            } else {
                // Fallback to timestamp strategy if UI not available
                resolve(this.timestampWins(localData, serverData));
            }
        });
    }
}

class OfflineManager {
    constructor() {
        this.dbName = 'HealthGuideDB';
        this.dbVersion = 2;
        this.db = null;
        this.syncInProgress = false;
        this.syncQueue = new Map();
        this.conflictResolver = new ConflictResolver();
        this.lastSyncTime = localStorage.getItem('lastSyncTime');
        this.init();
    }

    async init() {
        try {
            this.db = await this.openDB();
            console.log('IndexedDB initialized');
        } catch (error) {
            console.error('Failed to initialize IndexedDB:', error);
            
            // Use global error handler if available
            if (window.errorHandler) {
                window.errorHandler.handleError(error, {
                    action: 'initialize offline storage',
                    type: 'offline'
                });
            }
        }
    }

    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores with enhanced schema
                if (!db.objectStoreNames.contains('prescriptions')) {
                    const prescriptionStore = db.createObjectStore('prescriptions', { keyPath: 'id', autoIncrement: true });
                    prescriptionStore.createIndex('user_id', 'user_id', { unique: false });
                    prescriptionStore.createIndex('created_at', 'created_at', { unique: false });
                    prescriptionStore.createIndex('sync_status', 'sync_status', { unique: false });
                }

                if (!db.objectStoreNames.contains('vitals')) {
                    const vitalsStore = db.createObjectStore('vitals', { keyPath: 'id', autoIncrement: true });
                    vitalsStore.createIndex('user_id', 'user_id', { unique: false });
                    vitalsStore.createIndex('vital_type', 'vital_type', { unique: false });
                    vitalsStore.createIndex('recorded_at', 'recorded_at', { unique: false });
                    vitalsStore.createIndex('sync_status', 'sync_status', { unique: false });
                }

                if (!db.objectStoreNames.contains('sync_queue')) {
                    const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
                    syncStore.createIndex('action_type', 'action', { unique: false });
                    syncStore.createIndex('priority', 'priority', { unique: false });
                    syncStore.createIndex('created_at', 'timestamp', { unique: false });
                    syncStore.createIndex('sync_status', 'synced', { unique: false });
                }

                if (!db.objectStoreNames.contains('reports')) {
                    const reportsStore = db.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
                    reportsStore.createIndex('user_id', 'user_id', { unique: false });
                    reportsStore.createIndex('report_type', 'report_type', { unique: false });
                    reportsStore.createIndex('generated_at', 'generated_at', { unique: false });
                }

                if (!db.objectStoreNames.contains('emergency_contacts')) {
                    const emergencyStore = db.createObjectStore('emergency_contacts', { keyPath: 'id', autoIncrement: true });
                    emergencyStore.createIndex('user_id', 'user_id', { unique: false });
                    emergencyStore.createIndex('priority', 'priority', { unique: false });
                }

                if (!db.objectStoreNames.contains('cache_metadata')) {
                    const cacheStore = db.createObjectStore('cache_metadata', { keyPath: 'key' });
                    cacheStore.createIndex('expires_at', 'expires_at', { unique: false });
                }
            };
        });
    }

    // Store data offline
    async storeOffline(storeName, data) {
        if (!this.db) return false;

        try {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await store.add({ ...data, offline: true, created_at: new Date().toISOString() });
            return true;
        } catch (error) {
            console.error('Failed to store offline data:', error);
            
            // Use global error handler if available
            if (window.errorHandler) {
                window.errorHandler.handleError(error, {
                    action: 'store data offline',
                    type: 'offline'
                });
            }
            return false;
        }
    }

    // Get offline data
    async getOfflineData(storeName, userId = null) {
        if (!this.db) return [];

        try {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            let request;
            if (userId) {
                const index = store.index('user_id');
                request = index.getAll(userId);
            } else {
                request = store.getAll();
            }

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to get offline data:', error);
            
            // Use global error handler if available
            if (window.errorHandler) {
                window.errorHandler.handleError(error, {
                    action: 'retrieve offline data',
                    type: 'offline'
                });
            }
            return [];
        }
    }

    // Add to sync queue
    async addToSyncQueue(action, data) {
        if (!this.db) return false;

        try {
            const transaction = this.db.transaction(['sync_queue'], 'readwrite');
            const store = transaction.objectStore('sync_queue');
            await store.add({
                action,
                data,
                timestamp: new Date().toISOString(),
                synced: false
            });
            return true;
        } catch (error) {
            console.error('Failed to add to sync queue:', error);
            
            // Use global error handler if available
            if (window.errorHandler) {
                window.errorHandler.handleError(error, {
                    action: 'queue data for sync',
                    type: 'offline'
                });
            }
            return false;
        }
    }

    // Enhanced sync with intelligent batching and conflict resolution
    async syncOfflineData() {
        if (!navigator.onLine || !this.db || this.syncInProgress) return;

        this.syncInProgress = true;
        console.log('[OfflineManager] Starting sync process');

        try {
            const transaction = this.db.transaction(['sync_queue'], 'readwrite');
            const store = transaction.objectStore('sync_queue');
            const request = store.getAll();

            request.onsuccess = async () => {
                const queueItems = request.result.filter(item => !item.synced);
                console.log(`[OfflineManager] Found ${queueItems.length} items to sync`);
                
                // Sort by priority and timestamp
                queueItems.sort((a, b) => {
                    const priorityA = a.priority || 0;
                    const priorityB = b.priority || 0;
                    if (priorityA !== priorityB) return priorityB - priorityA;
                    return new Date(a.timestamp) - new Date(b.timestamp);
                });

                // Batch sync items
                const batchSize = 5;
                for (let i = 0; i < queueItems.length; i += batchSize) {
                    const batch = queueItems.slice(i, i + batchSize);
                    await this.syncBatch(batch);
                }

                // Update last sync time
                this.lastSyncTime = new Date().toISOString();
                localStorage.setItem('lastSyncTime', this.lastSyncTime);
                
                // Notify UI about sync completion
                this.notifyUI('SYNC_COMPLETED', {
                    syncedItems: queueItems.length,
                    lastSync: this.lastSyncTime
                });
            };
        } catch (error) {
            console.error('Failed to sync offline data:', error);
            
            // Use global error handler if available
            if (window.errorHandler) {
                window.errorHandler.handleError(error, {
                    action: 'sync offline data',
                    type: 'offline',
                    retryable: true,
                    retryCallback: () => this.syncOfflineData()
                });
            }
        } finally {
            this.syncInProgress = false;
        }
    }

    async syncBatch(batch) {
        const syncPromises = batch.map(async (item) => {
            try {
                const result = await this.syncItem(item);
                
                // Handle conflicts if server data differs
                if (result && result.conflict) {
                    const resolvedData = await this.conflictResolver.resolveConflict(
                        item.data, 
                        result.serverData
                    );
                    
                    // Update local data with resolved version
                    await this.updateLocalData(item.action, resolvedData);
                }
                
                // Mark as synced
                const updateTransaction = this.db.transaction(['sync_queue'], 'readwrite');
                const updateStore = updateTransaction.objectStore('sync_queue');
                item.synced = true;
                item.syncedAt = new Date().toISOString();
                await updateStore.put(item);
                
                console.log(`[OfflineManager] Synced item: ${item.action}`);
                return { success: true, item };
                
            } catch (error) {
                console.error('Failed to sync item:', item, error);
                
                // Increment retry count
                item.retryCount = (item.retryCount || 0) + 1;
                item.lastError = error.message;
                
                // Mark for retry if under limit
                if (item.retryCount < 3) {
                    const updateTransaction = this.db.transaction(['sync_queue'], 'readwrite');
                    const updateStore = updateTransaction.objectStore('sync_queue');
                    await updateStore.put(item);
                }
                
                return { success: false, item, error };
            }
        });

        const results = await Promise.allSettled(syncPromises);
        return results;
    }

    async syncItem(item) {
        switch (item.action) {
            case 'add_prescription':
                return await window.api.uploadPrescription(item.data);
            case 'add_vital':
                return await window.api.addVital(item.data);
            case 'emergency_alert':
                return await window.api.sendEmergencyAlert(item.data);
            default:
                console.warn('Unknown sync action:', item.action);
        }
    }

    // Update local data after conflict resolution
    async updateLocalData(action, resolvedData) {
        if (!this.db) return false;

        try {
            let storeName;
            switch (action) {
                case 'add_prescription':
                    storeName = 'prescriptions';
                    break;
                case 'add_vital':
                    storeName = 'vitals';
                    break;
                case 'add_report':
                    storeName = 'reports';
                    break;
                case 'add_emergency_contact':
                    storeName = 'emergency_contacts';
                    break;
                default:
                    console.warn('Unknown action for local data update:', action);
                    return false;
            }

            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await store.put(resolvedData);
            
            console.log(`[OfflineManager] Updated local data for ${action}`);
            return true;
        } catch (error) {
            console.error('Failed to update local data:', error);
            return false;
        }
    }

    // Notify UI about sync events
    notifyUI(eventType, data) {
        // Send message to service worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: eventType,
                data: data
            });
        }

        // Dispatch custom event for UI components
        window.dispatchEvent(new CustomEvent('offline-sync', {
            detail: { type: eventType, data: data }
        }));

        // Update UI if available
        if (window.ui && window.ui.updateSyncStatus) {
            window.ui.updateSyncStatus(eventType, data);
        }
    }

    // Get sync queue status
    async getSyncQueueStatus() {
        if (!this.db) return { pending: 0, failed: 0, total: 0 };

        try {
            const transaction = this.db.transaction(['sync_queue'], 'readonly');
            const store = transaction.objectStore('sync_queue');
            const request = store.getAll();

            return new Promise((resolve) => {
                request.onsuccess = () => {
                    const items = request.result;
                    const pending = items.filter(item => !item.synced && (item.retryCount || 0) < 3).length;
                    const failed = items.filter(item => !item.synced && (item.retryCount || 0) >= 3).length;
                    
                    resolve({
                        pending,
                        failed,
                        total: items.length,
                        lastSync: this.lastSyncTime
                    });
                };
            });
        } catch (error) {
            console.error('Failed to get sync queue status:', error);
            return { pending: 0, failed: 0, total: 0 };
        }
    }

    // Clean up old sync queue items
    async cleanupSyncQueue() {
        if (!this.db) return;

        try {
            const transaction = this.db.transaction(['sync_queue'], 'readwrite');
            const store = transaction.objectStore('sync_queue');
            const request = store.getAll();

            request.onsuccess = async () => {
                const items = request.result;
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - 7); // Keep items for 7 days

                for (const item of items) {
                    const itemDate = new Date(item.timestamp);
                    if (item.synced && itemDate < cutoffDate) {
                        await store.delete(item.id);
                    }
                }
                
                console.log('[OfflineManager] Cleaned up old sync queue items');
            };
        } catch (error) {
            console.error('Failed to cleanup sync queue:', error);
        }
    }

    // Cache management
    async setCacheData(key, data, expirationMinutes = 60) {
        if (!this.db) return false;

        try {
            const transaction = this.db.transaction(['cache_metadata'], 'readwrite');
            const store = transaction.objectStore('cache_metadata');
            
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);
            
            await store.put({
                key,
                data,
                expires_at: expiresAt.toISOString(),
                created_at: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            console.error('Failed to set cache data:', error);
            return false;
        }
    }

    async getCacheData(key) {
        if (!this.db) return null;

        try {
            const transaction = this.db.transaction(['cache_metadata'], 'readonly');
            const store = transaction.objectStore('cache_metadata');
            const request = store.get(key);

            return new Promise((resolve) => {
                request.onsuccess = () => {
                    const result = request.result;
                    if (!result) {
                        resolve(null);
                        return;
                    }

                    // Check if expired
                    const expiresAt = new Date(result.expires_at);
                    if (new Date() > expiresAt) {
                        // Remove expired cache
                        store.delete(key);
                        resolve(null);
                        return;
                    }

                    resolve(result.data);
                };
                request.onerror = () => resolve(null);
            });
        } catch (error) {
            console.error('Failed to get cache data:', error);
            return null;
        }
    }

    // Network status monitoring
    setupNetworkMonitoring() {
        let wasOnline = navigator.onLine;

        const checkConnection = async () => {
            const isOnline = navigator.onLine;
            
            if (isOnline && !wasOnline) {
                console.log('[OfflineManager] Connection restored, starting sync');
                this.notifyUI('CONNECTION_RESTORED', { timestamp: new Date().toISOString() });
                
                // Wait a moment for connection to stabilize
                setTimeout(() => {
                    this.syncOfflineData();
                }, 1000);
            } else if (!isOnline && wasOnline) {
                console.log('[OfflineManager] Connection lost');
                this.notifyUI('CONNECTION_LOST', { timestamp: new Date().toISOString() });
            }
            
            wasOnline = isOnline;
        };

        window.addEventListener('online', checkConnection);
        window.addEventListener('offline', checkConnection);
        
        // Periodic connection check
        setInterval(checkConnection, 30000); // Check every 30 seconds
    }

    // Storage space management
    async getStorageUsage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    used: estimate.usage,
                    available: estimate.quota,
                    percentage: Math.round((estimate.usage / estimate.quota) * 100)
                };
            } catch (error) {
                console.error('Failed to get storage estimate:', error);
            }
        }
        return null;
    }

    async cleanupExpiredCache() {
        if (!this.db) return;

        try {
            const transaction = this.db.transaction(['cache_metadata'], 'readwrite');
            const store = transaction.objectStore('cache_metadata');
            const index = store.index('expires_at');
            const now = new Date().toISOString();
            
            const request = index.openCursor(IDBKeyRange.upperBound(now));
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };
            
            console.log('[OfflineManager] Cleaned up expired cache entries');
        } catch (error) {
            console.error('Failed to cleanup expired cache:', error);
        }
    }

    // Check if online
    isOnline() {
        return navigator.onLine;
    }

    // Store prescription offline
    async storePrescriptionOffline(prescriptionData) {
        const stored = await this.storeOffline('prescriptions', prescriptionData);
        if (stored) {
            await this.addToSyncQueue('add_prescription', prescriptionData);
            if (window.ui) window.ui.showToast('Prescription saved offline. Will sync when online.', 'info');
        }
        return stored;
    }

    // Store vital offline
    async storeVitalOffline(vitalData) {
        const stored = await this.storeOffline('vitals', vitalData);
        if (stored) {
            await this.addToSyncQueue('add_vital', vitalData);
            if (window.ui) window.ui.showToast('Vital signs saved offline. Will sync when online.', 'info');
        }
        return stored;
    }

    // Get combined data (online + offline)
    async getCombinedPrescriptions() {
        const offlineData = await this.getOfflineData('prescriptions');
        
        if (this.isOnline()) {
            try {
                const onlineData = await window.api.getPrescriptions();
                return [...onlineData.results || onlineData, ...offlineData];
            } catch (error) {
                console.error('Failed to fetch online prescriptions:', error);
                
                // Use global error handler if available
                if (window.errorHandler) {
                    window.errorHandler.handleError(error, {
                        action: 'fetch prescriptions',
                        type: 'network',
                        retryable: true
                    });
                }
                return offlineData;
            }
        }
        
        return offlineData;
    }

    async getCombinedVitals() {
        const offlineData = await this.getOfflineData('vitals');
        
        if (this.isOnline()) {
            try {
                const onlineData = await window.api.getVitals();
                return [...onlineData.results || onlineData, ...offlineData];
            } catch (error) {
                console.error('Failed to fetch online vitals:', error);
                
                // Use global error handler if available
                if (window.errorHandler) {
                    window.errorHandler.handleError(error, {
                        action: 'fetch vitals',
                        type: 'network',
                        retryable: true
                    });
                }
                return offlineData;
            }
        }
        
        return offlineData;
    }
}

// Global offline manager instance
window.offline = new OfflineManager();

// Setup network monitoring and periodic cleanup
window.addEventListener('DOMContentLoaded', () => {
    window.offline.setupNetworkMonitoring();
    
    // Periodic cleanup tasks
    setInterval(() => {
        window.offline.cleanupSyncQueue();
        window.offline.cleanupExpiredCache();
    }, 60 * 60 * 1000); // Every hour
});

// Auto-sync when coming online
window.addEventListener('online', () => {
    window.offline.syncOfflineData();
});

// Enhanced API methods that work offline
document.addEventListener('DOMContentLoaded', () => {
    if (window.api) {
        const originalUploadPrescription = window.api.uploadPrescription;
        window.api.uploadPrescription = async function(formData) {
            if (window.offline.isOnline()) {
                try {
                    return await originalUploadPrescription.call(this, formData);
                } catch (error) {
                    // If online request fails, store offline
                    const prescriptionData = Object.fromEntries(formData);
                    await window.offline.storePrescriptionOffline(prescriptionData);
                    throw error;
                }
            } else {
                // Store offline
                const prescriptionData = Object.fromEntries(formData);
                await window.offline.storePrescriptionOffline(prescriptionData);
                return { id: Date.now(), offline: true };
            }
        };

        const originalAddVital = window.api.addVital;
        window.api.addVital = async function(vitalData) {
            if (window.offline.isOnline()) {
                try {
                    return await originalAddVital.call(this, vitalData);
                } catch (error) {
                    // If online request fails, store offline
                    await window.offline.storeVitalOffline(vitalData);
                    throw error;
                }
            } else {
                // Store offline
                await window.offline.storeVitalOffline(vitalData);
                return { id: Date.now(), offline: true };
            }
        };
    }
});