/**
 * Push Notifications Manager
 * Handles medication reminders, emergency alerts, and notification preferences
 */

class PushNotificationManager {
    constructor() {
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        this.permission = Notification.permission;
        this.subscription = null;
        this.vapidPublicKey = null; // Will be set from backend
        this.notificationTypes = {
            MEDICATION_REMINDER: 'medication_reminder',
            EMERGENCY_ALERT: 'emergency_alert',
            HEALTH_TIP: 'health_tip',
            APPOINTMENT_REMINDER: 'appointment_reminder',
            VITALS_REMINDER: 'vitals_reminder'
        };
        this.init();
    }

    async init() {
        if (!this.isSupported) {
            console.warn('[PushNotifications] Push notifications not supported');
            return;
        }

        try {
            // Get VAPID key from backend
            await this.getVapidKey();
            
            // Check existing subscription
            await this.checkExistingSubscription();
            
            console.log('[PushNotifications] Push notification manager initialized');
        } catch (error) {
            console.error('[PushNotifications] Failed to initialize:', error);
        }
    }

    async getVapidKey() {
        try {
            // For now, use a placeholder - in production this would come from backend
            this.vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLuxazjqAKVXTJtkTXaXWKB4qDjyUHHiMXRkk-5JW2g1AQ2J-9rqUw';
            
            // In production, fetch from backend:
            // const response = await window.api.getVapidKey();
            // this.vapidPublicKey = response.vapid_key;
        } catch (error) {
            console.error('[PushNotifications] Failed to get VAPID key:', error);
        }
    }

    async checkExistingSubscription() {
        if (!this.isSupported) return null;

        try {
            const registration = await navigator.serviceWorker.ready;
            this.subscription = await registration.pushManager.getSubscription();
            
            if (this.subscription) {
                console.log('[PushNotifications] Existing subscription found');
                // Verify subscription with backend
                await this.verifySubscription();
            }
            
            return this.subscription;
        } catch (error) {
            console.error('[PushNotifications] Failed to check existing subscription:', error);
            return null;
        }
    }

    async requestPermission() {
        if (!this.isSupported) {
            throw new Error('Push notifications not supported');
        }

        if (this.permission === 'granted') {
            return true;
        }

        if (this.permission === 'denied') {
            throw new Error('Push notifications are blocked. Please enable them in browser settings.');
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                console.log('[PushNotifications] Permission granted');
                return true;
            } else {
                throw new Error('Push notification permission denied');
            }
        } catch (error) {
            console.error('[PushNotifications] Failed to request permission:', error);
            throw error;
        }
    }

    async subscribe() {
        if (!this.isSupported) {
            throw new Error('Push notifications not supported');
        }

        try {
            // Request permission first
            await this.requestPermission();
            
            const registration = await navigator.serviceWorker.ready;
            
            // Subscribe to push notifications
            this.subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });
            
            console.log('[PushNotifications] Successfully subscribed');
            
            // Send subscription to backend
            await this.sendSubscriptionToBackend();
            
            return this.subscription;
        } catch (error) {
            console.error('[PushNotifications] Failed to subscribe:', error);
            throw error;
        }
    }

    async unsubscribe() {
        if (!this.subscription) {
            console.log('[PushNotifications] No active subscription to unsubscribe');
            return true;
        }

        try {
            const success = await this.subscription.unsubscribe();
            
            if (success) {
                // Remove subscription from backend
                await this.removeSubscriptionFromBackend();
                this.subscription = null;
                console.log('[PushNotifications] Successfully unsubscribed');
            }
            
            return success;
        } catch (error) {
            console.error('[PushNotifications] Failed to unsubscribe:', error);
            throw error;
        }
    }

    async sendSubscriptionToBackend() {
        if (!this.subscription) return;

        try {
            const subscriptionData = {
                endpoint: this.subscription.endpoint,
                keys: {
                    p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')),
                    auth: this.arrayBufferToBase64(this.subscription.getKey('auth'))
                }
            };

            // Send to backend API
            if (window.api && window.api.savePushSubscription) {
                await window.api.savePushSubscription(subscriptionData);
            } else {
                // Store locally for now
                localStorage.setItem('pushSubscription', JSON.stringify(subscriptionData));
            }
            
            console.log('[PushNotifications] Subscription sent to backend');
        } catch (error) {
            console.error('[PushNotifications] Failed to send subscription to backend:', error);
        }
    }

    async removeSubscriptionFromBackend() {
        try {
            if (window.api && window.api.removePushSubscription) {
                await window.api.removePushSubscription();
            } else {
                localStorage.removeItem('pushSubscription');
            }
            
            console.log('[PushNotifications] Subscription removed from backend');
        } catch (error) {
            console.error('[PushNotifications] Failed to remove subscription from backend:', error);
        }
    }

    async verifySubscription() {
        if (!this.subscription) return false;

        try {
            // Check if subscription is still valid
            const subscriptionData = {
                endpoint: this.subscription.endpoint,
                keys: {
                    p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')),
                    auth: this.arrayBufferToBase64(this.subscription.getKey('auth'))
                }
            };

            if (window.api && window.api.verifyPushSubscription) {
                const isValid = await window.api.verifyPushSubscription(subscriptionData);
                if (!isValid) {
                    console.log('[PushNotifications] Subscription invalid, resubscribing');
                    await this.subscribe();
                }
                return isValid;
            }
            
            return true;
        } catch (error) {
            console.error('[PushNotifications] Failed to verify subscription:', error);
            return false;
        }
    }

    // Medication reminder methods
    async scheduleMedicationReminder(prescription, reminderTime) {
        try {
            const reminderData = {
                type: this.notificationTypes.MEDICATION_REMINDER,
                prescription_id: prescription.id,
                medication_name: prescription.medication_name,
                dosage: prescription.dosage,
                reminder_time: reminderTime,
                user_id: prescription.user_id
            };

            if (window.api && window.api.schedulePushNotification) {
                await window.api.schedulePushNotification(reminderData);
            } else {
                // Store locally for offline scheduling
                const reminders = JSON.parse(localStorage.getItem('medicationReminders') || '[]');
                reminders.push({
                    ...reminderData,
                    id: Date.now(),
                    scheduled_at: new Date().toISOString()
                });
                localStorage.setItem('medicationReminders', JSON.stringify(reminders));
            }
            
            console.log('[PushNotifications] Medication reminder scheduled');
        } catch (error) {
            console.error('[PushNotifications] Failed to schedule medication reminder:', error);
        }
    }

    async cancelMedicationReminder(prescriptionId) {
        try {
            if (window.api && window.api.cancelPushNotification) {
                await window.api.cancelPushNotification({
                    type: this.notificationTypes.MEDICATION_REMINDER,
                    prescription_id: prescriptionId
                });
            } else {
                // Remove from local storage
                const reminders = JSON.parse(localStorage.getItem('medicationReminders') || '[]');
                const filtered = reminders.filter(r => r.prescription_id !== prescriptionId);
                localStorage.setItem('medicationReminders', JSON.stringify(filtered));
            }
            
            console.log('[PushNotifications] Medication reminder cancelled');
        } catch (error) {
            console.error('[PushNotifications] Failed to cancel medication reminder:', error);
        }
    }

    // Emergency alert methods
    async sendEmergencyAlert(alertData) {
        try {
            const emergencyNotification = {
                type: this.notificationTypes.EMERGENCY_ALERT,
                title: 'Emergency Alert',
                body: alertData.message || 'Emergency assistance requested',
                data: {
                    ...alertData,
                    timestamp: new Date().toISOString(),
                    urgent: true
                },
                requireInteraction: true,
                vibrate: [200, 100, 200, 100, 200],
                actions: [
                    {
                        action: 'acknowledge',
                        title: 'Acknowledge'
                    },
                    {
                        action: 'call_emergency',
                        title: 'Call Emergency Services'
                    }
                ]
            };

            if (window.api && window.api.sendEmergencyPushNotification) {
                await window.api.sendEmergencyPushNotification(emergencyNotification);
            } else {
                // Show local notification if possible
                if (this.permission === 'granted') {
                    new Notification(emergencyNotification.title, {
                        body: emergencyNotification.body,
                        icon: '/icons/icon-192x192.png',
                        badge: '/icons/badge-72x72.png',
                        vibrate: emergencyNotification.vibrate,
                        requireInteraction: emergencyNotification.requireInteraction
                    });
                }
            }
            
            console.log('[PushNotifications] Emergency alert sent');
        } catch (error) {
            console.error('[PushNotifications] Failed to send emergency alert:', error);
        }
    }

    // Notification preferences
    async getNotificationPreferences() {
        try {
            if (window.api && window.api.getNotificationPreferences) {
                return await window.api.getNotificationPreferences();
            } else {
                // Get from local storage
                const preferences = localStorage.getItem('notificationPreferences');
                return preferences ? JSON.parse(preferences) : this.getDefaultPreferences();
            }
        } catch (error) {
            console.error('[PushNotifications] Failed to get notification preferences:', error);
            return this.getDefaultPreferences();
        }
    }

    async updateNotificationPreferences(preferences) {
        try {
            if (window.api && window.api.updateNotificationPreferences) {
                await window.api.updateNotificationPreferences(preferences);
            } else {
                localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
            }
            
            console.log('[PushNotifications] Notification preferences updated');
        } catch (error) {
            console.error('[PushNotifications] Failed to update notification preferences:', error);
        }
    }

    getDefaultPreferences() {
        return {
            medication_reminders: true,
            emergency_alerts: true,
            health_tips: false,
            appointment_reminders: true,
            vitals_reminders: true,
            quiet_hours: {
                enabled: true,
                start: '22:00',
                end: '08:00'
            }
        };
    }

    // Test notification
    async sendTestNotification() {
        if (this.permission !== 'granted') {
            throw new Error('Notification permission not granted');
        }

        try {
            const testNotification = new Notification('Health Guide Test', {
                body: 'Push notifications are working correctly!',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/badge-72x72.png',
                vibrate: [100, 50, 100],
                data: {
                    test: true,
                    timestamp: new Date().toISOString()
                }
            });

            testNotification.onclick = () => {
                console.log('[PushNotifications] Test notification clicked');
                testNotification.close();
            };

            setTimeout(() => {
                testNotification.close();
            }, 5000);

            console.log('[PushNotifications] Test notification sent');
        } catch (error) {
            console.error('[PushNotifications] Failed to send test notification:', error);
            throw error;
        }
    }

    // Utility methods
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    // Status methods
    isSubscribed() {
        return this.subscription !== null;
    }

    getPermissionStatus() {
        return this.permission;
    }

    isSupported() {
        return this.isSupported;
    }
}

// Global push notification manager instance
window.pushNotifications = new PushNotificationManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PushNotificationManager;
}
