/**
 * Comprehensive Permission Management System
 * Handles all device permissions with graceful fallbacks and user-friendly explanations
 */

class PermissionManager {
    constructor() {
        this.permissions = {
            camera: false,
            microphone: false,
            location: false,
            notifications: false,
            storage: false
        };
        
        this.permissionStatus = {
            camera: 'unknown',
            microphone: 'unknown',
            location: 'unknown',
            notifications: 'unknown',
            storage: 'unknown'
        };
        
        this.fallbackCallbacks = new Map();
        this.init();
    }

    /**
     * Initialize permission manager
     */
    init() {
        console.log('Initializing Permission Manager');
        this.checkExistingPermissions();
    }

    /**
     * Check existing permissions on initialization
     */
    async checkExistingPermissions() {
        // Check notification permission
        if ('Notification' in window) {
            this.permissions.notifications = Notification.permission === 'granted';
            this.permissionStatus.notifications = Notification.permission;
        }

        // Check storage permission
        if ('storage' in navigator && 'persist' in navigator.storage) {
            try {
                const persistent = await navigator.storage.persisted();
                this.permissions.storage = persistent;
                this.permissionStatus.storage = persistent ? 'granted' : 'prompt';
            } catch (error) {
                console.warn('Storage permission check failed:', error);
                this.permissions.storage = true; // Assume granted if check fails
                this.permissionStatus.storage = 'granted';
            }
        } else {
            this.permissions.storage = true; // Assume granted if not supported
            this.permissionStatus.storage = 'granted';
        }

        console.log('Initial permission status:', this.permissionStatus);
    }

    /**
     * Request camera permission for prescription scanning
     * @returns {Promise<boolean>} Permission granted status
     */
    async requestCameraPermission() {
        try {
            console.log('Requesting camera permission...');
            
            // Show explanation before requesting
            this.showPermissionExplanation('camera');
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment' // Prefer back camera for document scanning
                } 
            });
            
            // Stop the stream immediately as we only needed permission
            stream.getTracks().forEach(track => track.stop());
            
            this.permissions.camera = true;
            this.permissionStatus.camera = 'granted';
            
            console.log('Camera permission granted');
            this.showPermissionSuccess('camera');
            
            return true;
        } catch (error) {
            console.warn('Camera permission denied:', error);
            this.permissions.camera = false;
            this.permissionStatus.camera = 'denied';
            
            this.handlePermissionDenied('camera', error);
            return false;
        }
    }

    /**
     * Request microphone permission for voice commands
     * @returns {Promise<boolean>} Permission granted status
     */
    async requestMicrophonePermission() {
        try {
            console.log('Requesting microphone permission...');
            
            // Show explanation before requesting
            this.showPermissionExplanation('microphone');
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Stop the stream immediately as we only needed permission
            stream.getTracks().forEach(track => track.stop());
            
            this.permissions.microphone = true;
            this.permissionStatus.microphone = 'granted';
            
            console.log('Microphone permission granted');
            this.showPermissionSuccess('microphone');
            
            return true;
        } catch (error) {
            console.warn('Microphone permission denied:', error);
            this.permissions.microphone = false;
            this.permissionStatus.microphone = 'denied';
            
            this.handlePermissionDenied('microphone', error);
            return false;
        }
    }

    /**
     * Request location permission for emergency alerts
     * @returns {Promise<boolean>} Permission granted status
     */
    async requestLocationPermission() {
        return new Promise((resolve) => {
            console.log('Requesting location permission...');
            
            // Show explanation before requesting
            this.showPermissionExplanation('location');
            
            if (!navigator.geolocation) {
                console.warn('Geolocation not supported');
                this.permissions.location = false;
                this.permissionStatus.location = 'denied';
                this.handlePermissionDenied('location', new Error('Geolocation not supported'));
                resolve(false);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('Location permission granted');
                    this.permissions.location = true;
                    this.permissionStatus.location = 'granted';
                    this.showPermissionSuccess('location');
                    resolve(true);
                },
                (error) => {
                    console.warn('Location permission denied:', error);
                    this.permissions.location = false;
                    this.permissionStatus.location = 'denied';
                    this.handlePermissionDenied('location', error);
                    resolve(false);
                },
                {
                    timeout: 10000,
                    maximumAge: 300000, // 5 minutes
                    enableHighAccuracy: false
                }
            );
        });
    }

    /**
     * Request notification permission for medication reminders
     * @returns {Promise<boolean>} Permission granted status
     */
    async requestNotificationPermission() {
        try {
            console.log('Requesting notification permission...');
            
            if (!('Notification' in window)) {
                console.warn('Notifications not supported');
                this.permissions.notifications = false;
                this.permissionStatus.notifications = 'denied';
                this.handlePermissionDenied('notifications', new Error('Notifications not supported'));
                return false;
            }

            // Show explanation before requesting
            this.showPermissionExplanation('notifications');
            
            const permission = await Notification.requestPermission();
            
            this.permissions.notifications = permission === 'granted';
            this.permissionStatus.notifications = permission;
            
            if (permission === 'granted') {
                console.log('Notification permission granted');
                this.showPermissionSuccess('notifications');
                return true;
            } else {
                console.warn('Notification permission denied');
                this.handlePermissionDenied('notifications', new Error('Permission denied'));
                return false;
            }
        } catch (error) {
            console.warn('Notification permission request failed:', error);
            this.permissions.notifications = false;
            this.permissionStatus.notifications = 'denied';
            this.handlePermissionDenied('notifications', error);
            return false;
        }
    }

    /**
     * Request storage permission for offline functionality
     * @returns {Promise<boolean>} Permission granted status
     */
    async requestStoragePermission() {
        try {
            console.log('Requesting storage permission...');
            
            if (!('storage' in navigator && 'persist' in navigator.storage)) {
                console.log('Persistent storage not supported, assuming granted');
                this.permissions.storage = true;
                this.permissionStatus.storage = 'granted';
                return true;
            }

            // Show explanation before requesting
            this.showPermissionExplanation('storage');
            
            const persistent = await navigator.storage.persist();
            
            this.permissions.storage = persistent;
            this.permissionStatus.storage = persistent ? 'granted' : 'denied';
            
            if (persistent) {
                console.log('Storage permission granted');
                this.showPermissionSuccess('storage');
                return true;
            } else {
                console.warn('Storage permission denied');
                this.handlePermissionDenied('storage', new Error('Persistent storage denied'));
                return false;
            }
        } catch (error) {
            console.warn('Storage permission request failed:', error);
            // Assume granted if request fails
            this.permissions.storage = true;
            this.permissionStatus.storage = 'granted';
            return true;
        }
    }

    /**
     * Request all permissions at once
     * @returns {Promise<Object>} Object with permission results
     */
    async requestAllPermissions() {
        console.log('Requesting all permissions...');
        
        const results = {
            camera: await this.requestCameraPermission(),
            microphone: await this.requestMicrophonePermission(),
            location: await this.requestLocationPermission(),
            notifications: await this.requestNotificationPermission(),
            storage: await this.requestStoragePermission()
        };
        
        console.log('All permissions requested:', results);
        return results;
    }

    /**
     * Check if a specific permission is granted
     * @param {string} permission - Permission type
     * @returns {boolean} Permission status
     */
    hasPermission(permission) {
        return this.permissions[permission] || false;
    }

    /**
     * Get all permission statuses
     * @returns {Object} All permission statuses
     */
    getAllPermissions() {
        return { ...this.permissions };
    }

    /**
     * Get permission status (granted, denied, prompt)
     * @param {string} permission - Permission type
     * @returns {string} Permission status
     */
    getPermissionStatus(permission) {
        return this.permissionStatus[permission] || 'unknown';
    }

    /**
     * Register fallback callback for when permission is denied
     * @param {string} permission - Permission type
     * @param {Function} callback - Fallback function
     */
    registerFallback(permission, callback) {
        this.fallbackCallbacks.set(permission, callback);
    }

    /**
     * Handle permission denied with graceful fallbacks
     * @param {string} type - Permission type
     * @param {Error} error - Error object
     */
    handlePermissionDenied(type, error) {
        console.warn(`${type} permission denied:`, error);
        
        // Show user-friendly message with instructions
        this.showPermissionFallback(type);
        
        // Execute registered fallback if available
        const fallback = this.fallbackCallbacks.get(type);
        if (fallback && typeof fallback === 'function') {
            try {
                fallback();
            } catch (fallbackError) {
                console.error(`Fallback for ${type} failed:`, fallbackError);
            }
        }
    }

    /**
     * Show permission explanation before requesting
     * @param {string} type - Permission type
     */
    showPermissionExplanation(type) {
        const explanations = {
            camera: {
                title: window.t ? window.t('permissions.camera.title') : 'Camera Access',
                message: window.t ? window.t('permissions.camera.explanation') : 'We need camera access to scan prescription images and extract medication information automatically.',
                icon: '📷'
            },
            microphone: {
                title: window.t ? window.t('permissions.microphone.title') : 'Microphone Access',
                message: window.t ? window.t('permissions.microphone.explanation') : 'We need microphone access to enable voice commands for hands-free health data entry.',
                icon: '🎤'
            },
            location: {
                title: window.t ? window.t('permissions.location.title') : 'Location Access',
                message: window.t ? window.t('permissions.location.explanation') : 'We need location access to include your location in emergency alerts for faster response.',
                icon: '📍'
            },
            notifications: {
                title: window.t ? window.t('permissions.notifications.title') : 'Notification Access',
                message: window.t ? window.t('permissions.notifications.explanation') : 'We need notification access to remind you about medication schedules and health checkups.',
                icon: '🔔'
            },
            storage: {
                title: window.t ? window.t('permissions.storage.title') : 'Storage Access',
                message: window.t ? window.t('permissions.storage.explanation') : 'We need persistent storage to keep your health data available offline and ensure it\'s not lost.',
                icon: '💾'
            }
        };

        const explanation = explanations[type];
        if (explanation && window.ui) {
            // Show a brief explanation toast
            window.ui.showToast(`${explanation.icon} ${explanation.title}: ${explanation.message}`, 'info', 5000);
        }
    }

    /**
     * Show permission success message
     * @param {string} type - Permission type
     */
    showPermissionSuccess(type) {
        const messages = {
            camera: window.t ? window.t('permissions.camera.granted') : '📷 Camera access granted! You can now scan prescriptions.',
            microphone: window.t ? window.t('permissions.microphone.granted') : '🎤 Microphone access granted! Voice commands are now available.',
            location: window.t ? window.t('permissions.location.granted') : '📍 Location access granted! Emergency alerts will include your location.',
            notifications: window.t ? window.t('permissions.notifications.granted') : '🔔 Notifications enabled! You\'ll receive medication reminders.',
            storage: window.t ? window.t('permissions.storage.granted') : '💾 Storage access granted! Your data will be available offline.'
        };

        if (messages[type] && window.ui) {
            window.ui.showToast(messages[type], 'success');
        }
    }

    /**
     * Show fallback message when permission is denied
     * @param {string} type - Permission type
     */
    showPermissionFallback(type) {
        const fallbacks = {
            camera: {
                message: window.t ? window.t('permissions.camera.fallback') : 'Camera access denied. You can still upload prescription images from your device gallery.',
                action: 'Use File Upload'
            },
            microphone: {
                message: window.t ? window.t('permissions.microphone.fallback') : 'Microphone access denied. Voice commands are disabled, but you can use the manual interface.',
                action: 'Use Manual Input'
            },
            location: {
                message: window.t ? window.t('permissions.location.fallback') : 'Location access denied. Emergency alerts will work without location, but may be less effective.',
                action: 'Continue Without Location'
            },
            notifications: {
                message: window.t ? window.t('permissions.notifications.fallback') : 'Notifications disabled. You won\'t receive medication reminders, but can check manually.',
                action: 'Check Manually'
            },
            storage: {
                message: window.t ? window.t('permissions.storage.fallback') : 'Persistent storage denied. App may have limited offline functionality.',
                action: 'Continue with Limited Offline'
            }
        };

        const fallback = fallbacks[type];
        if (fallback && window.ui) {
            window.ui.showToast(`⚠️ ${fallback.message}`, 'warning', 8000);
        }
    }

    /**
     * Show permission settings help
     * @param {string} type - Permission type
     */
    showPermissionHelp(type) {
        const helpMessages = {
            camera: 'To enable camera access: Go to browser settings → Site permissions → Camera → Allow',
            microphone: 'To enable microphone access: Go to browser settings → Site permissions → Microphone → Allow',
            location: 'To enable location access: Go to browser settings → Site permissions → Location → Allow',
            notifications: 'To enable notifications: Go to browser settings → Site permissions → Notifications → Allow',
            storage: 'Storage permissions are managed automatically by your browser.'
        };

        const message = helpMessages[type] || 'Check your browser settings to manage permissions.';
        
        if (window.ui) {
            window.ui.showModal('Permission Help', `
                <div class="space-y-4">
                    <p>${message}</p>
                    <div class="alert alert-info">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>After changing permissions, please refresh the page for changes to take effect.</span>
                    </div>
                </div>
            `);
        }
    }

    /**
     * Test a specific permission without requesting it
     * @param {string} type - Permission type
     * @returns {Promise<string>} Permission status
     */
    async testPermission(type) {
        try {
            switch (type) {
                case 'camera':
                    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                        return 'not-supported';
                    }
                    // We can't test without requesting, so return current status
                    return this.permissionStatus.camera;

                case 'microphone':
                    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                        return 'not-supported';
                    }
                    return this.permissionStatus.microphone;

                case 'location':
                    if (!navigator.geolocation) {
                        return 'not-supported';
                    }
                    return this.permissionStatus.location;

                case 'notifications':
                    if (!('Notification' in window)) {
                        return 'not-supported';
                    }
                    return Notification.permission;

                case 'storage':
                    if (!('storage' in navigator && 'persist' in navigator.storage)) {
                        return 'not-supported';
                    }
                    const persistent = await navigator.storage.persisted();
                    return persistent ? 'granted' : 'prompt';

                default:
                    return 'unknown';
            }
        } catch (error) {
            console.warn(`Testing ${type} permission failed:`, error);
            return 'error';
        }
    }

    /**
     * Get user-friendly permission status text
     * @param {string} type - Permission type
     * @returns {string} Status text
     */
    getPermissionStatusText(type) {
        const status = this.getPermissionStatus(type);
        const statusTexts = {
            granted: window.t ? window.t('permissions.status.granted') : 'Granted ✅',
            denied: window.t ? window.t('permissions.status.denied') : 'Denied ❌',
            prompt: window.t ? window.t('permissions.status.prompt') : 'Not requested ⏳',
            'not-supported': window.t ? window.t('permissions.status.not_supported') : 'Not supported ⚠️',
            unknown: window.t ? window.t('permissions.status.unknown') : 'Unknown ❓'
        };

        return statusTexts[status] || statusTexts.unknown;
    }

    /**
     * Handle medication reminder permission request
     * Called when user enables medication reminders
     * @returns {Promise<boolean>} Permission granted status
     */
    async handleMedicationReminderPermission() {
        console.log('Handling medication reminder permission...');
        
        const hasNotificationPermission = await this.requestNotificationPermission();
        
        if (hasNotificationPermission) {
            // Test notification to confirm it works
            this.sendTestNotification();
            return true;
        } else {
            // Show fallback options
            if (window.ui) {
                window.ui.showToast(
                    'Medication reminders will be available in the app, but you won\'t receive push notifications.',
                    'warning',
                    5000
                );
            }
            return false;
        }
    }

    /**
     * Send a test notification to confirm permissions work
     */
    sendTestNotification() {
        if (this.permissions.notifications && 'Notification' in window) {
            try {
                new Notification('Health Guide', {
                    body: 'Medication reminders are now enabled! 💊',
                    icon: '/public/icons/icon-192x192.png',
                    badge: '/public/icons/icon-192x192.png',
                    tag: 'test-notification',
                    requireInteraction: false
                });
            } catch (error) {
                console.warn('Failed to send test notification:', error);
            }
        }
    }

    /**
     * Schedule a medication reminder notification
     * @param {Object} medication - Medication details
     * @param {Date} reminderTime - When to remind
     */
    scheduleMedicationReminder(medication, reminderTime) {
        if (!this.permissions.notifications) {
            console.warn('Notifications not permitted, cannot schedule reminder');
            return false;
        }

        const now = new Date();
        const delay = reminderTime.getTime() - now.getTime();

        if (delay <= 0) {
            console.warn('Reminder time is in the past');
            return false;
        }

        setTimeout(() => {
            if ('Notification' in window && this.permissions.notifications) {
                new Notification('Medication Reminder', {
                    body: `Time to take your ${medication.name} (${medication.dosage})`,
                    icon: '/public/icons/icon-192x192.png',
                    badge: '/public/icons/icon-192x192.png',
                    tag: `medication-${medication.id}`,
                    requireInteraction: true,
                    actions: [
                        {
                            action: 'taken',
                            title: 'Mark as Taken'
                        },
                        {
                            action: 'snooze',
                            title: 'Remind Later'
                        }
                    ]
                });
            }
        }, delay);

        return true;
    }
}

// Create global instance
const permissionManager = new PermissionManager();

// Export for module usage
export { PermissionManager, permissionManager };

// Make available globally for backward compatibility
window.permissions = permissionManager;
window.PermissionManager = PermissionManager;

console.log('Permission Manager loaded and available globally');