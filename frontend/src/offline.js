/**
 * Offline Functionality Module
 * Handles offline data storage and synchronization
 */

class OfflineManager {
    constructor() {
        this.dbName = 'HealthGuideDB';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    async init() {
        try {
            this.db = await this.openDB();
            console.log('IndexedDB initialized');
        } catch (error) {
            console.error('Failed to initialize IndexedDB:', error);
        }
    }

    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains('prescriptions')) {
                    const prescriptionStore = db.createObjectStore('prescriptions', { keyPath: 'id', autoIncrement: true });
                    prescriptionStore.createIndex('user_id', 'user_id', { unique: false });
                    prescriptionStore.createIndex('created_at', 'created_at', { unique: false });
                }

                if (!db.objectStoreNames.contains('vitals')) {
                    const vitalsStore = db.createObjectStore('vitals', { keyPath: 'id', autoIncrement: true });
                    vitalsStore.createIndex('user_id', 'user_id', { unique: false });
                    vitalsStore.createIndex('vital_type', 'vital_type', { unique: false });
                    vitalsStore.createIndex('recorded_at', 'recorded_at', { unique: false });
                }

                if (!db.objectStoreNames.contains('sync_queue')) {
                    db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
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
            return false;
        }
    }

    // Sync offline data when online
    async syncOfflineData() {
        if (!navigator.onLine || !this.db) return;

        try {
            const transaction = this.db.transaction(['sync_queue'], 'readwrite');
            const store = transaction.objectStore('sync_queue');
            const request = store.getAll();

            request.onsuccess = async () => {
                const queueItems = request.result.filter(item => !item.synced);
                
                for (const item of queueItems) {
                    try {
                        await this.syncItem(item);
                        
                        // Mark as synced
                        const updateTransaction = this.db.transaction(['sync_queue'], 'readwrite');
                        const updateStore = updateTransaction.objectStore('sync_queue');
                        item.synced = true;
                        await updateStore.put(item);
                        
                    } catch (error) {
                        console.error('Failed to sync item:', item, error);
                    }
                }
            };
        } catch (error) {
            console.error('Failed to sync offline data:', error);
        }
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
                return offlineData;
            }
        }
        
        return offlineData;
    }
}

// Global offline manager instance
window.offline = new OfflineManager();

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