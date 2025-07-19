/**
 * Dashboard Page Module
 * Handles dashboard-specific functionality and data loading
 */

import { apiGetDashboardStats, apiGetRecentActivity } from '../api.js';
import { uiShowToast, uiShowLoading, uiHideLoading } from '../ui.js';
import { getTranslation } from '../localization.js';

class DashboardPage {
    constructor() {
        this.stats = null;
        this.recentActivity = [];
        this.refreshInterval = null;
    }

    /**
     * Initialize dashboard page
     */
    async init() {
        console.log('Initializing Dashboard Page');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load dashboard data
        await this.loadDashboardData();
        
        // Set up auto-refresh
        this.setupAutoRefresh();
    }

    /**
     * Set up event listeners for dashboard interactions
     */
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshDashboard());
        }

        // Quick action buttons
        const scanBtn = document.getElementById('quick-scan-prescription');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => this.navigateToScanner());
        }

        const vitalsBtn = document.getElementById('quick-log-vitals');
        if (vitalsBtn) {
            vitalsBtn.addEventListener('click', () => this.navigateToVitals());
        }

        const emergencyBtn = document.getElementById('quick-emergency');
        if (emergencyBtn) {
            emergencyBtn.addEventListener('click', () => this.handleEmergencyAlert());
        }
    }

    /**
     * Load dashboard data from API with enhanced error handling
     */
    async loadDashboardData() {
        try {
            // Show loading states for individual components
            this.showLoadingStates();
            
            // Load dashboard statistics with retry logic
            this.stats = await this.loadStatsWithFallback();
            this.renderStats();
            
            // Load recent activity with retry logic
            this.recentActivity = await this.loadActivityWithFallback();
            this.renderRecentActivity();
            
            // Update last refresh time
            this.updateLastRefreshTime();
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.handleLoadError(error);
        } finally {
            this.hideLoadingStates();
        }
    }

    /**
     * Load stats with fallback to offline data
     */
    async loadStatsWithFallback() {
        try {
            return await apiGetDashboardStats();
        } catch (error) {
            console.warn('Failed to load stats from API, using fallback:', error);
            
            // Fallback to basic counts if API fails
            return {
                prescriptions: 0,
                vitals: 0,
                reports: 0,
                emergencyContacts: 0,
                pendingPrescriptions: 0,
                recentVitals: 0
            };
        }
    }

    /**
     * Load activity with fallback to offline data
     */
    async loadActivityWithFallback() {
        try {
            return await apiGetRecentActivity();
        } catch (error) {
            console.warn('Failed to load activity from API, using fallback:', error);
            
            // Return empty activity if API fails
            return [];
        }
    }

    /**
     * Show loading states for dashboard components
     */
    showLoadingStates() {
        // Show loading for stats cards
        const statElements = [
            'prescription-count',
            'vitals-count', 
            'reports-count',
            'emergency-count'
        ];
        
        statElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '<span class="loading loading-spinner loading-sm"></span>';
            }
        });

        // Show loading for recent activity
        const activityContainer = document.getElementById('recent-activity');
        if (activityContainer) {
            activityContainer.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <span class="loading loading-spinner loading-lg text-primary"></span>
                </div>
            `;
        }
    }

    /**
     * Hide loading states
     */
    hideLoadingStates() {
        // Loading states are replaced by actual content in render methods
    }

    /**
     * Handle loading errors with user-friendly messages
     */
    handleLoadError(error) {
        let errorMessage = getTranslation('dashboard.loadError');
        
        if (error.status === 401) {
            errorMessage = getTranslation('auth.sessionExpired');
            // Redirect to login after showing error
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else if (error.status >= 500) {
            errorMessage = getTranslation('dashboard.serverError');
        } else if (!navigator.onLine) {
            errorMessage = getTranslation('dashboard.offlineError');
        }
        
        uiShowToast(errorMessage, 'error');
    }

    /**
     * Update last refresh time indicator
     */
    updateLastRefreshTime() {
        const refreshIndicator = document.getElementById('last-refresh');
        if (refreshIndicator) {
            const now = new Date();
            refreshIndicator.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }
    }

    /**
     * Render dashboard statistics with enhanced data
     */
    renderStats() {
        if (!this.stats) return;

        // Update prescription count with animation
        this.animateCountUpdate('prescription-count', this.stats.prescriptions || 0);
        
        // Update vitals count
        this.animateCountUpdate('vitals-count', this.stats.vitals || 0);
        
        // Update reports count
        this.animateCountUpdate('reports-count', this.stats.reports || 0);
        
        // Update emergency contacts count (if element exists)
        const emergencyCount = document.getElementById('emergency-count');
        if (emergencyCount) {
            this.animateCountUpdate('emergency-count', this.stats.emergencyContacts || 0);
        }

        // Add status indicators for pending items
        this.updateStatusIndicators();
    }

    /**
     * Animate count updates for better UX
     */
    animateCountUpdate(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const currentValue = parseInt(element.textContent) || 0;
        const increment = newValue > currentValue ? 1 : -1;
        const steps = Math.abs(newValue - currentValue);
        
        if (steps === 0) return;

        let current = currentValue;
        const stepTime = Math.min(50, 500 / steps); // Max 500ms total animation

        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            
            if (current === newValue) {
                clearInterval(timer);
            }
        }, stepTime);
    }

    /**
     * Update status indicators for pending items
     */
    updateStatusIndicators() {
        // Add pending prescriptions indicator
        if (this.stats.pendingPrescriptions > 0) {
            const prescriptionCard = document.getElementById('prescription-count')?.closest('.card');
            if (prescriptionCard) {
                const badge = document.createElement('div');
                badge.className = 'badge badge-warning badge-sm absolute -top-2 -right-2';
                badge.textContent = this.stats.pendingPrescriptions;
                badge.title = `${this.stats.pendingPrescriptions} pending processing`;
                prescriptionCard.style.position = 'relative';
                
                // Remove existing badge
                const existingBadge = prescriptionCard.querySelector('.badge');
                if (existingBadge) existingBadge.remove();
                
                prescriptionCard.appendChild(badge);
            }
        }

        // Add recent vitals indicator
        if (this.stats.recentVitals > 0) {
            const vitalsCard = document.getElementById('vitals-count')?.closest('.card');
            if (vitalsCard) {
                const indicator = document.createElement('div');
                indicator.className = 'w-3 h-3 bg-success rounded-full absolute top-2 right-2';
                indicator.title = 'Recent vitals logged';
                vitalsCard.style.position = 'relative';
                
                // Remove existing indicator
                const existingIndicator = vitalsCard.querySelector('.bg-success');
                if (existingIndicator) existingIndicator.remove();
                
                vitalsCard.appendChild(indicator);
            }
        }
    }

    /**
     * Render recent activity feed
     */
    renderRecentActivity() {
        const activityContainer = document.getElementById('recent-activity');
        if (!activityContainer) return;

        if (this.recentActivity.length === 0) {
            activityContainer.innerHTML = `
                <div class="text-center py-8 text-base-content/60">
                    <p data-i18n="dashboard.noActivity">${getTranslation('dashboard.noActivity')}</p>
                </div>
            `;
            return;
        }

        const activityHTML = this.recentActivity.map(activity => `
            <div class="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <div class="flex-1">
                    <p class="text-sm font-medium">${activity.title}</p>
                    <p class="text-xs text-base-content/60">${activity.timestamp}</p>
                </div>
            </div>
        `).join('');

        activityContainer.innerHTML = activityHTML;
    }

    /**
     * Refresh dashboard data
     */
    async refreshDashboard() {
        await this.loadDashboardData();
        uiShowToast(getTranslation('dashboard.refreshed'), 'success');
    }

    /**
     * Set up auto-refresh for dashboard data
     */
    setupAutoRefresh() {
        // Refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
    }

    /**
     * Navigate to prescription scanner
     */
    navigateToScanner() {
        if (window.router) {
            window.router.navigate('/prescriptions');
        } else {
            window.location.href = 'prescriptions.html';
        }
    }

    /**
     * Navigate to vitals page
     */
    navigateToVitals() {
        if (window.router) {
            window.router.navigate('/vitals');
        } else {
            window.location.href = 'vitals.html';
        }
    }

    /**
     * Handle emergency alert
     */
    async handleEmergencyAlert() {
        if (confirm(getTranslation('emergency.confirmAlert'))) {
            try {
                // This will be implemented in the emergency module
                uiShowToast(getTranslation('emergency.alertSent'), 'success');
            } catch (error) {
                console.error('Failed to send emergency alert:', error);
                uiShowToast(getTranslation('emergency.alertFailed'), 'error');
            }
        }
    }

    /**
     * Cleanup dashboard page
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Export for use in main.js
export { DashboardPage };