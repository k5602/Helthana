/**
 * Main Application Entry Point
 * Initializes the app and handles routing
 */

class HealthGuideApp {
    constructor() {
        this.init();
    }

    init() {
        // Check if user is authenticated and redirect accordingly
        if (auth.isAuthenticated() && window.location.pathname === '/') {
            window.location.href = '/dashboard.html';
            return;
        }
        
        if (!auth.isAuthenticated() && window.location.pathname.includes('dashboard')) {
            window.location.href = '/';
            return;
        }

        // Initialize page-specific functionality
        this.initializePage();
        
        // Set up global event listeners
        this.setupGlobalListeners();
        
        // Initialize PWA features
        this.initializePWA();
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
        // Landing page is already set up in HTML
        console.log('Landing page initialized');
    }

    initializeDashboard() {
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
    }

    setupGlobalListeners() {
        // Handle offline/online status
        window.addEventListener('online', () => {
            this.hideOfflineIndicator();
            ui.showToast('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.showOfflineIndicator();
            ui.showToast('You are now offline', 'warning');
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
            ui.showToast('App installed successfully!', 'success');
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
        if (!confirm('Send emergency alert to your contacts?')) {
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

            await api.sendEmergencyAlert({
                message: 'Emergency alert sent from Health Guide app',
                ...location
            });

            ui.showSuccess('Emergency alert sent to your contacts!');
        } catch (error) {
            console.error('Emergency alert failed:', error);
            ui.showToast('Failed to send emergency alert', 'error');
        }
    }

    handleVoiceCommand() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            ui.showToast('Voice recognition not supported in this browser', 'error');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'ar-EG'; // Egyptian Arabic
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            ui.showToast('Listening... Speak now', 'info');
            document.getElementById('voice-btn').textContent = '🔴';
        };

        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase();
            this.processVoiceCommand(command);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            ui.showToast('Voice recognition failed', 'error');
        };

        recognition.onend = () => {
            document.getElementById('voice-btn').textContent = '🎤';
        };

        recognition.start();
    }

    processVoiceCommand(command) {
        console.log('Voice command:', command);
        
        // Simple command processing (can be enhanced with NLP)
        if (command.includes('scan') || command.includes('prescription')) {
            showPrescriptionScanner();
        } else if (command.includes('vital') || command.includes('blood')) {
            showVitalsForm();
        } else if (command.includes('emergency') || command.includes('help')) {
            this.handleEmergencyAlert();
        } else {
            ui.showToast('Command not recognized. Try "scan prescription" or "log vitals"', 'info');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HealthGuideApp();
});

// Global functions for backward compatibility
function logout() {
    auth.logout();
}

function showProfile() {
    ui.showToast('Profile feature coming soon!', 'info');
}

function generateReport() {
    ui.showToast('Report generation feature coming soon!', 'info');
}

function showEmergencyContacts() {
    ui.showToast('Emergency contacts feature coming soon!', 'info');
}