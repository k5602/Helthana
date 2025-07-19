/**
 * PWA Installation Manager
 * Handles PWA installation prompts, updates, and related functionality
 */

class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.updateAvailable = false;
        this.registration = null;
        this.installPromptShown = localStorage.getItem('pwa-install-prompt-shown') === 'true';
        this.init();
    }

    async init() {
        try {
            // Check if already installed
            this.checkInstallationStatus();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Register service worker and check for updates
            await this.registerServiceWorker();
            
            console.log('[PWAInstaller] PWA installer initialized');
        } catch (error) {
            console.error('[PWAInstaller] Failed to initialize:', error);
        }
    }

    checkInstallationStatus() {
        // Check if running as installed PWA
        this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true ||
                          document.referrer.includes('android-app://');
        
        console.log('[PWAInstaller] Installation status:', this.isInstalled ? 'Installed' : 'Not installed');
    }

    setupEventListeners() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('[PWAInstaller] Install prompt available');
            e.preventDefault();
            this.deferredPrompt = e;
            
            // Show install prompt if not shown before and user is engaged
            if (!this.installPromptShown && this.shouldShowInstallPrompt()) {
                setTimeout(() => this.showInstallPrompt(), 3000); // Show after 3 seconds
            }
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('[PWAInstaller] PWA was installed');
            this.isInstalled = true;
            this.deferredPrompt = null;
            this.hideInstallPrompt();
            this.showInstallSuccessMessage();
        });

        // Listen for display mode changes
        window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
            this.isInstalled = e.matches;
            console.log('[PWAInstaller] Display mode changed:', e.matches ? 'Standalone' : 'Browser');
        });

        // Listen for service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SW_UPDATED') {
                    this.handleServiceWorkerUpdate(event.data);
                }
            });
        }
    }

    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('[PWAInstaller] Service workers not supported');
            return;
        }

        try {
            this.registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('[PWAInstaller] Service worker registered:', this.registration);

            // Check for updates
            this.registration.addEventListener('updatefound', () => {
                console.log('[PWAInstaller] Service worker update found');
                this.handleServiceWorkerUpdateFound();
            });

            // Check for waiting service worker
            if (this.registration.waiting) {
                this.showUpdatePrompt();
            }

        } catch (error) {
            console.error('[PWAInstaller] Service worker registration failed:', error);
        }
    }

    shouldShowInstallPrompt() {
        // Show install prompt based on user engagement
        const pageViews = parseInt(localStorage.getItem('pwa-page-views') || '0');
        const timeSpent = parseInt(localStorage.getItem('pwa-time-spent') || '0');
        
        // Show if user has viewed multiple pages or spent significant time
        return pageViews >= 3 || timeSpent >= 60000; // 1 minute
    }

    showInstallPrompt() {
        if (!this.deferredPrompt || this.isInstalled) return;

        const promptHTML = `
            <div id="pwa-install-prompt" class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-base-100 shadow-xl rounded-lg border border-base-300 z-50 transform transition-transform duration-300 translate-y-full">
                <div class="p-4">
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0">
                            <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="text-sm font-semibold text-base-content">Install Health Guide</h3>
                            <p class="text-xs text-base-content/70 mt-1">
                                Add to your home screen for quick access and offline functionality
                            </p>
                            <div class="flex space-x-2 mt-3">
                                <button id="pwa-install-accept" class="btn btn-primary btn-sm">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8l-8-8-8 8"></path>
                                    </svg>
                                    Install
                                </button>
                                <button id="pwa-install-dismiss" class="btn btn-ghost btn-sm">Later</button>
                            </div>
                        </div>
                        <button id="pwa-install-close" class="flex-shrink-0 text-base-content/50 hover:text-base-content">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing prompt if any
        this.hideInstallPrompt();

        // Add new prompt
        document.body.insertAdjacentHTML('beforeend', promptHTML);
        
        // Animate in
        setTimeout(() => {
            const prompt = document.getElementById('pwa-install-prompt');
            if (prompt) {
                prompt.classList.remove('translate-y-full');
            }
        }, 100);

        // Set up event listeners
        this.setupInstallPromptListeners();
    }

    setupInstallPromptListeners() {
        const acceptBtn = document.getElementById('pwa-install-accept');
        const dismissBtn = document.getElementById('pwa-install-dismiss');
        const closeBtn = document.getElementById('pwa-install-close');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => this.installPWA());
        }

        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => this.dismissInstallPrompt());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.dismissInstallPrompt());
        }
    }

    async installPWA() {
        if (!this.deferredPrompt) {
            console.warn('[PWAInstaller] No deferred prompt available');
            return;
        }

        try {
            // Show the install prompt
            this.deferredPrompt.prompt();
            
            // Wait for the user's response
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log('[PWAInstaller] User response to install prompt:', outcome);
            
            if (outcome === 'accepted') {
                console.log('[PWAInstaller] User accepted the install prompt');
            } else {
                console.log('[PWAInstaller] User dismissed the install prompt');
            }
            
            // Clear the deferred prompt
            this.deferredPrompt = null;
            this.hideInstallPrompt();
            
        } catch (error) {
            console.error('[PWAInstaller] Failed to install PWA:', error);
            if (window.ui) {
                window.ui.showToast('Failed to install app. Please try again.', 'error');
            }
        }
    }

    dismissInstallPrompt() {
        this.hideInstallPrompt();
        this.installPromptShown = true;
        localStorage.setItem('pwa-install-prompt-shown', 'true');
        
        // Don't show again for 7 days
        const dismissedUntil = new Date();
        dismissedUntil.setDate(dismissedUntil.getDate() + 7);
        localStorage.setItem('pwa-install-dismissed-until', dismissedUntil.toISOString());
    }

    hideInstallPrompt() {
        const prompt = document.getElementById('pwa-install-prompt');
        if (prompt) {
            prompt.classList.add('translate-y-full');
            setTimeout(() => prompt.remove(), 300);
        }
    }

    showInstallSuccessMessage() {
        if (window.ui) {
            window.ui.showToast('Health Guide installed successfully! 🎉', 'success');
        }
        
        // Track installation
        this.trackInstallation();
    }

    handleServiceWorkerUpdateFound() {
        const newWorker = this.registration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWAInstaller] New service worker installed, update available');
                this.updateAvailable = true;
                this.showUpdatePrompt();
            }
        });
    }

    handleServiceWorkerUpdate(data) {
        console.log('[PWAInstaller] Service worker updated:', data);
        this.updateAvailable = true;
        this.showUpdatePrompt();
    }

    showUpdatePrompt() {
        if (!this.updateAvailable) return;

        const updateHTML = `
            <div id="pwa-update-prompt" class="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-info text-info-content shadow-xl rounded-lg z-50 transform transition-transform duration-300 -translate-y-full">
                <div class="p-4">
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="text-sm font-semibold">Update Available</h3>
                            <p class="text-xs opacity-90 mt-1">
                                A new version of Health Guide is available with improvements and bug fixes.
                            </p>
                            <div class="flex space-x-2 mt-3">
                                <button id="pwa-update-accept" class="btn btn-sm bg-info-content text-info hover:bg-info-content/90">
                                    Update Now
                                </button>
                                <button id="pwa-update-dismiss" class="btn btn-ghost btn-sm text-info-content hover:bg-info-content/10">
                                    Later
                                </button>
                            </div>
                        </div>
                        <button id="pwa-update-close" class="flex-shrink-0 opacity-70 hover:opacity-100">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing update prompt
        this.hideUpdatePrompt();

        // Add new prompt
        document.body.insertAdjacentHTML('beforeend', updateHTML);
        
        // Animate in
        setTimeout(() => {
            const prompt = document.getElementById('pwa-update-prompt');
            if (prompt) {
                prompt.classList.remove('-translate-y-full');
            }
        }, 100);

        // Set up event listeners
        this.setupUpdatePromptListeners();
    }

    setupUpdatePromptListeners() {
        const acceptBtn = document.getElementById('pwa-update-accept');
        const dismissBtn = document.getElementById('pwa-update-dismiss');
        const closeBtn = document.getElementById('pwa-update-close');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => this.applyUpdate());
        }

        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => this.hideUpdatePrompt());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideUpdatePrompt());
        }
    }

    async applyUpdate() {
        try {
            if (this.registration && this.registration.waiting) {
                // Tell the waiting service worker to skip waiting
                this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                
                // Reload the page to activate the new service worker
                window.location.reload();
            }
        } catch (error) {
            console.error('[PWAInstaller] Failed to apply update:', error);
            if (window.ui) {
                window.ui.showToast('Failed to update app. Please refresh manually.', 'error');
            }
        }
    }

    hideUpdatePrompt() {
        const prompt = document.getElementById('pwa-update-prompt');
        if (prompt) {
            prompt.classList.add('-translate-y-full');
            setTimeout(() => prompt.remove(), 300);
        }
    }

    // Manual installation trigger
    async triggerInstall() {
        if (this.isInstalled) {
            if (window.ui) {
                window.ui.showToast('App is already installed', 'info');
            }
            return;
        }

        if (this.deferredPrompt) {
            await this.installPWA();
        } else {
            // Show manual installation instructions
            this.showManualInstallInstructions();
        }
    }

    showManualInstallInstructions() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        let instructions = '';
        
        if (isIOS) {
            instructions = `
                <div class="space-y-2 text-sm">
                    <p class="font-semibold">To install on iOS:</p>
                    <ol class="list-decimal list-inside space-y-1 text-xs">
                        <li>Tap the Share button <svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path></svg></li>
                        <li>Scroll down and tap "Add to Home Screen"</li>
                        <li>Tap "Add" to confirm</li>
                    </ol>
                </div>
            `;
        } else if (isAndroid) {
            instructions = `
                <div class="space-y-2 text-sm">
                    <p class="font-semibold">To install on Android:</p>
                    <ol class="list-decimal list-inside space-y-1 text-xs">
                        <li>Tap the menu button (⋮) in your browser</li>
                        <li>Select "Add to Home screen" or "Install app"</li>
                        <li>Tap "Add" or "Install" to confirm</li>
                    </ol>
                </div>
            `;
        } else {
            instructions = `
                <div class="space-y-2 text-sm">
                    <p class="font-semibold">To install on Desktop:</p>
                    <ol class="list-decimal list-inside space-y-1 text-xs">
                        <li>Look for the install icon in your browser's address bar</li>
                        <li>Click it and select "Install"</li>
                        <li>Or use your browser's menu to find "Install Health Guide"</li>
                    </ol>
                </div>
            `;
        }

        if (window.ui && window.ui.showModal) {
            window.ui.showModal('Install Health Guide', instructions);
        }
    }

    // Analytics and tracking
    trackInstallation() {
        try {
            const installData = {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                standalone: window.matchMedia('(display-mode: standalone)').matches
            };
            
            localStorage.setItem('pwa-install-data', JSON.stringify(installData));
            console.log('[PWAInstaller] Installation tracked:', installData);
        } catch (error) {
            console.error('[PWAInstaller] Failed to track installation:', error);
        }
    }

    trackPageView() {
        const pageViews = parseInt(localStorage.getItem('pwa-page-views') || '0') + 1;
        localStorage.setItem('pwa-page-views', pageViews.toString());
    }

    trackTimeSpent(milliseconds) {
        const timeSpent = parseInt(localStorage.getItem('pwa-time-spent') || '0') + milliseconds;
        localStorage.setItem('pwa-time-spent', timeSpent.toString());
    }

    // Status methods
    getInstallationStatus() {
        return {
            isInstalled: this.isInstalled,
            canInstall: !!this.deferredPrompt,
            updateAvailable: this.updateAvailable,
            promptShown: this.installPromptShown
        };
    }

    // Force check for updates
    async checkForUpdates() {
        if (this.registration) {
            try {
                await this.registration.update();
                console.log('[PWAInstaller] Checked for updates');
            } catch (error) {
                console.error('[PWAInstaller] Failed to check for updates:', error);
            }
        }
    }
}

// Global PWA installer instance
window.pwaInstaller = new PWAInstaller();

// Track page views for install prompt logic
window.addEventListener('DOMContentLoaded', () => {
    window.pwaInstaller.trackPageView();
});

// Track time spent on page
let pageStartTime = Date.now();
window.addEventListener('beforeunload', () => {
    const timeSpent = Date.now() - pageStartTime;
    window.pwaInstaller.trackTimeSpent(timeSpent);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAInstaller;
}