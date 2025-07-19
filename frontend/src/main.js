import './style.css'
import './error-handler.js'  // Load error handler first
import './navigation.js'
import './navigation-updater.js'  // Navigation enhancement
import './localization.js'
import './api.js'
import './auth.js'
import './ui.js'
import './offline.js'
import { router } from './router.js'  // Import hybrid router

/**
 * Main Application Entry Point
 * Initializes the app and handles routing
 */

class HealthGuideApp {
    constructor() {
        this.router = router;
        this.init();
    }

    init() {
        // Initialize router first
        console.log('Initializing Health Guide App with hybrid routing');
        
        // Check authentication and handle redirects
        this.handleAuthentication();

        // Initialize hijack indicator if user is authenticated
        if (window.auth && window.auth.isAuthenticated()) {
            window.auth.initializeHijackIndicator();
        }
        
        // Set up global event listeners
        this.setupGlobalListeners();
        
        // Initialize PWA features
        this.initializePWA();
        
        // Router is already initialized in its constructor
        console.log('App initialization complete');
    }

    /**
     * Handle authentication redirects
     */
    handleAuthentication() {
        if (!window.auth) return;
        
        const currentPath = this.router.getCurrentPath();
        const isAuthenticated = window.auth.isAuthenticated();
        
        // Redirect authenticated users from login/signup pages
        if (isAuthenticated && (currentPath === '/login' || currentPath === '/signup' || currentPath === '/')) {
            this.router.navigate('/dashboard');
            return;
        }
        
        // Redirect unauthenticated users from protected pages
        const protectedPages = ['/dashboard', '/prescriptions', '/vitals', '/reports', '/emergency', '/profile'];
        if (!isAuthenticated && protectedPages.includes(currentPath)) {
            this.router.navigate('/login');
            return;
        }
    }

    initializePage() {
        const path = window.location.pathname;
        
        if (path === '/' || path.includes('index')) {
            this.initializeLandingPage();
        } else if (path.includes('dashboard')) {
            this.initializeDashboard();
        }
    }

    initializeLandingPage() {
        console.log('Landing page initialized');
    }

    initializeDashboard() {
        if (typeof window.loadDashboardData === 'function') {
            window.loadDashboardData();
        }
    }

    setupGlobalListeners() {
        // Handle offline/online status
        window.addEventListener('online', () => {
            this.hideOfflineIndicator();
            if (window.ui && window.t) window.ui.showToast(window.t('msg.connection.restored'), 'success');
        });

        window.addEventListener('offline', () => {
            this.showOfflineIndicator();
            if (window.ui && window.t) window.ui.showToast(window.t('msg.offline'), 'warning');
        });

        // Handle emergency button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'emergency-btn') {
                this.handleEmergencyAlert();
            }
        });

        // Handle voice button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'voice-btn') {
                this.handleVoiceCommand();
            }
        });
    }

    initializePWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        }

        // Handle PWA install prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallPrompt();
        });

        // Handle PWA install
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            if (window.ui) window.ui.showToast('App installed successfully!', 'success');
        });
    }

    showInstallPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'pwa-install-prompt';
        prompt.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h4 class="font-semibold">Install Health Guide</h4>
                    <p class="text-sm opacity-90">Add to your home screen for quick access</p>
                </div>
                <div class="space-x-2">
                    <button id="install-dismiss" class="btn btn-sm btn-ghost">Later</button>
                    <button id="install-accept" class="btn btn-sm btn-accent">Install</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(prompt);

        document.getElementById('install-accept').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
            }
            prompt.remove();
        });

        document.getElementById('install-dismiss').addEventListener('click', () => {
            prompt.remove();
        });
    }

    showOfflineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.classList.remove('hidden');
        }
    }

    hideOfflineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
    }

    async handleEmergencyAlert() {
        if (!confirm(window.t ? window.t('msg.emergency.confirm') : 'Send emergency alert to your contacts?')) {
            return;
        }

        try {
            // Get user's location if available
            let location = {};
            if (navigator.geolocation) {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                location = {
                    location_lat: position.coords.latitude,
                    location_lng: position.coords.longitude
                };
            }

            if (window.api) {
                await window.api.sendEmergencyAlert({
                    message: 'Emergency alert sent from Health Guide app',
                    ...location
                });

                if (window.ui) window.ui.showSuccess(window.t ? window.t('msg.emergency.sent') : 'Emergency alert sent to your contacts!');
            }
        } catch (error) {
            console.error('Emergency alert failed:', error);
            
            // Use global error handler if available
            if (window.errorHandler) {
                window.errorHandler.handleError(error, {
                    action: 'send emergency alert',
                    retryable: true,
                    retryCallback: () => this.handleEmergencyAlert()
                });
            } else if (window.ui) {
                window.ui.showToast(window.t ? window.t('msg.emergency.failed') : 'Failed to send emergency alert', 'error');
            }
        }
    }

    handleVoiceCommand() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            if (window.ui) window.ui.showToast(window.t ? window.t('msg.voice.not.supported') : 'Voice recognition not supported in this browser', 'error');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'ar-EG'; // Egyptian Arabic
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            if (window.ui) window.ui.showToast(window.t ? window.t('msg.voice.listening') : 'Listening... Speak now', 'info');
            const voiceBtn = document.getElementById('voice-btn');
            if (voiceBtn) voiceBtn.textContent = '🔴';
        };

        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase();
            this.processVoiceCommand(command);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (window.ui) window.ui.showToast(window.t ? window.t('msg.voice.failed') : 'Voice recognition failed', 'error');
        };

        recognition.onend = () => {
            const voiceBtn = document.getElementById('voice-btn');
            if (voiceBtn) voiceBtn.textContent = '🎤';
        };

        recognition.start();
    }

    processVoiceCommand(command) {
        console.log('Voice command:', command);
        
        // Simple command processing (can be enhanced with NLP)
        if (command.includes('scan') || command.includes('prescription')) {
            if (window.showPrescriptionScanner) window.showPrescriptionScanner();
        } else if (command.includes('vital') || command.includes('blood')) {
            if (window.showVitalsForm) window.showVitalsForm();
        } else if (command.includes('emergency') || command.includes('help')) {
            this.handleEmergencyAlert();
        } else {
            if (window.ui) window.ui.showToast(window.t ? window.t('msg.command.not.recognized') : 'Command not recognized. Try "scan prescription" or "log vitals"', 'info');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HealthGuideApp();
});

// Global functions for backward compatibility
window.logout = function() {
    if (window.auth) window.auth.logout();
}

window.showProfile = function() {
<<<<<<< HEAD
    if (window.router) {
        window.router.navigate('/profile');
    } else {
        window.location.href = '/profile.html';
    }
=======
    window.location.href = 'profile.html';
>>>>>>> 06cf30c (feat: Implement comprehensive profile management module)
}

window.generateReport = function() {
    if (window.router) {
        window.router.navigate('/reports');
    } else {
        window.location.href = '/reports.html';
    }
}

window.showEmergencyContacts = function() {
    if (window.router) {
        window.router.navigate('/emergency');
    } else {
        window.location.href = '/emergency.html';
    }
}

// Additional navigation helpers
window.navigateTo = function(path) {
    if (window.router) {
        window.router.navigate(path);
    } else {
        window.location.href = path + '.html';
    }
}